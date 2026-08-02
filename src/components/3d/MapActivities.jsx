import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import { useGraphicsSystem } from '../../systems/useGraphicsSystem';
import { usePlayerSystem } from '../../systems/usePlayerSystem';
import { useAuraSystem } from '../../systems/useAuraSystem';
import { useCollisionSystem } from '../../systems/useCollisionSystem';
import { useMapActivitiesSystem } from '../../systems/useMapActivitiesSystem';
import { AuraCashGem } from './AuraCashGem';

const POTION_URL = '/itens/' + encodeURIComponent('poção2x.glb');

useGLTF.preload('/itens/bau.glb');
useGLTF.preload('/itens/chave.glb');
useGLTF.preload(POTION_URL);

function PromptLabel({ children, color = '#a855f7' }) {
    return (
        <Html position={[0, 2.2, 0]} center zIndexRange={[100, 0]}>
            <div
                style={{
                    background: 'rgba(15, 10, 28, 0.92)',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    userSelect: 'none',
                    border: `2px solid ${color}`,
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    boxShadow: `0 0 12px ${color}66`,
                    fontFamily: 'system-ui, sans-serif',
                    fontWeight: 700,
                    fontSize: '12px',
                    pointerEvents: 'none',
                }}
            >
                {children}
            </div>
        </Html>
    );
}

/** GLB clonado; sitOnGround sobe o modelo pra base tocar y=0 (pivot no centro). */
function ClonedGLB({ url, scale = 1, sitOnGround = false }) {
    const { scene } = useGLTF(url);
    const propCastShadows = useGraphicsSystem((s) => s.settings.propCastShadows);
    const copied = useMemo(() => {
        const clone = scene.clone(true);
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = propCastShadows;
                child.receiveShadow = true;
            }
        });
        if (sitOnGround) {
            clone.scale.setScalar(scale);
            clone.updateMatrixWorld(true);
            const box = new THREE.Box3().setFromObject(clone);
            if (Number.isFinite(box.min.y)) {
                clone.position.y -= box.min.y;
            }
        }
        return clone;
    }, [scene, propCastShadows, scale, sitOnGround]);

    if (sitOnGround) {
        return <primitive object={copied} />;
    }
    return <primitive object={copied} scale={scale} />;
}

function DailyChestHunt() {
    const keyFound = useMapActivitiesSystem((s) => s.keyFound);
    const chestOpened = useMapActivitiesSystem((s) => s.chestOpened);
    const chestIndex = useMapActivitiesSystem((s) => s.chestIndex);
    const keyIndex = useMapActivitiesSystem((s) => s.keyIndex);
    const chestPos = useMemo(
        () => useMapActivitiesSystem.getState().getChestPosition(),
        [chestIndex]
    );
    const keyPos = useMemo(
        () => useMapActivitiesSystem.getState().getKeyPosition(),
        [keyIndex]
    );
    const [nearKey, setNearKey] = useState(false);
    const keySpin = useRef();
    const registerObstacle = useCollisionSystem((s) => s.registerObstacle);
    const removeObstacle = useCollisionSystem((s) => s.removeObstacle);

    useEffect(() => {
        if (chestOpened) return undefined;
        registerObstacle('daily_chest', chestPos[0], chestPos[2], 1.2);
        return () => removeObstacle('daily_chest');
    }, [chestPos, chestOpened, registerObstacle, removeObstacle]);

    useFrame((_, delta) => {
        if (chestOpened) {
            useMapActivitiesSystem.getState().setNearChest(false);
            return;
        }

        const player = usePlayerSystem.getState().position;
        const dxC = player[0] - chestPos[0];
        const dzC = player[2] - chestPos[2];
        const chestNear = Math.hypot(dxC, dzC) < 3.2;
        useMapActivitiesSystem.getState().setNearChest(chestNear);

        if (!keyFound) {
            const dxK = player[0] - keyPos[0];
            const dzK = player[2] - keyPos[2];
            const distK = Math.hypot(dxK, dzK);
            const keyNear = distK < 2.8;
            setNearKey((prev) => (prev === keyNear ? prev : keyNear));
            if (distK < 1.5) {
                useMapActivitiesSystem.getState().collectKey();
            }
        }

        if (keySpin.current) {
            keySpin.current.rotation.y += delta * 2.2;
        }
    });

    useEffect(() => {
        return () => useMapActivitiesSystem.getState().setNearChest(false);
    }, []);

    if (chestOpened) return null;

    return (
        <>
            <group position={chestPos}>
                <ClonedGLB url="/itens/bau.glb" scale={2.8} sitOnGround />
            </group>

            {!keyFound && (
                <group position={keyPos}>
                    <group ref={keySpin}>
                        <group rotation={[-Math.PI / 2, 0, 0]}>
                            <ClonedGLB url="/itens/chave.glb" scale={0.85} />
                        </group>
                    </group>
                    {nearKey && (
                        <PromptLabel color="#fbbf24">Chave do baú!</PromptLabel>
                    )}
                </group>
            )}
        </>
    );
}

