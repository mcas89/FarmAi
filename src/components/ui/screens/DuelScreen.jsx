import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Trophy, Zap } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import { useDuelSystem } from '../../../systems/useDuelSystem';
import { sixSevenFrames } from '../../3d/avatar/animations/farmSixSeven';

const BLUE = '#3b82f6';
const BLUE_LIGHT = '#93c5fd';
const RED = '#ef4444';
const RED_LIGHT = '#fca5a5';
const POWER_REQUIRED = 100;
const MAX_VISIBLE_EFFECTS = 18;
const NORMAL_SHOT_COOLDOWN_MS = 150;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function createEffectId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Move a câmera levemente quando ocorre um impacto importante.
 * Não usa estado React por frame.
 */
function CameraRig({ shakeSignal }) {
    const { camera } = useThree();
    const originalPosition = useRef(camera.position.clone());
    const shakeStrength = useRef(0);
    const previousSignal = useRef(shakeSignal);

    useEffect(() => {
        if (shakeSignal !== previousSignal.current) {
            previousSignal.current = shakeSignal;
            shakeStrength.current = 0.12;
        }
    }, [shakeSignal]);

    useFrame((_, delta) => {
        if (shakeStrength.current > 0.001) {
            camera.position.x = originalPosition.current.x + (Math.random() - 0.5) * shakeStrength.current;
            camera.position.y = originalPosition.current.y + (Math.random() - 0.5) * shakeStrength.current;
            shakeStrength.current = THREE.MathUtils.damp(shakeStrength.current, 0, 10, delta);
            return;
        }

        camera.position.lerp(originalPosition.current, Math.min(1, delta * 12));
    });

    return null;
}

/**
 * Pulso rápido no ponto de impacto.
 */
function ImpactBurst({ position, color, scale = 1, onComplete }) {
    const groupRef = useRef();
    const ringRef = useRef();
    const coreRef = useRef();
    const progressRef = useRef(0);
    const completedRef = useRef(false);

    useFrame((_, delta) => {
        progressRef.current += delta * 3.5;
        const progress = progressRef.current;

        if (groupRef.current) {
            groupRef.current.rotation.z += delta * 2;
        }

        if (ringRef.current) {
            const ringScale = scale * (0.5 + progress * 2.5);
            ringRef.current.scale.setScalar(ringScale);
            ringRef.current.material.opacity = Math.max(0, 0.75 * (1 - progress));
        }

        if (coreRef.current) {
            const pulse = scale * (1 + Math.sin(progress * Math.PI * 5) * 0.18);
            coreRef.current.scale.setScalar(pulse);
            coreRef.current.material.opacity = Math.max(0, 1 - progress);
        }

        if (progress >= 1 && !completedRef.current) {
            completedRef.current = true;
            onComplete();
        }
    });

    return (
        <group ref={groupRef} position={position}>
            <mesh ref={coreRef}>
                <sphereGeometry args={[0.22, 18, 18]} />
                <meshBasicMaterial color={color} transparent toneMapped={false} />
            </mesh>

            <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.18, 0.27, 32]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.75}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>

            <pointLight color={color} intensity={5 * scale} distance={4} decay={2} />
        </group>
    );
}

/**
 * Rajada de energia multicamada. O movimento é atualizado com refs,
 * evitando setState em todos os frames.
 */
