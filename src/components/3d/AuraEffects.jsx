import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAuraSystem } from '../../systems/useAuraSystem';
import { usePlayerSystem } from '../../systems/usePlayerSystem';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';

// =========================================
// AURA KI — Progressão de Farm (estilo Dragon Ball)
// =========================================
// Estágios de combo:
//   0    - 50  : Normal            -> sem efeito
//   51   - 100 : Despertar         -> só poeira/vento girando no chão
//   101  - 150 : Ki Emergente      -> poeira mais forte + aura corporal fraca aparece
//   151  - 250 : Fluxo Estável     -> aura corporal contínua, cor fixa
//   251  - 500 : Energia Concentrada -> aura densa, cor cíclica (HSL), vibração
//   500  - 700 : Estado Supremo    -> aura dourada intensa (nuvem mais fina p/ não tampar o personagem)
//   700  - 1000: Transcendência    -> personagem já flutua (usePlayerSystem); vórtice liga chão -> personagem
//   1000 - 1100: Expansão          -> faíscas passam a se espalhar pra fora do corpo, em rajadas
//   1100 - 1500: Halo Desperto     -> um anel de ki estável passa a envolver o personagem
//   1500 - 2000: Absorção          -> em vez de espalhar, o personagem passa a "puxar" partículas de fora pra dentro
//   2000+      : Ápice             -> tudo mais intenso, ki "respira" (pulsa pra fora/dentro) + ondas de choque
//
// Todas as transições entre estágios são suavizadas (lerp), e uma queda brusca de
// combo ("crash") dispara uma dispersão: as partículas ativas no momento voam pra
// fora e desaparecem em ~1s, em vez de sumirem instantaneamente.

const CLOUD_COUNT = 20;   // "nuvens" densas de ki, grudadas ao corpo
const SPARK_COUNT = 80;   // faíscas leves que orbitam / se espalham / são absorvidas
const HALO_COUNT = 28;    // anel estável ao redor do torso (a partir de 1100)
const MAX_PARTICLES = CLOUD_COUNT + SPARK_COUNT + HALO_COUNT;

const DUST_RING_COUNT = 40; // partículas do redemoinho de poeira no chão
const VORTEX_COUNT = 30;    // partículas da coluna que liga chão -> personagem (700+)
const DUST_TOTAL = DUST_RING_COUNT + VORTEX_COUNT;

// Suavização das transições entre estágios (quanto maior, mais rápido "alcança" o alvo)
const TRANSITION_RATE = 3;

// Distâncias usadas pelos modos de movimento das faíscas e pela dispersão de crash
const SPREAD_DIST = 2.6;    // até onde as faíscas viajam no modo "Expansão"
const ABSORB_DIST = 2.6;    // de onde as faíscas vêm no modo "Absorção"
const BREATHE_AMPLITUDE = 0.5;
const CLOUD_BURST_DIST = 1.8;  // quão longe as nuvens voam ao dispersar (crash)
const SPARK_BURST_DIST = 3.4;  // quão longe as faíscas voam ao dispersar (crash)
const DUST_BURST_DIST = 1.6;

// Combo mínimo pra considerar "crash" (queda repentina vindo de um combo ativo)
const CRASH_MIN_PREV_COMBO = 51;
const CRASH_RESET_THRESHOLD = 10;
const CRASH_DURATION = 1.1; // segundos até a dispersão terminar

// -----------------------------------------
// Texturas compartilhadas (criadas 1x, sob demanda, e reaproveitadas por
// todas as instâncias do componente — evita recriar canvas por personagem)
// -----------------------------------------
let sharedGlowMap = null;
function getGlowMap() {
    if (sharedGlowMap) return sharedGlowMap;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);

    gradient.addColorStop(0, 'rgba(255,255,255,1.0)');
    gradient.addColorStop(0.1, 'rgba(255,255,255,0.6)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.15)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    sharedGlowMap = new THREE.CanvasTexture(canvas);
    return sharedGlowMap;
}

let sharedDustMap = null;
function getDustMap() {
    if (sharedDustMap) return sharedDustMap;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);

    gradient.addColorStop(0, 'rgba(230,210,175,0.9)');
    gradient.addColorStop(0.5, 'rgba(230,210,175,0.35)');
    gradient.addColorStop(1, 'rgba(230,210,175,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    sharedDustMap = new THREE.CanvasTexture(canvas);
    return sharedDustMap;
}

