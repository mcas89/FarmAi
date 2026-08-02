import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Trophy, Zap, LogOut } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import { useDuelSystem } from '../../../systems/useDuelSystem';
import { useGraphicsSystem } from '../../../systems/useGraphicsSystem';
import { sixSevenFrames } from '../../3d/avatar/animations/farmSixSeven';

const BLUE = '#3b82f6';
const BLUE_LIGHT = '#93c5fd';
const RED = '#ef4444';
const RED_LIGHT = '#fca5a5';
const NORMAL_SHOT_COOLDOWN_MS = 210;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function createEffectId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function useGlowTexture() {
    return useMemo(() => {
        if (typeof document === 'undefined') return null;
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.16, 'rgba(255,255,255,0.96)');
        gradient.addColorStop(0.42, 'rgba(255,255,255,0.42)');
        gradient.addColorStop(0.72, 'rgba(255,255,255,0.10)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        return texture;
    }, []);
}

// 1. Efeitos Visuais Refeitos do Zero
function CameraRig({ shakeSignal }) {
    const { camera } = useThree();
    const originalPos = useRef(camera.position.clone());
    const shakeAmount = useRef(0);
    const lastSignal = useRef(shakeSignal);

    useEffect(() => {
        if (shakeSignal !== lastSignal.current) {
            lastSignal.current = shakeSignal;
            shakeAmount.current = 0.15;
        }
    }, [shakeSignal]);

    useFrame((_, delta) => {
        if (shakeAmount.current > 0.001) {
            camera.position.x = originalPos.current.x + (Math.random() - 0.5) * shakeAmount.current;
            camera.position.y = originalPos.current.y + (Math.random() - 0.5) * shakeAmount.current;
            shakeAmount.current = THREE.MathUtils.damp(shakeAmount.current, 0, 15, delta);
        } else {
            camera.position.lerp(originalPos.current, delta * 10);
        }
    });
    return null;
}

function ImpactBurst({ position, color, scale = 1, onComplete }) {
    const group = useRef();
    const ringA = useRef();
    const ringB = useRef();
    const slashA = useRef();
    const slashB = useRef();
    const time = useRef(0);
    const enableLights = useGraphicsSystem((s) => s.settings.duelImpactLights);

    useFrame((_, delta) => {
        time.current += delta * 3.8;
        const t = time.current;
        const fade = Math.max(0, 1 - t);

        if (group.current) group.current.rotation.x += delta * 1.5;
        if (ringA.current) {
            ringA.current.scale.setScalar(scale * (0.4 + t * 3.4));
            ringA.current.material.opacity = fade * 0.9;
        }
        if (ringB.current) {
            ringB.current.scale.setScalar(scale * (0.25 + t * 2.4));
            ringB.current.rotation.z -= delta * 5;
            ringB.current.material.opacity = fade * 0.65;
        }
        if (slashA.current) {
            slashA.current.scale.x = scale * (0.5 + t * 3.2);
            slashA.current.material.opacity = fade;
        }
        if (slashB.current) {
            slashB.current.scale.x = scale * (0.5 + t * 3.2);
            slashB.current.material.opacity = fade;
        }
        if (t >= 1) onComplete();
    });

    return (
        <group ref={group} position={position}>
            <mesh ref={ringA} rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.22, 0.035, 6, 24]} />
                <meshBasicMaterial color={color} transparent depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh ref={ringB} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.34, 0.018, 6, 24]} />
                <meshBasicMaterial color="#ffffff" transparent depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh ref={slashA} rotation={[0, 0, Math.PI / 4]} scale={[0.5, 1, 1]}>
                <planeGeometry args={[1.2, 0.055]} />
                <meshBasicMaterial color={color} transparent side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh ref={slashB} rotation={[0, 0, -Math.PI / 4]} scale={[0.5, 1, 1]}>
                <planeGeometry args={[1.2, 0.055]} />
                <meshBasicMaterial color="#ffffff" transparent side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
            </mesh>
            {enableLights && <pointLight color={color} intensity={8 * scale} distance={6} />}
        </group>
    );
}