function EnergyProjectile({ effect, onImpact, onComplete }) {
    const groupRef = useRef();
    const coreRef = useRef();
    const auraRef = useRef();
    const trailRefs = useRef([]);
    const progressRef = useRef(0);
    const completedRef = useRef(false);

    const {
        startX,
        endX,
        color,
        power = 1,
        type = 'normal',
    } = effect;

    const speed = type === 'six_seven' ? 1.65 : type === 'combo' ? 2.1 : 2.8;
    const baseSize = type === 'six_seven' ? 0.32 : type === 'combo' ? 0.22 : 0.13;

    useFrame((state, delta) => {
        if (!groupRef.current || completedRef.current) return;

        progressRef.current += delta * speed;
        const progress = clamp(progressRef.current, 0, 1);
        const direction = Math.sign(endX - startX) || 1;
        const x = THREE.MathUtils.lerp(startX, endX, progress);
        const arcHeight = type === 'six_seven' ? 0.55 : 0.22;
        const y = 0.85 + Math.sin(progress * Math.PI) * arcHeight;
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 20) * 0.12;

        groupRef.current.position.set(x, y, 0);
        groupRef.current.rotation.z += delta * 8 * direction;

        if (coreRef.current) {
            coreRef.current.scale.setScalar(pulse * power);
        }

        if (auraRef.current) {
            auraRef.current.scale.setScalar((1.7 + progress * 0.25) * power);
            auraRef.current.material.opacity = 0.3 * (1 - progress * 0.45);
        }

        trailRefs.current.forEach((trail, index) => {
            if (!trail) return;
            const distance = (index + 1) * 0.13 * direction;
            trail.position.x = -distance;
            trail.scale.setScalar(Math.max(0.25, 0.85 - index * 0.14) * power);
            trail.material.opacity = Math.max(0, (0.32 - index * 0.045) * (1 - progress));
        });

        if (progress >= 1) {
            completedRef.current = true;
            onImpact({
                position: [endX, 0.85, 0],
                color,
                scale: type === 'six_seven' ? 1.8 : type === 'combo' ? 1.25 : 0.75,
                strong: type !== 'normal',
            });
            onComplete();
        }
    });

    return (
        <group ref={groupRef} position={[startX, 0.85, 0]}>
            <mesh ref={coreRef}>
                <sphereGeometry args={[baseSize, 20, 20]} />
                <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>

            <mesh ref={auraRef} scale={1.7}>
                <sphereGeometry args={[baseSize, 18, 18]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.3}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>

            {[0, 1, 2, 3, 4].map((index) => (
                <mesh
                    key={index}
                    ref={(node) => { trailRefs.current[index] = node; }}
                >
                    <sphereGeometry args={[baseSize * 0.72, 12, 12]} />
                    <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={0.25}
                        depthWrite={false}
                        toneMapped={false}
                    />
                </mesh>
            ))}

            {type === 'six_seven' && (
                <>
                    <mesh position={[-0.18, 0.25, 0]}>
                        <torusGeometry args={[0.13, 0.035, 10, 24]} />
                        <meshBasicMaterial color={color} toneMapped={false} />
                    </mesh>
                    <mesh position={[0.2, 0.25, 0]} rotation={[0, 0, -0.55]}>
                        <boxGeometry args={[0.08, 0.32, 0.06]} />
                        <meshBasicMaterial color={color} toneMapped={false} />
                    </mesh>
                </>
            )}

            <pointLight color={color} intensity={type === 'six_seven' ? 8 : 3} distance={5} decay={2} />
        </group>
    );
}

