import React, { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { WaterFountain } from './WaterFountain';
import { useGLTF, useTexture } from '@react-three/drei';
import { useCollisionSystem } from '../../systems/useCollisionSystem';
import { usePlayerSystem } from '../../systems/usePlayerSystem';
import { useGraphicsSystem } from '../../systems/useGraphicsSystem';
import { useMapActivitiesSystem } from '../../systems/useMapActivitiesSystem';
import { AmbientMagic } from './AmbientMagic';
import { MapActivities } from './MapActivities';

// Pre-load para carregar mais rápido
useGLTF.preload('/itens/arvore1.glb');
useGLTF.preload('/itens/arvore2.glb');
useGLTF.preload('/itens/arvore3.glb');
useGLTF.preload('/itens/brinquedo1.glb');
useGLTF.preload('/itens/brinquedo2.glb');
useGLTF.preload('/itens/brinquedo3.glb');
useGLTF.preload('/itens/arbusto1.glb');
useGLTF.preload('/itens/arbusto2.glb');
useGLTF.preload('/itens/arbusto3.glb');
useGLTF.preload('/itens/mesa_piquinique.glb');
useGLTF.preload('/itens/poste_luz.glb');
useGLTF.preload('/itens/foodtruck1.glb');
useGLTF.preload('/itens/pipoqueiro.glb');
useGLTF.preload('/itens/predio1.glb');
useGLTF.preload('/itens/predio2.glb');
useGLTF.preload('/itens/predio3.glb');
useGLTF.preload('/itens/predio4.glb');
useGLTF.preload('/itens/fonte2.glb');
useGLTF.preload('/itens/maquinaderefri.glb');

// Componente utilitário para renderizar instâncias de GLTF
function GLTFModel({ url, position, rotation, scale = 1 }) {
    const { scene } = useGLTF(url);
    const propCastShadows = useGraphicsSystem((state) => state.settings.propCastShadows);
    const copiedScene = useMemo(() => scene.clone(), [scene]);
    
    useMemo(() => {
        copiedScene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = propCastShadows;
                child.receiveShadow = true;
            }
        });
    }, [copiedScene, propCastShadows]);
    
    return <primitive object={copiedScene} position={position} rotation={rotation} scale={scale} />;
}

// Componente específico para a Fonte (para escurecer a pedra e dar detalhes, mantendo a água clara)
function DarkFountain({ position, rotation, scale = 1 }) {
    const { scene } = useGLTF('/itens/fonte2.glb');
    const propCastShadows = useGraphicsSystem((state) => state.settings.propCastShadows);
    const registerObstacle = useCollisionSystem((state) => state.registerObstacle);
    const removeObstacle = useCollisionSystem((state) => state.removeObstacle);

    useEffect(() => {
        // Protege a fonte inteira com um raio proporcional à sua escala
        registerObstacle('center_fountain', position[0], position[2], scale * 2.2);
        return () => removeObstacle('center_fountain');
    }, [position, scale, registerObstacle, removeObstacle]);
    const copiedScene = useMemo(() => {
        const clone = scene.clone();
        clone.traverse((child) => {
            if (child.isMesh) {
                // Fonte é landmark: ainda projeta sombra no médio/alto; no baixo não
                child.castShadow = propCastShadows;
                child.receiveShadow = true;
                if (child.material) {
                    child.material = child.material.clone();
                    const matName = child.material.name.toLowerCase();
                    const isWater = matName.includes('agua') || matName.includes('water') || matName.includes('liquid') || child.material.transparent;
                    
                    if (!isWater) {
                        // Pedra um pouco mais clara (antes 0.35)
                        child.material.color.multiplyScalar(0.65);
                        child.material.roughness = 0.75;
                        child.material.metalness = 0.35;
                    }
                }
            }
        });
        return clone;
    }, [scene, propCastShadows]);
    
    return <primitive object={copiedScene} position={position} rotation={rotation} scale={scale} />;
}

