import React, { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { WaterFountain } from './WaterFountain';
import { useGLTF, useTexture } from '@react-three/drei';
import { useCollisionSystem } from '../../systems/useCollisionSystem';

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
useGLTF.preload('/itens/fonte2.glb');
useGLTF.preload('/itens/maquinaderefri.glb');

// Componente utilitário para renderizar instâncias de GLTF
function GLTFModel({ url, position, rotation, scale = 1 }) {
    const { scene } = useGLTF(url);
    const copiedScene = useMemo(() => scene.clone(), [scene]);
    
    // Habilita sombras em todos os meshes do modelo
    useMemo(() => {
        copiedScene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }, [copiedScene]);
    
    return <primitive object={copiedScene} position={position} rotation={rotation} scale={scale} />;
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
        return generated;
    }, []);

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
    const bushes = useMemo(() => {
        const generated = [];
        const types = ['arbusto1', 'arbusto2', 'arbusto3'];
        const random = mulberry32(54321); // Seed fixa diferente das árvores
        
        for (let i = 0; i < 30; i++) { // aumentamos a quantidade de arbustos
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
        return generated;
    }, []);
    
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

        // 3. Postes de Luz (10 postes ao redor da praça / vias)
        const totalPoles = 10;
        for (let i = 0; i < totalPoles; i++) {
            const angle = (Math.PI * 2 / totalPoles) * i;
            const r = 24; // Um pouco mais afastados que a praça central
            const x = Math.sin(angle) * r;
            const z = Math.cos(angle) * r;
            
            items.push({
                id: `pole_${i}`,
                type: 'poste_luz',
                position: [x, 0, z],
                rotation: [0, angle + Math.PI, 0], // Luz virada pro centro
                scale: 0.45, // Reduzido (estavam gigantes)
                colRadius: 0.5 // Poste é fino
            });
        }

        // 4. Máquinas de Refrigerante (3 pelo parque)
        const machineSpots = [
            { x: -35, z: 0, rot: Math.PI / 2 },      // esquerda entrada
            { x: 35, z: 0, rot: -Math.PI / 2 },      // direita entrada
            { x: 0, z: -35, rot: Math.PI },          // fundo
            { x: 0, z: 35, rot: 0 }                  // frente
        ];

        machineSpots.forEach((spot, i) => {
            items.push({
                id: `vending_machine_${i}`,
                type: 'maquinaderefri',
                position: [spot.x, 1.5, spot.z], // Subido em Y para não ficar enterrada
                rotation: [0, spot.rot, 0],
                scale: 1.5,
                colRadius: 1.0 
            });
        });

        return items;
    }, []);

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

// Prédios ao redor do Parque (City Skyline)
function CitySkyline() {
    const registerObstacle = useCollisionSystem((state) => state.registerObstacle);
    const removeObstacle = useCollisionSystem((state) => state.removeObstacle);

    const { glbBuildings, bgBuildings } = useMemo(() => {
        const glb = [];
        const bg = [];
        const random = mulberry32(88888); // Seed fixa
        const types = ['predio1', 'predio2', 'predio3'];
        
        // 1. Prédios Reais 3D (GLB) - Depois da avenida
        const totalGLB = 24; 
        for (let i = 0; i < totalGLB; i++) {
            const angle = (Math.PI * 2 / totalGLB) * i;
            
            // Pula as ruas principais
            const isStreet = (angle % (Math.PI / 2)) < 0.25 || (angle % (Math.PI / 2)) > (Math.PI / 2 - 0.25);
            if (isStreet) continue;

            // O gramado é 100x100 (50m do centro pras bordas). 
            // 75 metros de raio garante que farão um círculo em volta de todo o parque, fora da grama.
            const r = 75; 
            const x = Math.sin(angle) * r;
            const z = Math.cos(angle) * r;
            
            glb.push({
                id: `glb_building_${i}`,
                type: types[Math.floor(random() * types.length)],
                position: [x, 0, z],
                rotation: [0, angle + Math.PI, 0], // Virado pro centro
                scale: 3.5 + random() * 2.5, // Bem grandes e altos
                colRadius: 8.0 
            });
        }

        // 2. Prédios de Fundo (Caixas Geométricas) - Para dar densidade
        const totalBG = 60;
        for (let i = 0; i < totalBG; i++) {
            const angle = (Math.PI * 2 / totalBG) * i;
            // Espalha entre 95m e 115m de distância (BEM atrás)
            const r = 95 + random() * 20; 
            const x = Math.sin(angle) * r;
            const z = Math.cos(angle) * r;
            
            const width = 12 + random() * 15;
            const depth = 12 + random() * 15;
            const height = 30 + random() * 80; // Muito altos

            bg.push({
                id: `bg_building_${i}`,
                position: [x, height / 2, z], // Y = metade da altura para ficar no chão
                rotation: [0, random() * Math.PI, 0],
                size: [width, height, depth],
                color: random() > 0.5 ? '#151522' : '#1a1a2e' // Tons de cidade escura
            });
        }

        return { glbBuildings: glb, bgBuildings: bg };
    }, []);

    useEffect(() => {
        glbBuildings.forEach(item => {
            registerObstacle(item.id, item.position[0], item.position[2], item.colRadius);
        });
        return () => {
            glbBuildings.forEach(item => removeObstacle(item.id));
        };
    }, [glbBuildings, registerObstacle, removeObstacle]);

    return (
        <group>
            {/* Prédios Detalhados (3D) */}
            {glbBuildings.map(item => (
                <GLTFModel 
                    key={item.id} 
                    url={`/itens/${item.type}.glb`} 
                    position={item.position} 
                    rotation={item.rotation} 
                    scale={item.scale} 
                />
            ))}
            
            {/* Prédios de Fundo Geométricos (Silhuetas) */}
            {bgBuildings.map(item => (
                <mesh key={item.id} position={item.position} rotation={item.rotation}>
                    <boxGeometry args={item.size} />
                    <meshStandardMaterial color={item.color} roughness={0.9} metalness={0.1} />
                </mesh>
            ))}
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

    // Registra a fonte da praça central no Radar
    useEffect(() => {
        registerObstacle('main_fountain', 0, 0, 1.0); // Colisão menor ainda
        return () => removeObstacle('main_fountain');
    }, [registerObstacle, removeObstacle]);
    
    // Geometrias
    const cityBlockGeo = useMemo(() => new THREE.PlaneGeometry(150, 150), []);
    const avenueGeo = useMemo(() => new THREE.PlaneGeometry(110, 110), []);
    const parkGrassGeo = useMemo(() => new THREE.PlaneGeometry(100, 100), []);
    const plazaGeo = useMemo(() => new THREE.CircleGeometry(15, 64), []);
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
                <directionalLight 
                    castShadow 
                    position={[20, 100, 20]} 
                    intensity={0.6} 
                    color="#fffbeb" /* Sol quente amarelado bem fraco */
                    shadow-mapSize={[2048, 2048]}
                    shadow-camera-far={200}
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

                {/* 4. Praça Central de Concreto Polido (y = 0.0) */}
                <mesh receiveShadow geometry={plazaGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 0]}>
                    <meshStandardMaterial map={concreteTexture} roughness={0.7} metalness={0.1} />
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

                {/* 7. Fonte de Água (Centro da Praça) */}
                <GLTFModel url="/itens/fonte2.glb" position={[0, 0.0, 0]} rotation={[0, 0, 0]} scale={0.325} />
            </group>
        </>
    );
}