function ArenaPulse({ color, side }) {
    const meshRef = useRef();

    useFrame((state) => {
        if (!meshRef.current) return;
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.08;
        meshRef.current.scale.setScalar(pulse);
        meshRef.current.material.opacity = 0.08 + Math.sin(state.clock.elapsedTime * 3) * 0.025;
    });

    return (
        <mesh
            ref={meshRef}
            position={[side === 'left' ? -1.55 : 1.55, 0.02, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
        >
            <ringGeometry args={[0.75, 1.15, 48]} />
            <meshBasicMaterial
                color={color}
                transparent
                opacity={0.1}
                side={THREE.DoubleSide}
                depthWrite={false}
                toneMapped={false}
            />
        </mesh>
    );
}

// Componente leve exclusivo para a arena.
function SimpleAvatar({ modelFile, score }) {
    const [vrm, setVrm] = useState(null);
    const lastScoreRef = useRef(score || 0);
    const animFrameRef = useRef(0);
    const isAnimatingRef = useRef(false);

    useEffect(() => {
        if (!modelFile) return undefined;

        let isMounted = true;
        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));

        loader.load(
            `/models/${modelFile}`,
            (gltf) => {
                if (!isMounted) return;
                const loadedVrm = gltf.userData.vrm;
                if (!loadedVrm) return;

                loadedVrm.scene.traverse((child) => {
                    if (!child.isMesh || !child.material) return;

                    if (Array.isArray(child.material)) {
                        child.material.forEach((material) => {
                            material.needsUpdate = true;
                        });
                    } else {
                        child.material.needsUpdate = true;
                    }

                    child.frustumCulled = false;
                });

                setVrm(loadedVrm);
            },
            undefined,
            (error) => {
                console.error(`Falha ao carregar avatar ${modelFile}:`, error);
            },
        );

        return () => {
            isMounted = false;
        };
    }, [modelFile]);

    useEffect(() => () => {
        if (vrm?.scene) {
            vrm.scene.traverse((child) => {
                if (child.geometry) child.geometry.dispose?.();
            });
        }
    }, [vrm]);

    useFrame((state, delta) => {
        if (!vrm?.humanoid || sixSevenFrames.length === 0) return;

        vrm.update(delta);

        if (score > lastScoreRef.current) {
            isAnimatingRef.current = true;
            animFrameRef.current = 0;
            lastScoreRef.current = score;
        }

        const getBone = (name) => vrm.humanoid.getNormalizedBoneNode(name);
        let currentFrameIndex = 0;

        if (isAnimatingRef.current) {
            animFrameRef.current += delta * 60;
            currentFrameIndex = Math.floor(animFrameRef.current);

            if (currentFrameIndex >= sixSevenFrames.length) {
                currentFrameIndex = sixSevenFrames.length - 1;
                isAnimatingRef.current = false;
            }
        }

        const framePose = sixSevenFrames[currentFrameIndex]?.pose || {};
        Object.keys(framePose).forEach((boneName) => {
            const bone = getBone(boneName);
            const pose = framePose[boneName];
            if (!bone || !pose) return;

            if (pose.x !== undefined) bone.rotation.x = pose.x;
            if (pose.y !== undefined) bone.rotation.y = pose.y;
            if (pose.z !== undefined) bone.rotation.z = pose.z;
        });

        const hips = getBone('hips');
        const chest = getBone('chest');

        if (hips) {
            hips.rotation.x = 0;
            hips.rotation.y = Math.PI;
        }

        if (chest) {
            chest.rotation.z = 0;
            chest.rotation.x += Math.sin(state.clock.elapsedTime * 2) * 0.02;
        }

        vrm.scene.position.y = 0;
    });

    return vrm ? <primitive object={vrm.scene} /> : null;
}