// -----------------------------------------
// Tabela de estágios
// -----------------------------------------
// colorHex = null significa "cor dinâmica" (ciclo HSL)
// mode controla o comportamento das faíscas: 'orbit' | 'spread' | 'absorb' | 'breathe'
// cloudOpacityMult / cloudRadiusMult reduzem e afastam a "nuvem" nos estágios altos
// pra não tampar o personagem. halo liga/desliga o anel estável. nova liga as ondas de choque.
const TIERS = [
    { min: 0,    name: 'Normal',              dustCount: 0,  dustIntensity: 0,    clouds: 0,  sparks: 0,  intensity: 0,   speed: 0,   colorHex: '#66bbee', dynamic: false, transcend: false, cloudOpacityMult: 1,    cloudRadiusMult: 1,   mode: 'orbit',   halo: 0, nova: false },
    { min: 51,   name: 'Despertar',           dustCount: 18, dustIntensity: 0.5,  clouds: 0,  sparks: 0,  intensity: 0,   speed: 0,   colorHex: '#bcd8ff', dynamic: false, transcend: false, cloudOpacityMult: 1,    cloudRadiusMult: 1,   mode: 'orbit',   halo: 0, nova: false },
    { min: 101,  name: 'Ki Emergente',        dustCount: 26, dustIntensity: 0.7,  clouds: 6,  sparks: 10, intensity: 0.5, speed: 0.6, colorHex: '#8ecbff', dynamic: false, transcend: false, cloudOpacityMult: 1,    cloudRadiusMult: 1,   mode: 'orbit',   halo: 0, nova: false },
    { min: 151,  name: 'Fluxo Estável',       dustCount: 32, dustIntensity: 0.85, clouds: 14, sparks: 30, intensity: 0.9, speed: 1.1, colorHex: '#44ccff', dynamic: false, transcend: false, cloudOpacityMult: 1,    cloudRadiusMult: 1,   mode: 'orbit',   halo: 0, nova: false },
    { min: 251,  name: 'Energia Concentrada', dustCount: 40, dustIntensity: 1.0,  clouds: 20, sparks: 60, intensity: 1.5, speed: 1.8, colorHex: null,      dynamic: true,  transcend: false, cloudOpacityMult: 0.85, cloudRadiusMult: 1.05, mode: 'orbit',   halo: 0, nova: false },
    { min: 500,  name: 'Estado Supremo',      dustCount: 50, dustIntensity: 1.3,  clouds: 18, sparks: 80, intensity: 2.0, speed: 2.8, colorHex: '#ffd700', dynamic: false, transcend: false, cloudOpacityMult: 0.55, cloudRadiusMult: 1.3, mode: 'orbit',   halo: 0, nova: false },
    { min: 700,  name: 'Transcendência',      dustCount: 50, dustIntensity: 1.6,  clouds: 14, sparks: 80, intensity: 2.2, speed: 3.8, colorHex: '#fff4cc', dynamic: false, transcend: true,  cloudOpacityMult: 0.4,  cloudRadiusMult: 1.5, mode: 'orbit',   halo: 0, nova: false },
    { min: 1000, name: 'Expansão',            dustCount: 50, dustIntensity: 1.8,  clouds: 12, sparks: 80, intensity: 2.4, speed: 3.2, colorHex: '#ffe9a8', dynamic: false, transcend: true,  cloudOpacityMult: 0.35, cloudRadiusMult: 1.6, mode: 'spread',  halo: 0, nova: false },
    { min: 1100, name: 'Halo Desperto',       dustCount: 50, dustIntensity: 1.9,  clouds: 12, sparks: 80, intensity: 2.5, speed: 3.2, colorHex: '#ffe9a8', dynamic: false, transcend: true,  cloudOpacityMult: 0.35, cloudRadiusMult: 1.6, mode: 'spread',  halo: 1, nova: false },
    { min: 1500, name: 'Absorção',            dustCount: 50, dustIntensity: 2.0,  clouds: 12, sparks: 80, intensity: 2.6, speed: 2.6, colorHex: '#c9a6ff', dynamic: false, transcend: true,  cloudOpacityMult: 0.35, cloudRadiusMult: 1.6, mode: 'absorb',  halo: 1, nova: false },
    { min: 2000, name: 'Ápice',               dustCount: 50, dustIntensity: 2.2,  clouds: 12, sparks: 80, intensity: 3.0, speed: 3.0, colorHex: '#ffffff', dynamic: false, transcend: true,  cloudOpacityMult: 0.35, cloudRadiusMult: 1.7, mode: 'breathe', halo: 1, nova: true },
];