function SmokeEffect({ position }) {
    const groupRef = useRef();
    
    useFrame((state) => {
        if (!groupRef.current) return;
        const time = state.clock.elapsedTime;
        groupRef.current.children.forEach((mesh, i) => {
            const t = (time + (i * 0.5)) % 3.0; // ciclo de 3 segundos
            mesh.position.y = t * 1.2; // sobe devagar
            mesh.position.x = Math.sin(t * 2 + i) * 0.2; // balanço horizontal
            mesh.position.z = Math.cos(t * 1.5 + i) * 0.2;
            mesh.scale.setScalar(0.5 + (t * 0.4)); // cresce enquanto sobe
            mesh.material.opacity = Math.max(0, 0.4 - (t / 3.0)); // começa em 0.4 e some
        });
    });

    return (
        <group ref={groupRef} position={position}>
            {Array.from({ length: 6 }).map((_, i) => (
                <mesh key={i} position={[0, -10, 0]}>
                    <sphereGeometry args={[0.6, 8, 8]} />
                    <meshBasicMaterial color="#d1d5db" transparent opacity={0} depthWrite={false} />
                </mesh>
            ))}
        </group>
    );
}

// Componente de Loja de Poções (Máquina de Refri com interação)
function ShopMachine({ position, rotation, scale = 1 }) {
    const { scene } = useGLTF('/itens/maquinaderefri.glb');
    const propCastShadows = useGraphicsSystem((state) => state.settings.propCastShadows);
    const showSmoke = useGraphicsSystem((state) => (state.settings.particles || 'normal') !== 'none');
    const registerObstacle = useCollisionSystem((state) => state.registerObstacle);
    const removeObstacle = useCollisionSystem((state) => state.removeObstacle);
    const groupRef = useRef();

    // Registra a colisão da máquina no mapa
    useEffect(() => {
        registerObstacle('potion_shop', position[0], position[2], 1.5);
        return () => removeObstacle('potion_shop');
    }, [position, registerObstacle, removeObstacle]);

    // Checa a distância do jogador em cada frame e faz a máquina girar
    useFrame((state, delta) => {
        if (groupRef.current) {
            // Gira a máquina em 360 no próprio eixo
            groupRef.current.rotation.y += delta * 0.5;
        }

        const playerPos = usePlayerSystem.getState().position;
        const dist = Math.sqrt(
            Math.pow(playerPos[0] - position[0], 2) +
            Math.pow(playerPos[2] - position[2], 2)
        );

        const near = dist < 4.0;
        useMapActivitiesSystem.getState().setNearShop(near);
    });

    useEffect(() => {
        return () => useMapActivitiesSystem.getState().setNearShop(false);
    }, []);

    const copiedScene = useMemo(() => {
        const clone = scene.clone();
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = propCastShadows;
                child.receiveShadow = true;
            }
        });
        return clone;
    }, [scene, propCastShadows]);

    return (
        <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
            <primitive object={copiedScene} />
            
            {/* Fumaça indicativa na máquina */}
            {showSmoke && <SmokeEffect position={[0, 1.5, 0]} />}
        </group>
    );
}