function CenterExplosion({ position, onComplete }) {
    const group = useRef();
    const ring = useRef();
    const vertical = useRef();
    const horizontal = useRef();
    const time = useRef(0);
    const enableLights = useGraphicsSystem((s) => s.settings.duelImpactLights);

    useFrame((_, delta) => {
        time.current += delta * 2.7;
        const t = time.current;
        const fade = Math.max(0, 1 - t);

        if (group.current) group.current.rotation.z += delta * 2.5;
        if (ring.current) {
            ring.current.scale.setScalar(0.6 + t * 4.5);
            ring.current.material.opacity = fade * 0.95;
        }
        if (vertical.current) {
            vertical.current.scale.y = 1 + t * 4;
            vertical.current.material.opacity = fade * 0.75;
        }
        if (horizontal.current) {
            horizontal.current.scale.x = 1 + t * 4;
            horizontal.current.material.opacity = fade * 0.75;
        }
        if (t >= 1) onComplete();
    });

    return (
        <group ref={group} position={position}>
            <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.42, 0.08, 8, 32]} />
                <meshBasicMaterial color="#c084fc" transparent side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh ref={vertical}>
                <planeGeometry args={[0.08, 1.7]} />
                <meshBasicMaterial color="#ffffff" transparent side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh ref={horizontal}>
                <planeGeometry args={[1.7, 0.08]} />
                <meshBasicMaterial color="#ffffff" transparent side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh position={[-0.34, 0, 0]} scale={[0.7, 1, 1]}>
                <coneGeometry args={[0.22, 0.9, 12, 1, true]} />
                <meshBasicMaterial color={BLUE} transparent opacity={0.7} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh position={[0.34, 0, 0]} rotation={[0, 0, Math.PI]} scale={[0.7, 1, 1]}>
                <coneGeometry args={[0.22, 0.9, 12, 1, true]} />
                <meshBasicMaterial color={RED} transparent opacity={0.7} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
            </mesh>
            {enableLights && <pointLight color="#c084fc" intensity={14} distance={9} decay={2} />}
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