function getTier(combo) {
    let tier = TIERS[0];
    for (const t of TIERS) {
        if (combo >= t.min) tier = t;
        else break;
    }
    return tier;
}

// Calcula o raio de uma faísca conforme o modo do estágio atual (não usado durante o crash)
function sparkModeRadius(mode, p, t) {
    switch (mode) {
        case 'spread':
            return p.radius + p.life * SPREAD_DIST;
        case 'absorb':
            return THREE.MathUtils.lerp(ABSORB_DIST, p.radius * 0.35, p.life);
        case 'breathe':
            return p.radius * (1 + Math.sin(t * 1.6 + p.angle) * BREATHE_AMPLITUDE);
        default:
            return p.radius;
    }
}

// =========================================
// AURA CORPORAL — Envoltório difuso de ki ao redor do personagem
// =========================================
function KiAura({ comboCount, crashRef }) {
    const meshRef = useRef();
    const timeRef = useRef(0);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);
    const blackColor = useMemo(() => new THREE.Color(0x000000), []);
    const glowMap = useMemo(() => getGlowMap(), []);

    const smooth = useRef({
        clouds: 0,
        sparks: 0,
        halo: 0,
        intensity: 0,
        speed: 0,
        color: new THREE.Color('#66bbee'),
    });

    const particles = useMemo(() => {
        const arr = [];
        for (let i = 0; i < CLOUD_COUNT + SPARK_COUNT; i++) {
            const isCloud = i < CLOUD_COUNT;
            arr.push({
                isCloud,
                life: Math.random(),
                lifeSpeed: isCloud ? 0.3 + Math.random() * 0.2 : 0.4 + Math.random() * 0.4,
                angle: Math.random() * Math.PI * 2,
                radius: isCloud ? 0.3 + Math.random() * 0.3 : 0.45 + Math.random() * 0.45,
                baseSize: isCloud ? 1.4 + Math.random() * 1.0 : 0.1 + Math.random() * 0.12,
                speed: isCloud ? 0.5 + Math.random() * 0.5 : 1.0 + Math.random() * 1.0,
                heightOffset: isCloud ? 0.0 + Math.random() * 1.6 : -0.2 + Math.random() * 1.9,
            });
        }
        return arr;
    }, []);

    // Anel de halo: posições fixas e igualmente espaçadas ao redor do torso
    const haloParticles = useMemo(() => {
        const arr = [];
        for (let i = 0; i < HALO_COUNT; i++) {
            arr.push({
                angle: (i / HALO_COUNT) * Math.PI * 2,
                heightJitter: Math.random() * 0.15,
                phase: Math.random() * Math.PI * 2,
                baseSize: 0.14 + Math.random() * 0.06,
            });
        }
        return arr;
    }, []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        timeRef.current += delta;
        const t = timeRef.current;
        const camPos = state.camera.position;

        const crash = crashRef.current;
        const isCrashing = crash.active;
        const tier = isCrashing ? crash.tier : getTier(comboCount);
        const burstProgress = isCrashing ? Math.min(1, crash.timer / crash.duration) : 0;
        const fadeMult = isCrashing ? Math.max(0, 1 - burstProgress) : 1;

        const k = 1 - Math.exp(-TRANSITION_RATE * delta);
        const s = smooth.current;
        s.clouds = THREE.MathUtils.lerp(s.clouds, tier.clouds, k);
        s.sparks = THREE.MathUtils.lerp(s.sparks, tier.sparks, k);
        s.halo = THREE.MathUtils.lerp(s.halo, tier.halo * HALO_COUNT, k);
        s.intensity = THREE.MathUtils.lerp(s.intensity, tier.intensity, k);
        s.speed = THREE.MathUtils.lerp(s.speed, tier.speed, k);

        const targetHex = tier.dynamic ? `hsl(${Math.floor(t * 150) % 360}, 100%, 70%)` : tier.colorHex;
        tempColor.set(targetHex);
        s.color.lerp(tempColor, k);

        const activeClouds = Math.round(s.clouds);
        const activeSparks = Math.round(s.sparks);
        const activeHalo = Math.round(s.halo);
        const intensity = s.intensity;
        const speed = s.speed;

        // --- Nuvens + Faíscas ---
        for (let i = 0; i < CLOUD_COUNT + SPARK_COUNT; i++) {
            const p = particles[i];
            const isActive = p.isCloud ? (i < activeClouds) : (i - CLOUD_COUNT < activeSparks);

            if (isActive) {
                p.life += delta * p.lifeSpeed;
                if (p.life >= 1.0) p.life = 0;

                const lifeCurve = p.life * (1.0 - p.life) * 4.0;
                const h = p.heightOffset + Math.sin(t * 5.0 + p.angle) * 0.05;
                const currentAngle = p.angle + t * p.speed * speed;
                const vibration = intensity > 1.2 ? Math.sin(t * 40 + i) * 0.03 * (intensity - 1.2) : 0;

                let currentRadius;
                if (isCrashing) {
                    const burstDist = p.isCloud ? CLOUD_BURST_DIST : SPARK_BURST_DIST;
                    currentRadius = p.radius + burstProgress * burstDist + vibration;
                } else if (p.isCloud) {
                    currentRadius = p.radius * tier.cloudRadiusMult + vibration;
                } else {
                    currentRadius = sparkModeRadius(tier.mode, p, t) + vibration;
                }

                dummy.position.set(Math.cos(currentAngle) * currentRadius, h, Math.sin(currentAngle) * currentRadius);
                dummy.lookAt(camPos);

                const sizeMult = 1.0 + Math.min(intensity * 0.15, 0.45);
                const scale = p.baseSize * lifeCurve * sizeMult;
                dummy.scale.set(scale, scale, scale);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);

                const cloudOpacity = p.isCloud ? tier.cloudOpacityMult : 1;
                const opacityMult = (p.isCloud ? 0.22 * intensity : 0.75 * intensity) * cloudOpacity * fadeMult;
                tempColor.copy(s.color).multiplyScalar(lifeCurve * opacityMult);
                meshRef.current.setColorAt(i, tempColor);
            } else {
                dummy.position.set(0, -9999, 0);
                dummy.scale.set(0, 0, 0);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
                meshRef.current.setColorAt(i, blackColor);
            }
        }

        // --- Halo (anel estável ao redor do torso, a partir de "Halo Desperto") ---
        const haloRadius = 0.62 * tier.cloudRadiusMult;
        for (let i = 0; i < HALO_COUNT; i++) {
            const hp = haloParticles[i];
            const idx = CLOUD_COUNT + SPARK_COUNT + i;

            if (i < activeHalo) {
                const angle = hp.angle + t * 0.3;
                const radiusOffset = isCrashing ? burstProgress * SPARK_BURST_DIST * 0.6 : 0;
                const radius = haloRadius + radiusOffset;
                const y = 1.0 + Math.sin(t * 1.5 + hp.phase) * hp.heightJitter;

                dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
                dummy.lookAt(camPos);
                const pulse = 0.85 + Math.sin(t * 2.0 + hp.phase) * 0.15;
                const scale = hp.baseSize * pulse;
                dummy.scale.set(scale, scale, scale);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(idx, dummy.matrix);

                tempColor.copy(s.color).multiplyScalar(0.7 * intensity * fadeMult);
                meshRef.current.setColorAt(idx, tempColor);
            } else {
                dummy.position.set(0, -9999, 0);
                dummy.scale.set(0, 0, 0);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(idx, dummy.matrix);
                meshRef.current.setColorAt(idx, blackColor);
            }
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    });

    const crash = crashRef.current;
    if (!crash.active && comboCount < 101) return null; // antes disso só existe a poeira do chão

    return (
        <instancedMesh ref={meshRef} args={[null, null, MAX_PARTICLES]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
                map={glowMap}
                toneMapped={false}
                blending={THREE.AdditiveBlending}
                transparent
                depthWrite={false}
            />
        </instancedMesh>
    );
}