// Gerador de números pseudo-aleatórios com seed fixa
// Garante que o mapa seja sempre idêntico em todas as jogadas
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// Parquinho Infantil
function Playground() {
    const registerObstacle = useCollisionSystem((state) => state.registerObstacle);
    const removeObstacle = useCollisionSystem((state) => state.removeObstacle);

    useEffect(() => {
        // Grupo está em [25, 0, 25]
        const groupX = 25, groupZ = 25;
        
        // Posições locais
        const slideLocalX = -6, slideLocalZ = -4; 
        const climberLocalX = 7, climberLocalZ = 6;
        const seesawLocalX = 0, seesawLocalZ = -8;

        registerObstacle('toy_slide', groupX + slideLocalX, groupZ + slideLocalZ, 2.0);
        registerObstacle('toy_climber', groupX + climberLocalX, groupZ + climberLocalZ, 2.0); // Raio reduzido acompanhando escala
        registerObstacle('toy_seesaw', groupX + seesawLocalX, groupZ + seesawLocalZ, 1.5);

        return () => {
            removeObstacle('toy_slide');
            removeObstacle('toy_climber');
            removeObstacle('toy_seesaw');
        };
    }, [registerObstacle, removeObstacle]);

    return (
        <group position={[25, 0, 25]}>
            {/* Brinquedo 1 (Escorrega/Balanço) */}
            <GLTFModel url="/itens/brinquedo1.glb" position={[-6, 0, -4]} rotation={[0, Math.PI / 4, 0]} scale={0.8} />
            
            {/* Brinquedo 2 (Escalador) - Escala reduzida consideravelmente */}
            <GLTFModel url="/itens/brinquedo2.glb" position={[7, 0, 6]} rotation={[0, -Math.PI / 6, 0]} scale={0.3} />
            
            {/* Brinquedo 3 */}
            <GLTFModel url="/itens/brinquedo3.glb" position={[0, 0, -8]} rotation={[0, Math.PI, 0]} scale={0.8} />
        </group>
    );
}

function ScatteredTrees() {
    const registerObstacle = useCollisionSystem((state) => state.registerObstacle);
    const removeObstacle = useCollisionSystem((state) => state.removeObstacle);
    const treeCount = useGraphicsSystem((state) => state.settings.parkTrees ?? 25);

    const trees = useMemo(() => {
        const generated = [];
        const types = ['arvore1', 'arvore2', 'arvore3'];
        const random = mulberry32(12345); // Seed fixa para as árvores
        
        for (let i = 0; i < 25; i++) {
            let x, z;
            let isValid = false;
            
            while (!isValid) {
                x = (random() - 0.5) * 90; 
                z = (random() - 0.5) * 90; 
                
                const distToCenter = Math.hypot(x, z);
                const inCrossStreet = Math.abs(x) < 8 || Math.abs(z) < 8;
                const inPlayground = Math.hypot(x - 25, z - 25) < 12; 
                
                if (distToCenter > 18 && !inCrossStreet && !inPlayground) {
                    isValid = true;
                }
            }
            
            generated.push({
                id: i,
                type: types[Math.floor(random() * types.length)],
                position: [x, 0, z],
                rotation: [0, random() * Math.PI * 2, 0],
                scale: 0.8 + random() * 0.6 
            });
        }
        return generated.slice(0, Math.max(0, treeCount));
    }, [treeCount]);

    // Registra as árvores no Radar
    useEffect(() => {
        trees.forEach(tree => {
            // As árvores têm raio de colisão médio de 1.5 a 2 metros baseado na escala
            const colRadius = tree.scale * 1.5;
            registerObstacle(`tree_${tree.id}`, tree.position[0], tree.position[2], colRadius);
        });

        return () => {
            trees.forEach(tree => {
                removeObstacle(`tree_${tree.id}`);
            });
        };
    }, [trees, registerObstacle, removeObstacle]);

    return (
        <group>
            {trees.map(tree => (
                <GLTFModel 
                    key={tree.id}
                    url={`/itens/${tree.type}.glb`} 
                    position={tree.position} 
                    rotation={tree.rotation} 
                    scale={tree.scale} 
                />
            ))}
        </group>
    );
}