export function DuelScreen() {
    const {
        activeDuelRoom,
        duelState,
        leaveDuel,
        sendDuelHit,
    } = useDuelSystem();

    const [p1Progress, setP1Progress] = useState(50);
    const [clickCount, setClickCount] = useState(0);
    const [effects, setEffects] = useState([]);
    const [impacts, setImpacts] = useState([]);
    const [shakeSignal, setShakeSignal] = useState(0);

    const clickCountRef = useRef(0);
    const lastClickTimeRef = useRef(0);
    const prevScore1 = useRef(0);
    const prevScore2 = useRef(0);
    const lastShotAt = useRef({ p1: 0, p2: 0 });
    const previousDuelStatus = useRef(null);

    const addEffect = useCallback((effect) => {
        setEffects((current) => [
            ...current.slice(-(MAX_VISIBLE_EFFECTS - 1)),
            { ...effect, id: createEffectId(effect.type || 'effect') },
        ]);
    }, []);

    const addImpact = useCallback((impact) => {
        setImpacts((current) => [
            ...current.slice(-7),
            { ...impact, id: createEffectId('impact') },
        ]);

        if (impact.strong) {
            setShakeSignal((value) => value + 1);
        }
    }, []);

    const handleScreenClick = useCallback((event) => {
        const now = Date.now();

        // Evita o clique duplicado gerado por touch + click no celular.
        if (now - lastClickTimeRef.current < 45) return;
        lastClickTimeRef.current = now;

        if (duelState?.status !== 'playing') return;

        clickCountRef.current += 1;
        setClickCount(clickCountRef.current);

        sendDuelHit?.(clickCountRef.current, {
            timestamp: now,
            isTrusted: event?.isTrusted !== false,
            inputType: event?.type || 'unknown',
        });
    }, [duelState?.status, sendDuelHit]);

    const player1 = duelState?.player1;
    const player2 = duelState?.player2;
    const myId = activeDuelRoom?.sessionId;
    const isP1 = myId === player1?.id;
    const LeftPlayer = isP1 ? player1 : player2;
    const RightPlayer = isP1 ? player2 : player1;
    const myPlayer = isP1 ? player1 : player2;


    useEffect(() => {
        if (previousDuelStatus.current !== duelState?.status) {
            previousDuelStatus.current = duelState?.status;

            if (duelState?.status === 'countdown') {
                setEffects([]);
                setImpacts([]);
                setClickCount(0);
                clickCountRef.current = 0;
                prevScore1.current = player1?.score || 0;
                prevScore2.current = player2?.score || 0;
            }
        }
    }, [duelState?.status, player1?.score, player2?.score]);

    useEffect(() => {
        if (!player1 || !player2) return;

        const score1 = Number(player1.score) || 0;
        const score2 = Number(player2.score) || 0;
        const difference = score1 - score2;
        const maxDifference = Number(duelState?.maxDominanceDifference) || 200;
        const progress = 50 + clamp((difference / maxDifference) * 50, -50, 50);
        setP1Progress(progress);

        const now = Date.now();
        const delta1 = Math.max(0, score1 - prevScore1.current);
        const delta2 = Math.max(0, score2 - prevScore2.current);

        const spawnForPlayer = (playerKey, delta, startX, endX, color, nextScore) => {
            if (delta <= 0) return;

            const reachedComboMilestone = nextScore > 0 && nextScore % 50 < delta;
            const canSpawnNormal = now - lastShotAt.current[playerKey] >= NORMAL_SHOT_COOLDOWN_MS;

            if (reachedComboMilestone) {
                addEffect({
                    type: 'combo',
                    startX,
                    endX,
                    color,
                    power: 1.1,
                });
                lastShotAt.current[playerKey] = now;
                return;
            }

            if (canSpawnNormal) {
                addEffect({
                    type: 'normal',
                    startX,
                    endX,
                    color,
                    power: 1,
                });
                lastShotAt.current[playerKey] = now;
            }
        };

        spawnForPlayer('p1', delta1, -1.15, 1.15, BLUE, score1);
        spawnForPlayer('p2', delta2, 1.15, -1.15, RED, score2);

        prevScore1.current = score1;
        prevScore2.current = score2;
    }, [addEffect, duelState?.maxDominanceDifference, player1, player2]);

    const dominanceLabel = useMemo(() => {
        const localProgress = isP1 ? p1Progress : 100 - p1Progress;
        if (localProgress >= 75) return 'DOMINANDO';
        if (localProgress <= 25) return 'SOB PRESSÃO';
        return 'DISPUTA EQUILIBRADA';
    }, [isP1, p1Progress]);

    if (!duelState || !player1 || !player2) {
        return (
            <div style={{
                background: '#000',
                width: '100%',
                height: '100%',
                color: '#fff',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontWeight: 800,
            }}>
                Carregando Arena...
            </div>
        );
    }

    const isGameOver = duelState.status === 'finished';
    const winnerIsMe = duelState.winnerId === myId;
    const isDraw = duelState.winnerId === 'draw';

    return (
        <div
            onPointerDown={duelState.status === 'playing' ? handleScreenClick : undefined}
            style={{
                position: 'absolute',
                inset: 0,
                width: '100vw',
                height: '100vh',
                background: 'radial-gradient(circle at 50% 40%, #172554 0%, #080b18 42%, #000 100%)',
                overflow: 'hidden',
                userSelect: 'none',
                touchAction: 'manipulation',
                cursor: duelState.status === 'playing' ? 'crosshair' : 'default',
            }}
        >
            <Canvas
                camera={{ position: [0, 1.25, 7], fov: 62 }}
                dpr={[1, 1.5]}
                gl={{ antialias: true, powerPreference: 'high-performance' }}
                style={{ position: 'absolute', inset: 0, zIndex: 1 }}
            >
                <CameraRig shakeSignal={shakeSignal} />
                <ambientLight intensity={0.42} />
                <directionalLight position={[-4, 5, 4]} intensity={2.2} color={BLUE_LIGHT} />
                <directionalLight position={[4, 5, 4]} intensity={2.2} color={RED_LIGHT} />
                <pointLight position={[-2, 1.6, 1]} intensity={3} distance={5} color={BLUE} />
                <pointLight position={[2, 1.6, 1]} intensity={3} distance={5} color={RED} />
                <Environment preset="night" />

                <mesh position={[0, -0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[22, 22]} />
                    <meshStandardMaterial color="#020617" roughness={0.82} metalness={0.18} />
                </mesh>
                <gridHelper args={[22, 28, '#334155', '#172554']} position={[0, 0.005, 0]} />

                <ArenaPulse color={BLUE} side="left" />
                <ArenaPulse color={RED} side="right" />

                <mesh position={[0, 1.1, -0.8]}>
                    <planeGeometry args={[0.025, 3.4]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.12} />
                </mesh>

                {LeftPlayer?.model && (
                    <group position={[-1.55, 0, 0]} rotation={[0, -Math.PI / 2, 0]} scale={0.7}>
                        <SimpleAvatar modelFile={LeftPlayer.model} score={LeftPlayer.score} />
                    </group>
                )}

                {RightPlayer?.model && (
                    <group position={[1.55, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={0.7}>
                        <SimpleAvatar modelFile={RightPlayer.model} score={RightPlayer.score} />
                    </group>
                )}

                {effects.map((effect) => (
                    <EnergyProjectile
                        key={effect.id}
                        effect={effect}
                        onImpact={addImpact}
                        onComplete={() => {
                            setEffects((current) => current.filter((item) => item.id !== effect.id));
                        }}
                    />
                ))}

                {impacts.map((impact) => (
                    <ImpactBurst
                        key={impact.id}
                        position={impact.position}
                        color={impact.color}
                        scale={impact.scale}
                        onComplete={() => {
                            setImpacts((current) => current.filter((item) => item.id !== impact.id));
                        }}
                    />
                ))}
            </Canvas>

            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }}>
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ color: '#fff', fontWeight: '900', fontSize: '2rem', textShadow: '0 0 10px #ef4444' }}>
                        {duelState.timeLeft}s
                    </div>
                    
                    {/* BARRA DE DOMÍNIO (CABO DE GUERRA) */}
                    <div style={{ 
                        width: '80%', height: '20px', background: '#000', border: '2px solid #333', 
                        borderRadius: '10px', marginTop: '10px', position: 'relative', overflow: 'hidden',
                        display: 'flex', boxShadow: '0 0 15px rgba(255,255,255,0.1)'
                    }}>
                        <div style={{ 
                            width: `${p1Progress}%`, height: '100%', 
                            background: `linear-gradient(90deg, #172554, ${BLUE}, ${BLUE_LIGHT})`,
                            transition: 'width 0.1s linear' 
                        }} />
                        
                        <div style={{ 
                            width: `${100 - p1Progress}%`, height: '100%', 
                            background: `linear-gradient(90deg, ${RED_LIGHT}, ${RED}, #450a0a)`,
                            transition: 'width 0.1s linear'
                        }} />
                        
                        <div style={{ position: 'absolute', top: 0, left: '50%', width: '4px', height: '100%', background: '#fff', transform: 'translateX(-50%)', boxShadow: '0 0 10px #fff' }} />
                    </div>

                    <div style={{ width: '80%', display: 'flex', justifyContent: 'space-between', marginTop: '5px', color: '#fff', fontWeight: 'bold' }}>
                        <span style={{ color: BLUE_LIGHT }}>VOCÊ ({LeftPlayer?.score || 0})</span>
                        <span style={{ color: RED_LIGHT }}>{RightPlayer?.name || 'ADVERSÁRIO'} ({RightPlayer?.score || 0})</span>
                    </div>
                </div>

                {duelState.status === 'waiting' && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: '#fff',
                        fontSize: '1.5rem',
                        fontWeight: 900,
                        textShadow: '0 0 18px #000',
                    }}>
                        Aguardando oponente...
                    </div>
                )}

                {duelState.status === 'countdown' && (
                    <div style={{
                        position: 'absolute',
                        top: '43%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: '#fff',
                        fontSize: 'clamp(5rem, 16vw, 10rem)',
                        fontWeight: 1000,
                        lineHeight: 1,
                        textShadow: '0 0 25px #3b82f6, 0 0 45px #ef4444',
                    }}>
                        {duelState.timeLeft}
                    </div>
                )}

                {isGameOver && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(0,0,0,0.98))',
                        border: `2px solid ${winnerIsMe ? '#fbbf24' : RED}`,
                        borderRadius: 20,
                        padding: 30,
                        textAlign: 'center',
                        pointerEvents: 'auto',
                        width: 'min(340px, calc(100vw - 40px))',
                        boxShadow: winnerIsMe
                            ? '0 0 50px rgba(251,191,36,0.35)'
                            : '0 0 45px rgba(239,68,68,0.25)',
                    }}>
                        <Trophy
                            size={56}
                            color={winnerIsMe ? '#fbbf24' : '#64748b'}
                            style={{ margin: '0 auto 12px' }}
                        />
                        <h1 style={{ color: '#fff', margin: 0, fontSize: '2rem' }}>
                            {isDraw ? 'EMPATE!' : winnerIsMe ? 'VITÓRIA!' : 'DERROTA'}
                        </h1>
                        <p style={{ color: '#cbd5e1', lineHeight: 1.5 }}>
                            {isDraw
                                ? 'O pote deve ser devolvido ou tratado pelas regras do servidor.'
                                : winnerIsMe
                                    ? `Você ganhou ${(duelState.betAmount || 0) * 2} AuraCash!`
                                    : `Você perdeu ${duelState.betAmount || 0} AuraCash.`}
                        </p>
                        <button
                            type="button"
                            onClick={leaveDuel}
                            style={{
                                background: winnerIsMe
                                    ? 'linear-gradient(90deg, #d97706, #fbbf24)'
                                    : 'linear-gradient(90deg, #991b1b, #ef4444)',
                                color: '#fff',
                                border: 'none',
                                padding: '13px 24px',
                                borderRadius: 10,
                                fontWeight: 950,
                                cursor: 'pointer',
                                marginTop: 14,
                                width: '100%',
                            }}
                        >
                            SAIR DA ARENA
                        </button>
                    </div>
                )}
            </div>

            {duelState.status === 'countdown' && (
                <div style={{ position: 'absolute', bottom: '20%', left: '0', width: '100%', textAlign: 'center', color: '#fff', fontSize: '1.2rem', animation: 'pulse 1s infinite', zIndex: 50 }}>
                    PREPARE-SE PARA CLICAR NOS BOTÕES!
                </div>
            )}

            {/* BOTÕES DE JOGO (Aparecem apenas quando a partida começar) */}
            {duelState.status === 'playing' && (
                <div style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '80px', zIndex: 100, pointerEvents: 'auto' }}>
                    <button 
                        onTouchStart={(e) => { e.stopPropagation(); handleScreenClick(e); }}
                        onClick={(e) => { e.stopPropagation(); handleScreenClick(e); }}
                        style={{
                            width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(0,0,0,0.8)', border: '4px solid #3b82f6',
                            color: '#3b82f6', fontSize: '3rem', fontWeight: '900', cursor: 'pointer', outline: 'none',
                            boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
                        }}
                    >
                        6
                    </button>
                    <button 
                        onTouchStart={(e) => { e.stopPropagation(); handleScreenClick(e); }}
                        onClick={(e) => { e.stopPropagation(); handleScreenClick(e); }}
                        style={{
                            width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(0,0,0,0.8)', border: '4px solid #ef4444',
                            color: '#ef4444', fontSize: '3rem', fontWeight: '900', cursor: 'pointer', outline: 'none',
                            boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
                        }}
                    >
                        7
                    </button>
                </div>
            )}
        </div>
    );
}