function EnergyProjectile({ effect, onImpact, onComplete, onRegisterRef, onUnregisterRef }) {
    const group = useRef();
    const coreBeam = useRef();
    const handGlow = useRef();
    const frontGlow = useRef();
    const mistGlow = useRef();
    const particles = useRef();
    const progressRef = useRef(0);
    const glowTexture = useGlowTexture();
    const gfx = useGraphicsSystem((s) => s.settings);

    const { startX, endX, color, power = 1, type = 'normal', id } = effect;
    const direction = Math.sign(endX - startX) || 1;
    const speed = type === 'combo' ? 1.75 : 2.45;
    const particleCount = type === 'combo'
        ? (gfx.duelParticlesCombo ?? 54)
        : (gfx.duelParticlesNormal ?? 34);
    const enableProjectileLight = gfx.duelProjectileLights !== false;

    const particleData = useMemo(() => {
        const positions = new Float32Array(particleCount * 3);
        const seeds = [];
        for (let i = 0; i < particleCount; i += 1) {
            seeds.push({
                offset: Math.random(),
                radius: 0.025 + Math.random() * (type === 'combo' ? 0.22 : 0.13),
                speed: 0.65 + Math.random() * 1.6,
                phase: Math.random() * Math.PI * 2,
            });
        }
        return { positions, seeds };
    }, [particleCount, type]);

    useEffect(() => {
        onRegisterRef?.(id, { id, progressRef, startX, endX, color });
        return () => onUnregisterRef?.(id);
    }, [id]); // eslint-disable-line

    useFrame((state, delta) => {
        progressRef.current += delta * speed;
        const p = Math.min(progressRef.current, 1);
        const currentX = THREE.MathUtils.lerp(startX, endX, p);
        const currentLength = Math.max(0.03, Math.abs(currentX - startX));
        const centerX = startX + direction * currentLength * 0.5;
        const time = state.clock.elapsedTime;
        const pulse = 1 + Math.sin(time * 18) * 0.09;

        if (group.current) group.current.position.set(0, 0.9, 0);

        if (coreBeam.current) {
            coreBeam.current.position.x = centerX;
            coreBeam.current.scale.set(
                type === 'combo' ? 0.14 : 0.075,
                currentLength,
                (type === 'combo' ? 0.14 : 0.075) * pulse * power,
            );
            coreBeam.current.material.opacity = 0.28 + Math.sin(time * 24) * 0.07;
        }

        if (handGlow.current) {
            handGlow.current.position.x = startX;
            const handPulse = (type === 'combo' ? 0.72 : 0.46) * (1 + Math.sin(time * 16) * 0.16) * power;
            handGlow.current.scale.setScalar(handPulse);
            handGlow.current.material.opacity = 0.72 + Math.sin(time * 19) * 0.12;
        }

        if (frontGlow.current) {
            frontGlow.current.position.x = currentX;
            const frontPulse = (type === 'combo' ? 0.82 : 0.50) * pulse * power;
            frontGlow.current.scale.set(frontPulse * 1.35, frontPulse, 1);
            frontGlow.current.material.opacity = 0.78;
        }

        if (mistGlow.current) {
            mistGlow.current.position.x = centerX;
            mistGlow.current.scale.set(currentLength * 1.15, type === 'combo' ? 0.58 : 0.34, 1);
            mistGlow.current.material.opacity = type === 'combo' ? 0.20 : 0.13;
        }

        if (particles.current) {
            const array = particles.current.geometry.attributes.position.array;
            particleData.seeds.forEach((seed, index) => {
                const flow = (seed.offset + time * seed.speed * 0.23) % 1;
                const usableLength = Math.max(currentLength, 0.04);
                const x = startX + direction * usableLength * flow;
                const turbulence = seed.radius * (0.35 + Math.sin(flow * Math.PI) * 0.9);
                const y = Math.sin(time * seed.speed * 4 + seed.phase + flow * 8) * turbulence;
                const z = Math.cos(time * seed.speed * 3.2 + seed.phase + flow * 7) * turbulence;
                const i3 = index * 3;
                array[i3] = x;
                array[i3 + 1] = y;
                array[i3 + 2] = z;
            });
            particles.current.geometry.attributes.position.needsUpdate = true;
            particles.current.material.opacity = type === 'combo' ? 0.82 : 0.68;
        }

        if (p >= 1) {
            onImpact({ position: [endX, 0.9, 0], color, scale: type === 'combo' ? 1.65 : 1, strong: type === 'combo' });
            onComplete();
        }
    });

    return (
        <group ref={group}>
            {/* Aura concentrada e difusa nas mãos */}
            <sprite ref={handGlow} position={[startX, 0, 0]}>
                <spriteMaterial
                    map={glowTexture}
                    color={color}
                    transparent
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    toneMapped={false}
                />
            </sprite>

            {/* Névoa luminosa orgânica envolvendo o fluxo */}
            <sprite ref={mistGlow} position={[startX, 0, -0.05]}>
                <spriteMaterial
                    map={glowTexture}
                    color={color}
                    transparent
                    opacity={0.16}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    toneMapped={false}
                />
            </sprite>

            {/* Núcleo quase invisível, apenas para dar força ao Ki */}
            <mesh ref={coreBeam} rotation={[0, 0, -direction * Math.PI / 2]}>
                <cylinderGeometry args={[1, 1, 1, particleCount > 20 ? 10 : 6, 1, true]} />
                <meshBasicMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.3}
                    blending={THREE.AdditiveBlending}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>

            {/* Corrente de partículas de Aura/Ki, com turbulência */}
            <points ref={particles}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[particleData.positions, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    map={glowTexture}
                    color={color}
                    size={type === 'combo' ? 0.16 : 0.095}
                    transparent
                    opacity={0.72}
                    alphaTest={0.02}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    sizeAttenuation
                    toneMapped={false}
                />
            </points>

            {/* Cabeça do poder como massa de luz, sem borda geométrica */}
            <sprite ref={frontGlow} position={[startX, 0, 0.02]}>
                <spriteMaterial
                    map={glowTexture}
                    color={color}
                    transparent
                    opacity={0.8}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    toneMapped={false}
                />
            </sprite>

            {enableProjectileLight && (
                <pointLight
                    position={[startX, 0, 0.2]}
                    color={color}
                    intensity={type === 'combo' ? 9 : 5}
                    distance={5}
                    decay={2}
                />
            )}
        </group>
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
    const graphicsSettings = useGraphicsSystem(state => state.settings);
    const graphicsTier = useGraphicsSystem(state => state.effectiveTier);
    const maxVisibleEffects = graphicsSettings.duelMaxEffects ?? 10;

    const [p1Progress, setP1Progress] = useState(50);
    const [targetP1Progress, setTargetP1Progress] = useState(50);
    const [clickCount, setClickCount] = useState(0);
    const [effects, setEffects] = useState([]);
    const [impacts, setImpacts] = useState([]);
    const [shakeSignal, setShakeSignal] = useState(0);
    const [blockedFlash, setBlockedFlash] = useState(false);

    const clickCountRef = useRef(0);
    const lastClickTimeRef = useRef(0);
    const lastButtonRef = useRef(null); 
    const prevScore1 = useRef(0);
    const prevScore2 = useRef(0);
    const lastShotAt = useRef({ p1: 0, p2: 0 });
    const previousDuelStatus = useRef(null);
    const activeProjectilesRef = useRef({});

    // Movimento uniforme da barra: o estado real define o alvo,
    // enquanto o valor exibido percorre a distância a velocidade constante.
    useEffect(() => {
        let animationFrame;
        let previousTime = performance.now();
        const BAR_SPEED_PER_SECOND = 18;

        const animate = (now) => {
            const deltaSeconds = Math.min((now - previousTime) / 1000, 0.05);
            previousTime = now;

            setP1Progress((current) => {
                const distance = targetP1Progress - current;
                const maximumStep = BAR_SPEED_PER_SECOND * deltaSeconds;
                if (Math.abs(distance) <= maximumStep) return targetP1Progress;
                return current + Math.sign(distance) * maximumStep;
            });

            animationFrame = requestAnimationFrame(animate);
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [targetP1Progress]);

    const addEffect = useCallback((effect) => {
        setEffects((current) => [...current.slice(-(maxVisibleEffects - 1)), { ...effect, id: createEffectId(effect.type || 'effect') }]);
    }, [maxVisibleEffects]);

    const addImpact = useCallback((impact) => {
        const maxImpacts = graphicsTier === 'potato' ? 2 : graphicsTier === 'low' ? 3 : graphicsTier === 'medium' ? 5 : 8;
        setImpacts((current) => [...current.slice(-(maxImpacts - 1)), { ...impact, id: createEffectId(impact.type || 'impact') }]);
        if (impact.strong) setShakeSignal(v => v + 1);
    }, [graphicsTier]);

    const handleScreenClick = useCallback((event, buttonId) => {
        const now = Date.now();
        // Debounce nativo para evitar spam
        if (now - lastClickTimeRef.current < 45) return;
        lastClickTimeRef.current = now;

        if (duelState?.status !== 'playing') return;

        // Regra de alternância limpa (ignorando duplos de hardware se houver)
        if (lastButtonRef.current === buttonId) {
            setBlockedFlash(true);
            setTimeout(() => setBlockedFlash(false), 150);
            return;
        }
        lastButtonRef.current = buttonId;

        clickCountRef.current += 1;
        setClickCount(clickCountRef.current);

        sendDuelHit?.(clickCountRef.current, {
            timestamp: now,
            isTrusted: event?.isTrusted !== false,
            inputType: event?.type || 'unknown',
        });
    }, [duelState?.status, sendDuelHit]);

    const handleRegisterProjectile = useCallback((id, data) => {
        activeProjectilesRef.current[id] = data;
    }, []);
    
    const handleUnregisterProjectile = useCallback((id) => {
        delete activeProjectilesRef.current[id];
    }, []);

    // Verificação central simplificada e direta
    const handleCollisionCheck = useCallback(() => {
        const projs = Object.values(activeProjectilesRef.current);
        const leftMoving = projs.filter(p => p.endX > p.startX);
        const rightMoving = projs.filter(p => p.endX < p.startX);

        leftMoving.forEach(lp => {
            rightMoving.forEach(rp => {
                const lpProg = lp.progressRef.current;
                const rpProg = rp.progressRef.current;
                
                // Zona de impacto central
                if (lpProg > 0.4 && lpProg < 0.6 && rpProg > 0.4 && rpProg < 0.6) {
                    addImpact({ type: 'center', position: [0, 0.85, 0], strong: true });
                    setEffects(cur => cur.filter(e => e.id !== lp.id && e.id !== rp.id));
                }
            });
        });
    }, [addImpact]);

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
                lastButtonRef.current = null; // Zera a alternância ao começar
                activeProjectilesRef.current = {};
                prevScore1.current = player1?.score || 0;
                prevScore2.current = player2?.score || 0;
            }
        }
    }, [duelState?.status, player1?.score, player2?.score]);

    // Loop de detecção de colisão (a cada 60ms para não travar)
    useEffect(() => {
        if (duelState?.status !== 'playing') return;
        const interval = setInterval(handleCollisionCheck, 60);
        return () => clearInterval(interval);
    }, [duelState?.status, handleCollisionCheck]);

    useEffect(() => {
        if (!player1 || !player2) return;

        const score1 = Number(player1.score) || 0;
        const score2 = Number(player2.score) || 0;

        // Prioridade: pressão calculada pelo servidor.
        // Aceita tanto 0..100 quanto 0..1000.
        const rawPressure = Number(duelState?.pressure);
        let progress;

        if (Number.isFinite(rawPressure)) {
            progress = rawPressure > 100 ? rawPressure / 10 : rawPressure;
        } else {
            // Fallback local: cada ponto líquido desloca 1.25% da barra.
            // Diferente da proporção score1 / total, isto continua perceptível
            // mesmo quando os dois jogadores têm placares altos e próximos.
            const scoreDifference = score1 - score2;
            progress = 50 + scoreDifference * 1.25;
        }

        setTargetP1Progress(clamp(progress, 0, 100));

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

        const myDelta = isP1 ? delta1 : delta2;
        const opDelta = isP1 ? delta2 : delta1;
        const myScore = isP1 ? score1 : score2;
        const opScore = isP1 ? score2 : score1;

        // O jogador local (LeftPlayer) atira da esquerda (-1.15) para a direita (1.15)
        spawnForPlayer(isP1 ? 'p1' : 'p2', myDelta, -1.15, 1.15, BLUE, myScore);
        
        // O oponente (RightPlayer) atira da direita (1.15) para a esquerda (-1.15)
        spawnForPlayer(isP1 ? 'p2' : 'p1', opDelta, 1.15, -1.15, RED, opScore);

        prevScore1.current = score1;
        prevScore2.current = score2;
    }, [addEffect, duelState?.pressure, player1?.score, player2?.score]);

    const dominanceLabel = useMemo(() => {
        const localProgress = isP1 ? p1Progress : 100 - p1Progress;
        if (localProgress >= 75) return 'DOMINANDO';
        if (localProgress <= 25) return 'SOB PRESSÃO';
        return 'DISPUTA EQUILIBRADA';
    }, [isP1, p1Progress]);

    // A interface sempre mostra o jogador local em azul à esquerda.
    const blueProgress = isP1 ? p1Progress : 100 - p1Progress;

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
                dpr={graphicsSettings.dpr}
                gl={{
                    antialias: graphicsSettings.antialias,
                    powerPreference: graphicsSettings.powerPreference,
                    stencil: false,
                }}
                style={{ position: 'absolute', inset: 0, zIndex: 1 }}
            >
                <CameraRig shakeSignal={shakeSignal} />
                <ambientLight intensity={graphicsSettings.duelEnvironment ? 0.42 : 0.65} />
                <directionalLight position={[-4, 5, 4]} intensity={2.2} color={BLUE_LIGHT} />
                {graphicsSettings.duelExtraDirectional !== false && (
                    <directionalLight position={[4, 5, 4]} intensity={2.2} color={RED_LIGHT} />
                )}
                {graphicsSettings.duelSidePointLights !== false && (
                    <>
                        <pointLight position={[-2, 1.6, 1]} intensity={3} distance={5} color={BLUE} />
                        <pointLight position={[2, 1.6, 1]} intensity={3} distance={5} color={RED} />
                    </>
                )}
                {graphicsSettings.duelEnvironment && <Environment preset="night" />}

                <mesh position={[0, -0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[22, 22]} />
                    <meshStandardMaterial color="#020617" roughness={0.82} metalness={0.18} />
                </mesh>
                <gridHelper
                    args={[22, graphicsTier === 'potato' || graphicsTier === 'low' ? 14 : 28, '#334155', '#172554']}
                    position={[0, 0.005, 0]}
                />

                {graphicsSettings.duelArenaPulse !== false && (
                    <>
                        <ArenaPulse color={BLUE} side="left" />
                        <ArenaPulse color={RED} side="right" />
                    </>
                )}

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
                        onRegisterRef={handleRegisterProjectile}
                        onUnregisterRef={handleUnregisterProjectile}
                        onComplete={() => {
                            setEffects((current) => current.filter((item) => item.id !== effect.id));
                        }}
                    />
                ))}

                {impacts.map((impact) => (
                    impact.type === 'center' 
                        ? <CenterExplosion key={impact.id} position={impact.position} onComplete={() => setImpacts(c => c.filter(i => i.id !== impact.id))} />
                        : <ImpactBurst
                            key={impact.id}
                            position={impact.position}
                            color={impact.color}
                            scale={impact.scale}
                            onComplete={() => setImpacts(c => c.filter(i => i.id !== impact.id))}
                        />
                ))}
            </Canvas>

            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }}>
                {/* BOTÃO DE SAIR */}
                <button 
                    onClick={leaveDuel}
                    style={{
                        position: 'absolute', top: '20px', right: '20px',
                        background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '50%', width: '40px', height: '40px',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        cursor: 'pointer', zIndex: 50, pointerEvents: 'auto',
                        backdropFilter: 'blur(8px)', color: '#ef4444'
                    }}
                >
                    <LogOut size={20} />
                </button>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ color: '#fff', fontWeight: '900', fontSize: '2rem', textShadow: '0 0 10px #ef4444' }}>
                        {duelState.timeLeft}s
                    </div>
                    
                    {/* BARRA DE DOMÍNIO (CABO DE GUERRA) */}
                    <div style={{ 
                        width: '80%', height: '28px', background: '#000', border: '2px solid #333', 
                        borderRadius: '10px', marginTop: '10px', position: 'relative', overflow: 'hidden',
                        display: 'flex', boxShadow: '0 0 15px rgba(255,255,255,0.1)'
                    }}>
                        <div style={{ 
                            width: `${blueProgress}%`, height: '100%', 
                            background: `linear-gradient(90deg, #172554, ${BLUE}, ${BLUE_LIGHT})`,
                            transition: 'none' 
                        }} />
                        
                        <div style={{ 
                            width: `${100 - blueProgress}%`, height: '100%', 
                            background: `linear-gradient(90deg, ${RED_LIGHT}, ${RED}, #450a0a)`,
                            transition: 'none'
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

            {/* BOTÕES DE JOGO - Usando onPointerDown para corrigir cliques fantasmas/duplos no mobile */}
            {duelState.status === 'playing' && (
                <div style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '80px', zIndex: 100, pointerEvents: 'auto' }}>
                    <button 
                        onPointerDown={(e) => { e.stopPropagation(); handleScreenClick(e, '6'); }}
                        style={{
                            width: '100px', height: '100px', borderRadius: '50%',
                            background: blockedFlash && lastButtonRef.current === '6' ? 'rgba(239,68,68,0.4)' : 'rgba(0,0,0,0.8)',
                            border: '4px solid #3b82f6',
                            color: '#3b82f6', fontSize: '3rem', fontWeight: '900', cursor: 'pointer', outline: 'none',
                            boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
                            transition: 'background 0.1s',
                            touchAction: 'manipulation'
                        }}
                    >
                        6
                    </button>
                    <button 
                        onPointerDown={(e) => { e.stopPropagation(); handleScreenClick(e, '7'); }}
                        style={{
                            width: '100px', height: '100px', borderRadius: '50%',
                            background: blockedFlash && lastButtonRef.current === '7' ? 'rgba(239,68,68,0.4)' : 'rgba(0,0,0,0.8)',
                            border: '4px solid #ef4444',
                            color: '#ef4444', fontSize: '3rem', fontWeight: '900', cursor: 'pointer', outline: 'none',
                            boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
                            transition: 'background 0.1s',
                            touchAction: 'manipulation'
                        }}
                    >
                        7
                    </button>
                </div>
            )}
        </div>
    );
}