function ScatteredBushes() {
    const bushCount = useGraphicsSystem((state) => state.settings.parkBushes ?? 30);

    const bushes = useMemo(() => {
        const generated = [];
        const types = ['arbusto1', 'arbusto2', 'arbusto3'];
        const random = mulberry32(54321); // Seed fixa diferente das árvores
        
        for (let i = 0; i < 30; i++) {
            let x, z;
            let isValid = false;
            
            while (!isValid) {
                x = (random() - 0.5) * 90; 
                z = (random() - 0.5) * 90; 
                
                const distToCenter = Math.hypot(x, z);
                const inCrossStreet = Math.abs(x) < 6 || Math.abs(z) < 6; 
                
                if (distToCenter > 16 && !inCrossStreet) {
                    isValid = true;
                }
            }
            
            generated.push({
                id: i,
                type: types[Math.floor(random() * types.length)],
                position: [x, 0, z],
                rotation: [0, random() * Math.PI * 2, 0],
                scale: 0.6 + random() * 0.5 
            });
        }
        return generated.slice(0, Math.max(0, bushCount));
    }, [bushCount]);
    
    return (
        <group>
            {bushes.map(bush => (
                <GLTFModel 
                    key={bush.id}
                    url={`/itens/${bush.type}.glb`} 
                    position={bush.position} 
                    rotation={bush.rotation} 
                    scale={bush.scale} 
                />
            ))}
        </group>
    );
}

// Mobília do Parque (Mesas, Foodtruck, Postes)
function ParkFurniture() {
    const registerObstacle = useCollisionSystem((state) => state.registerObstacle);
    const removeObstacle = useCollisionSystem((state) => state.removeObstacle);
    const poleCount = useGraphicsSystem((state) => state.settings.parkPoles ?? 10);

    const furniture = useMemo(() => {
        const items = [];
        
        // 1. Mesas de Piquenique na Grama
        const picnicSpots = [
            { x: -20, z: -25 },
            { x: -35, z: -15 },
            { x: -25, z: 20 },
            { x: 30, z: -30 }
        ];

        picnicSpots.forEach((spot, i) => {
            items.push({
                id: `picnic_${i}`,
                type: 'mesa_piquinique',
                position: [spot.x, 0, spot.z],
                rotation: [0, Math.random() * Math.PI, 0],
                scale: 1,
                colRadius: 2.0 
            });
        });

        // 2. Food Truck e Pipoqueiro (Nas ruas laterais da praça)
        items.push({
            id: 'foodtruck',
            type: 'foodtruck1',
            position: [-30, 0, 30], // posição mais estratégica
            rotation: [0, Math.PI / 2, 0],
            scale: 0.9, // um pouco maior para facilitar a visualização
            colRadius: 2.0 
        });

        items.push({
            id: 'pipoqueiro',
            type: 'pipoqueiro',
            position: [22, 1.5, 0], // Subi bastante (1.5m)
            rotation: [0, -Math.PI / 2, 0], 
            scale: 3.0, 
            colRadius: 1.5 
        });

        // 3. Postes de Luz ao redor da praça / vias
        const totalPoles = Math.max(0, poleCount);
        for (let i = 0; i < totalPoles; i++) {
            const angle = (Math.PI * 2 / Math.max(totalPoles, 1)) * i;
            const r = 24;
            const x = Math.sin(angle) * r;
            const z = Math.cos(angle) * r;
            
            items.push({
                id: `pole_${i}`,
                type: 'poste_luz',
                position: [x, 0, z],
                rotation: [0, angle + Math.PI, 0],
                scale: 0.45,
                colRadius: 0.5
            });
        }

        return items;
    }, [poleCount]);

    // Registra colisões
    useEffect(() => {
        furniture.forEach(item => {
            registerObstacle(item.id, item.position[0], item.position[2], item.colRadius);
        });
        return () => {
            furniture.forEach(item => removeObstacle(item.id));
        };
    }, [furniture, registerObstacle, removeObstacle]);

    return (
        <group>
            {furniture.map(item => (
                <GLTFModel 
                    key={item.id} 
                    url={`/itens/${item.type}.glb`} 
                    position={item.position} 
                    rotation={item.rotation} 
                    scale={item.scale} 
                />
            ))}
        </group>
    );
}