// =========================================
// POEIRA DO CHÃO + VÓRTICE — Redemoinho de ki/vento ao redor dos pés,
// que a partir da Transcendência (700+) vira uma coluna ligando o chão
// ao personagem já flutuando.
// =========================================
function GroundAura({ comboCount, floatHeight, crashRef }) {
    const meshRef = useRef();
    const timeRef = useRef(0);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);
    const dustTint = useMemo(() => new THREE.Color(), []);
    const blackColor = useMemo(() => new THREE.Color(0x000000), []);
    const dustMap = useMemo(() => getDustMap(), []);

    const smooth = useRef({
        dustCount: 0,
        intensity: 0,
        color: new THREE.Color('#bcd8ff'),
    });

    const ringParticles = useMemo(() => {
        const arr = [];
        for (let i = 0; i < DUST_RING_COUNT; i++) {
            arr.push({
                angle: Math.random() * Math.PI * 2,
                radius: 0.9 + Math.random() * 0.5,
                speed: 0.6 + Math.random() * 0.6,
                bobPhase: Math.random() * Math.PI * 2,
                life: Math.random(),
                lifeSpeed: 0.3 + Math.random() * 0.3,
                baseSize: 0.18 + Math.random() * 0.22,
            });
        }
        return arr;
    }, []);

    const vortexParticles = useMemo(() => {
        const arr = [];
        for (let i = 0; i < VORTEX_COUNT; i++) {
            arr.push({
                heightRatio: i / VORTEX_COUNT + Math.random() * 0.03,
                angle: Math.random() * Math.PI * 2,
                spin: 2.5 + Math.random() * 1.5,
                life: Math.random(),
                lifeSpeed: 0.5 + Math.random() * 0.4,
                baseSize: 0.12 + Math.random() * 0.16,
            });
        }
        return arr;
    }, []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        timeRef.current += delta;
        const t = timeRef.current;

        const crash = crashRef.current;
        const isCrashing = crash.active;
        const tier = isCrashing ? crash.tier : getTier(comboCount);
        const burstProgress = isCrashing ? Math.min(1, crash.timer / crash.duration) : 0;
        const fadeMult = isCrashing ? Math.max(0, 1 - burstProgress) : 1;

        const k = 1 - Math.exp(-TRANSITION_RATE * delta);
        const s = smooth.current;
        s.dustCount = THREE.MathUtils.lerp(s.dustCount, tier.dustCount, k);
        s.intensity = THREE.MathUtils.lerp(s.intensity, tier.dustIntensity, k);

        const targetHex = tier.dynamic ? `hsl(${Math.floor(t * 150) % 360}, 100%, 70%)` : tier.colorHex;
        tempColor.set(targetHex);
        s.color.lerp(tempColor, k);

        const activeDust = Math.round(s.dustCount);
        const intensity = s.intensity;
        const transcending = tier.transcend && !isCrashing;

        dustTint.copy(s.color).lerp(new THREE.Color('#d8c9a3'), 0.5);

        // --- Anel de poeira no chão ---
        for (let i = 0; i < DUST_RING_COUNT; i++) {
            const p = ringParticles[i];
            const idx = i;

            if (i < activeDust) {
                p.life += delta * p.lifeSpeed;
                if (p.life >= 1.0) p.life = 0;
                const lifeCurve = p.life * (1.0 - p.life) * 4.0;

                const angle = p.angle + t * p.speed * (0.5 + intensity * 0.5);
                const burstOffset = isCrashing ? burstProgress * DUST_BURST_DIST : 0;
                const radius = p.radius + burstOffset + Math.sin(t * 2 + p.bobPhase) * 0.05;
                const y = 0.05 + Math.sin(t * 3 + p.bobPhase) * 0.05 * intensity;

                dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
                dummy.rotation.set(-Math.PI / 2, 0, angle);
                const scale = p.baseSize * lifeCurve * (0.6 + intensity * 0.6);
                dummy.scale.set(scale, scale, scale);
                dummy.updateMatrix();

                meshRef.current.setMatrixAt(idx, dummy.matrix);
                tempColor.copy(dustTint).multiplyScalar(lifeCurve * intensity * 0.9 * fadeMult);
                meshRef.current.setColorAt(idx, tempColor);
            } else {
                dummy.position.set(0, -9999, 0);
                dummy.scale.set(0, 0, 0);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(idx, dummy.matrix);
                meshRef.current.setColorAt(idx, blackColor);
            }
        }

        // --- Coluna/vórtice ligando o chão ao personagem (Transcendência+) ---
        const topHeight = Math.max(0, floatHeight) + 1.6;
        for (let i = 0; i < VORTEX_COUNT; i++) {
            const p = vortexParticles[i];
            const idx = DUST_RING_COUNT + i;

            if (transcending) {
                p.life += delta * p.lifeSpeed;
                if (p.life >= 1.0) p.life = 0;
                const lifeCurve = p.life * (1.0 - p.life) * 4.0;

                const h = p.heightRatio * topHeight;
                const radius = THREE.MathUtils.lerp(1.1, 0.28, p.heightRatio);
                const angle = p.angle + t * p.spin + p.heightRatio * Math.PI * 3;

                dummy.position.set(Math.cos(angle) * radius, h, Math.sin(angle) * radius);
                dummy.lookAt(state.camera.position);
                const scale = p.baseSize * lifeCurve * (0.8 + intensity * 0.5);
                dummy.scale.set(scale, scale, scale);
                dummy.updateMatrix();

                meshRef.current.setMatrixAt(idx, dummy.matrix);
                tempColor.copy(s.color).multiplyScalar(lifeCurve * intensity * 1.1 * fadeMult);
                meshRef.current.setColorAt(idx, tempColor);
            } else {
                dummy.position.set(0, -9999, 0);
                dummy.scale.set(0, 0, 0);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(idx, dummy.matrix);
                meshRef.current.setColorAt(idx, blackColor);
            }
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    });

    const crash = crashRef.current;
    if (!crash.active && comboCount < 51) return null;

    return (
        <group position={[0, -Math.max(0, floatHeight), 0]}>
            <instancedMesh ref={meshRef} args={[null, null, DUST_TOTAL]}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial
                    map={dustMap}
                    toneMapped={false}
                    blending={THREE.AdditiveBlending}
                    transparent
                    depthWrite={false}
                />
            </instancedMesh>
        </group>
    );
}