function FountainComboChallenge() {
    const fountainState = useMapActivitiesSystem((s) => s.fountainState);
    const gems = useMapActivitiesSystem((s) => s.gems);
    const lastComboChecked = useRef(-1);

    useFrame(() => {
        const player = usePlayerSystem.getState().position;
        const dist = Math.hypot(player[0], player[2]);
        const near = dist < 7.5;
        useMapActivitiesSystem.getState().setNearFountain(near);

        if (fountainState === 'challenge') {
            const combo = useAuraSystem.getState().comboCount;
            if (combo !== lastComboChecked.current) {
                lastComboChecked.current = combo;
                useMapActivitiesSystem.getState().tryCompleteFountainCombo(combo);
            }
        }

        if (fountainState === 'raining') {
            const playerPos = usePlayerSystem.getState().position;
            const liveGems = useMapActivitiesSystem.getState().gems;
            for (const gem of liveGems) {
                if (gem.collected) continue;
                const d = Math.hypot(playerPos[0] - gem.x, playerPos[2] - gem.z);
                if (d < 1.55) {
                    useMapActivitiesSystem.getState().collectGem(gem.id);
                }
            }
        }

        useMapActivitiesSystem.getState().clearToastIfExpired();
    });

    useEffect(() => {
        return () => useMapActivitiesSystem.getState().setNearFountain(false);
    }, []);

    if (fountainState === 'done') return null;

    return (
        <>
            {fountainState === 'raining' &&
                gems
                    .filter((g) => !g.collected)
                    .map((g) => (
                        <AuraCashGem
                            key={g.id}
                            position={[g.x, g.y, g.z]}
                            scale={0.28}
                            bobOffset={g.id * 0.37}
                        />
                    ))}
        </>
    );
}

function HourlyMapPotions() {
    const potionSpawns = useMapActivitiesSystem((s) => s.potionSpawns);
    const hourTick = useRef(0);

    useFrame((_, delta) => {
        hourTick.current += delta;
        if (hourTick.current > 20) {
            hourTick.current = 0;
            useMapActivitiesSystem.getState().ensureActive();
        }

        const player = usePlayerSystem.getState().position;
        const spawns = useMapActivitiesSystem.getState().potionSpawns;
        for (const p of spawns) {
            if (p.collected) continue;
            const d = Math.hypot(player[0] - p.x, player[2] - p.z);
            if (d < 1.7) {
                useMapActivitiesSystem.getState().collectPotion(p.id);
            }
        }
    });

    return (
        <group>
            {potionSpawns
                .filter((p) => !p.collected)
                .map((p) => (
                    <PotionPickup key={p.id} x={p.x} z={p.z} />
                ))}
        </group>
    );
}

function PotionPickup({ x, z }) {
    const ref = useRef();
    useFrame((state, delta) => {
        if (!ref.current) return;
        ref.current.rotation.y += delta * 1.2;
        ref.current.position.y = 0.85 + Math.sin(state.clock.elapsedTime * 2 + x) * 0.12;
    });

    return (
        <group ref={ref} position={[x, 0.85, z]}>
            <ClonedGLB url={POTION_URL} scale={0.7} />
            <pointLight color="#38bdf8" intensity={0.4} distance={2.5} />
        </group>
    );
}

/** Toast 2D flutuante é renderizado no GameHUD via mapToast do store. */
export function MapActivities() {
    useEffect(() => {
        // Fonte: nova missão só ao montar o mapa (não no tick horário)
        useMapActivitiesSystem.getState().ensureActive({ resetFountain: true });
    }, []);

    return (
        <group>
            <DailyChestHunt />
            <FountainComboChallenge />
            <HourlyMapPotions />
        </group>
    );
}