// ---------------------------------------------------------
// TEXTURAS PROCEDURAIS PARA O CITY SKYLINE (Janelas)
// ---------------------------------------------------------
let sharedWindowTexture = null;
function getWindowTexture() {
    if (sharedWindowTexture) return sharedWindowTexture;
    
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Fundo branco puro (para a cor do material pintar a "parede")
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 64, 64);

    // Janelas (pontos escuros)
    ctx.fillStyle = '#0a0a0a';
    
    // Desenha um padrão de grade (4x4 janelas por bloco de textura)
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            // Algumas janelas amarelas (acesas) aleatoriamente, outras pretas
            if (Math.random() > 0.9) {
                ctx.fillStyle = '#fde047'; // amarelo suave
            } else {
                ctx.fillStyle = '#0a0a0a'; // preto
            }
            ctx.fillRect(c * 16 + 2, r * 16 + 2, 8, 12); // (x, y, width, height)
        }
    }

    sharedWindowTexture = new THREE.CanvasTexture(canvas);
    sharedWindowTexture.wrapS = THREE.RepeatWrapping;
    sharedWindowTexture.wrapT = THREE.RepeatWrapping;
    // NearestFilter deixa os pixels duros/retos (ótimo para janelas)
    sharedWindowTexture.magFilter = THREE.NearestFilter;
    
    return sharedWindowTexture;
}