// =========================================
// ONDAS DE CHOQUE — Pulsos expandindo a partir do personagem (Ápice, 2000+)
// =========================================
function NovaShockwaves({ comboCount, crashRef }) {
    const ringRefs = useRef([]);
    const timeRef = useRef(0);
    const RING_COUNT = 3;
    const CYCLE = 1.8;

    useFrame((_, delta) => {
        timeRef.current += delta;
        const crash = crashRef.current;
        const isCrashing = crash.active;
        const tier = isCrashing ? crash.tier : getTier(comboCount);
        const fadeMult = isCrashing ? Math.max(0, 1 - crash.timer / crash.duration) : 1;
        const active = tier.nova;

        for (let i = 0; i < RING_COUNT; i++) {
            const ring = ringRefs.current[i];
            if (!ring) continue;

            if (!active) {
                ring.visible = false;
                continue;
            }

            ring.visible = true;
            const phase = (((timeRef.current + (i * CYCLE) / RING_COUNT)) % CYCLE) / CYCLE;
            const scale = 0.6 + phase * 3.2;
            ring.scale.set(scale, scale, scale);
            ring.material.opacity = (1 - phase) * 0.5 * fadeMult;
        }
    });

    return (
        <group position={[0, 1.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            {[0, 1, 2].map((i) => (
                <mesh key={i} ref={(el) => (ringRefs.current[i] = el)} visible={false}>
                    <ringGeometry args={[0.85, 1.0, 48]} />
                    <meshBasicMaterial
                        color="#ffffff"
                        transparent
                        opacity={0}
                        toneMapped={false}
                        blending={THREE.AdditiveBlending}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

// =========================================
// AURA EFFECTS — Componente Principal
// =========================================
export function AuraEffects({ 
    isRemote = false, 
    remoteComboRef = null, 
    remoteHitId = 0, 
    remoteLastPoints = 0, 
    remoteMessage = '', 
    remotePosition = [0, 0, 0] 
} = {}) {
    const localAura = useAuraSystem();
    const localPosition = usePlayerSystem((state) => state.position);

    // Usa Ref se for remoto (para evitar re-renders no react tree) ou Zustand se for local
    const comboCount = isRemote && remoteComboRef ? remoteComboRef.current : localAura.comboCount;
    const hitId = isRemote ? remoteHitId : localAura.hitId;
    const lastPoints = isRemote ? remoteLastPoints : localAura.lastPoints;
    const message = isRemote ? remoteMessage : localAura.message;
    const position = isRemote ? remotePosition : localPosition;

    const groupRef = useRef();
    const tier = getTier(comboCount);
    const shakeMagnitude = tier.intensity * 0.018; // escala com o estágio, sem salto abrupto

    // Estado de "crash": detecta queda brusca de combo e conduz a dispersão das
    // partículas (fade-out + explosão pra fora) em vez de sumir instantaneamente.
    const crashRef = useRef({ active: false, timer: 0, duration: CRASH_DURATION, tier: TIERS[0] });
    const prevComboRef = useRef(comboCount);

    // Pop-up de Texto
    const textRef = useRef();
    const [popup, setPopup] = useState({ text: '', x: 0, y: 0, opacity: 0, scale: 0, isCombo: false });

    useEffect(() => {
        // hitId === 0 é usado como sentinela de "nenhum hit ainda"; se o sistema
        // de combate algum dia gerar hitId 0 como valor real, ajustar aqui.
        if (hitId !== 0 && lastPoints > 0) {
            const isCombo = lastPoints >= 50;
            const popupText = (message && message.trim() !== '') ? message : `+${lastPoints}`;

            setPopup({
                text: popupText,
                x: isCombo ? 0.4 : 0.0,
                y: isCombo ? 1.5 : 0.5,
                opacity: 1.5,
                scale: 0.1,
                isCombo,
            });
        }
    }, [hitId, lastPoints, message]);

    useFrame((_, delta) => {
        // Detecta crash: combo caiu bruscamente vindo de um valor "ativo"
        const prevCombo = prevComboRef.current;
        if (comboCount < prevCombo && prevCombo >= CRASH_MIN_PREV_COMBO && comboCount <= CRASH_RESET_THRESHOLD) {
            crashRef.current.active = true;
            crashRef.current.timer = 0;
            crashRef.current.tier = getTier(prevCombo);
        }
        prevComboRef.current = comboCount;

        if (crashRef.current.active) {
            crashRef.current.timer += delta;
            if (crashRef.current.timer >= crashRef.current.duration) {
                crashRef.current.active = false;
            }
        }

        if (groupRef.current) {
            const shakeX = shakeMagnitude > 0 ? (Math.random() - 0.5) * shakeMagnitude : 0;
            const shakeY = shakeMagnitude > 0 ? (Math.random() - 0.5) * shakeMagnitude : 0;
            groupRef.current.position.set(
                position[0] + shakeX,
                position[1] + shakeY,
                position[2]
            );
        }

        if (popup.opacity > 0) {
            setPopup((prev) => {
                if (prev.opacity <= 0) return prev;
                const newOpacity = prev.opacity - delta * 0.7;
                const jumpForce  = Math.max(0, 1.5 - (1.5 - prev.opacity) * 3);
                const newY       = prev.y + delta * jumpForce;
                let newScale     = prev.scale;
                if (prev.opacity > 1.3)  newScale = prev.scale + delta * 15;
                else if (prev.scale > 1.0) newScale = prev.scale - delta * 5;
                return { ...prev, y: newY, opacity: newOpacity, scale: Math.max(0, newScale) };
            });
        }
    });

    const colorCombo  = useMemo(() => new THREE.Color('#d8b4fe').multiplyScalar(3.0), []);
    const colorNormal = useMemo(() => new THREE.Color('#86efac').multiplyScalar(3.0), []);

    return (
        <group ref={groupRef} position={[position[0], position[1], position[2]]}>
            {/* Pop-up de pontos MENOR e SEMPRE NA FRENTE */}
            <Billboard position={[popup.x, popup.y + 1.2, 0.8]}>
                <Text
                    ref={textRef}
                    fontSize={(popup.isCombo ? 0.20 : 0.13) * Math.max(0.01, popup.scale)}
                    color={popup.isCombo ? colorCombo : colorNormal}
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.03}
                    outlineColor={popup.isCombo ? '#7e22ce' : '#166534'}
                    fillOpacity={Math.max(0, Math.min(popup.opacity, 1))}
                    outlineOpacity={Math.max(0, Math.min(popup.opacity, 1))}
                    depthTest={false}
                    renderOrder={999}
                >
                    {popup.text}
                </Text>
            </Billboard>

            {/* Poeira/vento no chão (51+), vórtice de transcendência (700+) */}
            <GroundAura comboCount={comboCount} floatHeight={position[1]} crashRef={crashRef} />

            {/* Aura corporal difusa, halo e modos de faísca (101+) */}
            <KiAura comboCount={comboCount} crashRef={crashRef} />

            {/* Ondas de choque do Ápice (2000+) */}
            <NovaShockwaves comboCount={comboCount} crashRef={crashRef} />
        </group>
    );
}