// Prédios ao redor do Parque (City Skyline)
// Anel contínuo sem buracos via InstancedMesh (leve) + poucos GLB de detalhe.
// Parede invisível: worldRadius no limite da grama.
function CitySkyline() {
    const registerObstacle = useCollisionSystem((state) => state.registerObstacle);
    const removeObstacle = useCollisionSystem((state) => state.removeObstacle);
    const setWorldRadius = useCollisionSystem((state) => state.setWorldRadius);
    const fillMeshRef = useRef();
    const backMeshRef = useRef();
    const effectiveTier = useGraphicsSystem((state) => state.effectiveTier);

    const PLAY_RADIUS = 48; // grama ~±50 — não deixa entrar nos prédios

    const skyData = useMemo(() => {
        const random = mulberry32(88888);
        const pattern = ['predio1', 'predio3', 'predio1', 'predio4', 'predio2', 'predio3'];
        const jsColors = ['#808080', '#333333', '#b3b3b3', '#111111'];

        const density =
            effectiveTier === 'potato' ? { glb: 0, fill: 24, back: 16 }
            : effectiveTier === 'low' ? { glb: 6, fill: 32, back: 24 }
            : { glb: 12, fill: 48, back: 36 };

        const glbBuildings = [];
        for (let i = 0; i < density.glb; i++) {
            const angle = ((Math.PI * 2) / Math.max(density.glb, 1)) * i + 0.12;
            const r = 84;
            glbBuildings.push({
                id: `glb_building_${i}`,
                type: pattern[i % pattern.length],
                position: [Math.sin(angle) * r, 0, Math.cos(angle) * r],
                rotation: [0, angle + Math.PI, 0],
                scale: (1.8 + random() * 1.2) * 3,
                colRadius: 5.5,
            });
        }

        const fill = [];
        for (let i = 0; i < density.fill; i++) {
            const angle = ((Math.PI * 2) / density.fill) * i;
            const r = 82 + random() * 3;
            const w = 11 + random() * 5;
            const d = 9 + random() * 4;
            const h = 6 + random() * 7;
            fill.push({
                x: Math.sin(angle) * r,
                y: h / 2 - 1.5,
                z: Math.cos(angle) * r,
                w, h, d,
                rotY: angle,
                color: new THREE.Color(jsColors[Math.floor(random() * jsColors.length)]),
            });
        }

        const back = [];
        for (let i = 0; i < density.back; i++) {
            const angle = ((Math.PI * 2) / density.back) * i + 0.08;
            const r = 92 + random() * 5;
            const w = 14 + random() * 8;
            const d = 10 + random() * 6;
            const h = 5 + random() * 6;
            back.push({
                x: Math.sin(angle) * r,
                y: h / 2 - 2,
                z: Math.cos(angle) * r,
                w, h, d,
                rotY: angle,
                color: new THREE.Color(jsColors[Math.floor(random() * jsColors.length)]),
            });
        }

        return { glbBuildings, fill, back };
    }, [effectiveTier]);

    useEffect(() => {
        setWorldRadius(PLAY_RADIUS);
        skyData.glbBuildings.forEach((item) => {
            registerObstacle(item.id, item.position[0], item.position[2], item.colRadius);
        });
        return () => {
            setWorldRadius(null);
            skyData.glbBuildings.forEach((item) => removeObstacle(item.id));
        };
    }, [skyData, registerObstacle, removeObstacle, setWorldRadius]);

    const windowTex = useMemo(() => getWindowTexture(), []);
    const sharedMat = useMemo(() => {
        const tex = windowTex.clone();
        tex.repeat.set(3, 4);
        tex.needsUpdate = true;
        return new THREE.MeshStandardMaterial({
            map: tex,
            color: '#9a9a9a',
            roughness: 0.85,
            metalness: 0.15,
        });
    }, [windowTex]);

    const unitBox = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useEffect(() => {
        const applyInstances = (mesh, data) => {
            if (!mesh) return;
            data.forEach((b, i) => {
                dummy.position.set(b.x, b.y, b.z);
                dummy.rotation.set(0, b.rotY, 0);
                dummy.scale.set(b.w, b.h, b.d);
                dummy.updateMatrix();
                mesh.setMatrixAt(i, dummy.matrix);
                mesh.setColorAt(i, b.color);
            });
            mesh.instanceMatrix.needsUpdate = true;
            if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
            // Bounding ampla (anel ~raio 100) — evita cull errado do geo 1x1x1
            mesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 10, 0), 130);
        };
        const id = requestAnimationFrame(() => {
            applyInstances(fillMeshRef.current, skyData.fill);
            applyInstances(backMeshRef.current, skyData.back);
        });
        return () => cancelAnimationFrame(id);
    }, [skyData, dummy]);

    return (
        <group>
            {skyData.glbBuildings.map((item) => (
                <GLTFModel
                    key={item.id}
                    url={`/itens/${item.type}.glb`}
                    position={item.position}
                    rotation={item.rotation}
                    scale={item.scale}
                />
            ))}

            {/* 2 draw calls — frustumCulled com bounding ampla para não sumir de longe */}
            <instancedMesh
                ref={fillMeshRef}
                args={[unitBox, sharedMat, skyData.fill.length]}
                frustumCulled={false}
                castShadow={false}
                receiveShadow={false}
            />
            <instancedMesh
                ref={backMeshRef}
                args={[unitBox, sharedMat, skyData.back.length]}
                frustumCulled={false}
                castShadow={false}
                receiveShadow={false}
            />
        </group>
    );
}

// ---------------------------------------------------------
// SISTEMA DE TEXTURAS PROCEDURAIS (Estilo Anime/Pintura)

// Gera texturas em memória na hora do load, consumindo 0 bytes
// ---------------------------------------------------------
function createSplotchTexture(color1, color2, splotchesCount = 50, size = 512, repeatX = 10, repeatY = 10) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Fundo base
    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, size, size);

    // Pintar manchas suaves estilo aquarela/anime
    for (let i = 0; i < splotchesCount; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const radius = (Math.random() * 0.15 + 0.05) * size; // Raio entre 5% e 20% do canvas
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        // Utiliza a segunda cor com 80% de opacidade no centro para mesclar suavemente
        gradient.addColorStop(0, color2 + 'cc'); 
        gradient.addColorStop(1, color2 + '00'); // Fica transparente na borda
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    // Filtro mais limpo para estilo Anime
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    
    return texture;
}

export function ParkEnvironment() {
    const registerObstacle = useCollisionSystem((state) => state.registerObstacle);
    const removeObstacle = useCollisionSystem((state) => state.removeObstacle);
    const settings = useGraphicsSystem((state) => state.settings);
    const shadowMapSize = settings.shadowMapSize;
    const lightCastShadow = settings.shadows;
    const particles = settings.particles || 'normal';
    const showAmbientMagic = particles !== 'none';
    const ambientScale = particles === 'reduced' ? 0.45 : 1;
    const plazaSegments = settings.plazaSegments ?? 64;
    
    // Registra a fonte da praça central no Radar
    useEffect(() => {
        registerObstacle('main_fountain', 0, 0, 1.0); // Colisão menor ainda
        return () => removeObstacle('main_fountain');
    }, [registerObstacle, removeObstacle]);
    
    // Geometrias
    const cityBlockGeo = useMemo(() => new THREE.PlaneGeometry(150, 150), []);
    const avenueGeo = useMemo(() => new THREE.PlaneGeometry(110, 110), []);
    const parkGrassGeo = useMemo(() => new THREE.PlaneGeometry(100, 100), []);
    const plazaGeo = useMemo(() => new THREE.CircleGeometry(15, plazaSegments), [plazaSegments]);
    const streetGeo = useMemo(() => new THREE.PlaneGeometry(10, 35), []);

    // Texturas Dinâmicas (Estilo Anime)
    // 1. Grama: Anime/Ghibli gerado por IA
    const grassTexture = useTexture('/textures/anime_grass.jpg');
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(16, 16); 
    grassTexture.colorSpace = THREE.SRGBColorSpace;
    
    // 2. Concreto: Anime gerado por IA
    const concreteTexture = useTexture('/textures/anime_concrete.jpg');
    concreteTexture.wrapS = THREE.RepeatWrapping;
    concreteTexture.wrapT = THREE.RepeatWrapping;
    concreteTexture.repeat.set(8, 8); 
    concreteTexture.colorSpace = THREE.SRGBColorSpace;

    // 2.5. Pedra: Para a praça central
    const stoneTexture = useTexture('/textures/anime_pedra.jpg');
    stoneTexture.wrapS = THREE.RepeatWrapping;
    stoneTexture.wrapT = THREE.RepeatWrapping;
    stoneTexture.repeat.set(8, 8);
    stoneTexture.colorSpace = THREE.SRGBColorSpace;

    // 3. Asfalto: Anime gerado por IA
    const asphaltTexture = useTexture('/textures/anime_asphalt.jpg');
    asphaltTexture.wrapS = THREE.RepeatWrapping;
    asphaltTexture.wrapT = THREE.RepeatWrapping;
    asphaltTexture.repeat.set(12, 12); 
    asphaltTexture.colorSpace = THREE.SRGBColorSpace;
    
    // 4. Chão dos Prédios: Cinza básico
    const cityBaseTexture = useMemo(() => createSplotchTexture('#6b7280', '#4b5563', 50, 512, 20, 20), []);

    return (
        <>
            {/* Céu Anime (Azul vibrante e alegre) */}
            <color attach="background" args={['#60a5fa']} />
            
            <group>
                {/* Iluminação Anime: Sombras menos agressivas, cor de sol quente, luz ambiente azulada */}
                <ambientLight intensity={0.7} color="#e0f2fe" />
                
                {/* Sol Visual (Mais Brilhante) */}
                <mesh position={[40, 25, -80]}>
                    <sphereGeometry args={[5, 32, 32]} />
                    <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={5} toneMapped={false} />
                    <pointLight intensity={2} distance={150} color="#ffffff" />
                </mesh>

                <directionalLight 
                    castShadow={lightCastShadow}
                    position={[40, 25, -80]} 
                    intensity={0.8} 
                    color="#ffffff" /* Luz branca do sol */
                    shadow-mapSize={[shadowMapSize, shadowMapSize]}
                    shadow-camera-far={250}
                    shadow-camera-left={-75}
                    shadow-camera-right={75}
                    shadow-camera-top={75}
                    shadow-camera-bottom={-75}
                    shadow-bias={-0.0005} /* Ajuste refinado para evitar artifacts */
                    shadow-radius={2} /* Sombras levemente borradas */
                />

                {/* 1. Área dos Prédios Futuros (y = -0.06) */}
                <mesh receiveShadow geometry={cityBlockGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
                    <meshStandardMaterial map={cityBaseTexture} roughness={1.0} />
                </mesh>

                {/* 2. Anel Viário / Avenidas (y = -0.04) */}
                <mesh receiveShadow geometry={avenueGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
                    <meshStandardMaterial map={asphaltTexture} roughness={0.8} />
                </mesh>

                {/* 3. Parque / Grama (y = -0.02) */}
                <mesh receiveShadow geometry={parkGrassGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                    <meshStandardMaterial map={grassTexture} roughness={1.0} metalness={0.0} />
                </mesh>

                {/* 4. Praça Central de Pedra (y = 0.0) */}
                <mesh receiveShadow geometry={plazaGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 0]}>
                    <meshStandardMaterial map={stoneTexture} roughness={0.9} metalness={0.0} />
                </mesh>

                {/* 5. Ruas Principais em Cruz (N, S, L, O) (y = 0.0) */}
                {[0, 1, 2, 3].map((index) => {
                    const angle = (Math.PI / 2) * index;
                    const distance = 32.5; 
                    const x = Math.sin(angle) * distance;
                    const z = Math.cos(angle) * distance;
                    
                    return (
                        <mesh 
                            key={index}
                            receiveShadow 
                            geometry={streetGeo} 
                            position={[x, 0.0, z]}
                            rotation={[-Math.PI / 2, 0, -angle]}
                        >
                            <meshStandardMaterial map={concreteTexture} roughness={0.7} metalness={0.1} />
                        </mesh>
                    );
                })}

                {/* 6. Árvores Espalhadas pela Grama */}
                <ScatteredTrees />

                {/* 6.2 Arbustos (Sem colisão) */}
                <ScatteredBushes />

                {/* 6.3 Mobiliário do Parque (Bancos, Foodtruck, Postes) */}
                <ParkFurniture />

                {/* 6.5 Parquinho Infantil (Gramado Nordeste) */}
                <Playground />

                {/* 6.6 Máquina de Refri (Loja de Poções) no Gramado Noroeste */}
                <ShopMachine position={[-8, 1.5, -10]} rotation={[0, Math.PI / 4, 0]} scale={1.5} />

                {/* 7. Fonte de Água (Centro da Praça) */}
                <DarkFountain position={[0, 0.0, 0]} rotation={[0, 0, 0]} scale={2} />

                {/* 7.5 Atividades do mapa (baú/chave, fonte, poções) — local + online */}
                <MapActivities />
                
                {/* 8. Partículas mágicas (sem vapor/névoa na fonte) */}
                {showAmbientMagic && (
                    <>
                        <AmbientMagic count={Math.round(50 * ambientScale)} color="#38bdf8" radius={3.0} height={4.0} speed={0.5} size={0.5} position={[0, 0, 0]} />
                        <AmbientMagic count={Math.round(20 * ambientScale)} color="#a855f7" radius={6} height={6} speed={0.25} size={2.0} position={[18, 0, 18]} />
                        <AmbientMagic count={Math.round(20 * ambientScale)} color="#4ade80" radius={6} height={6} speed={0.25} size={2.0} position={[-20, 0, 15]} />
                        <AmbientMagic count={Math.round(20 * ambientScale)} color="#fbbf24" radius={6} height={6} speed={0.25} size={2.0} position={[15, 0, -20]} />
                    </>
                )}

                {/* 9. Paredão de Prédios e Borda (Skyline) */}
                <CitySkyline />
            </group>
        </>
    );
}
