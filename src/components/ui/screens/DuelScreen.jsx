import React, { useEffect, useRef, useState } from 'react';
import { useDuelSystem } from '../../../systems/useDuelSystem';
import { useAuraSystem } from '../../../systems/useAuraSystem';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Text } from '@react-three/drei';
import { OrbitControls } from '@react-three/drei';
import { Trophy, Timer, X } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';

// Componente leve exclusivo para a arena (sem depender dos sistemas do jogo local)
function SimpleAvatar({ modelFile, animation }) {
    const [vrm, setVrm] = useState(null);

    useEffect(() => {
        if (!modelFile) return;
        let isMounted = true;
        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));
        
        loader.load(`/models/${modelFile}`, (gltf) => {
            if (!isMounted) return;
            const loadedVrm = gltf.userData.vrm;
            
            // Corrige shaders pra ficar no padrão "Anime" flat
            loadedVrm.scene.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => { m.needsUpdate = true; });
                    } else {
                        child.material.needsUpdate = true;
                    }
                    child.frustumCulled = false;
                }
            });
            
            // Posiciona os braços para baixo se for idle
            if (loadedVrm.humanoid) {
                loadedVrm.humanoid.getNormalizedBoneNode('leftUpperArm').rotation.z = Math.PI / 3;
                loadedVrm.humanoid.getNormalizedBoneNode('rightUpperArm').rotation.z = -Math.PI / 3;
            }
            
            setVrm(loadedVrm);
        });

        return () => { isMounted = false; };
    }, [modelFile]);

    useFrame((state, delta) => {
        if (vrm) {
            vrm.update(delta);
            // Animação super simples de respiração/pulo dependendo do status
            if (animation === 'dance') {
                vrm.scene.position.y = Math.sin(state.clock.elapsedTime * 15) * 0.1;
                if (vrm.humanoid) {
                    vrm.humanoid.getNormalizedBoneNode('spine').rotation.y = Math.sin(state.clock.elapsedTime * 20) * 0.1;
                }
            } else {
                vrm.scene.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.02;
            }
        }
    });

    return vrm ? <primitive object={vrm.scene} /> : null;
}

export function DuelScreen() {
    const { activeDuelRoom, duelState, leaveDuel, sendDuelHit } = useDuelSystem();
    const { addAura } = useAuraSystem(); // Usamos o hook nativo para capturar cliques!
    const [p1Progress, setP1Progress] = useState(50); // 50% = empate no meio
    const [clickCount, setClickCount] = useState(0);

    // Quando o jogador clica em qualquer lugar da tela
    const handleScreenClick = () => {
        if (duelState?.status !== 'playing') return;
        
        const newCount = clickCount + 1;
        setClickCount(newCount);
        
        // Dispara hit no servidor
        sendDuelHit(newCount);
        
        // Simula farm nativo para dar recompensa base também (opcional)
        // addAura(); 
    };

    // Atualiza a barra de progresso suavemente (Cabo de Guerra)
    useEffect(() => {
        if (!duelState || !duelState.player1 || !duelState.player2) return;
        
        const s1 = duelState.player1.score;
        const s2 = duelState.player2.score;
        const total = s1 + s2;
        
        if (total === 0) {
            setP1Progress(50);
        } else {
            // Regra do cabo de guerra: não é porcentagem do total, mas sim diferença limitante.
            // Exemplo: se P1 tem 10 a mais que P2, a barra move 5% pra direita.
            // Aqui fazemos uma porcentagem simples baseada numa diferença máxima (ex: 200 cliques).
            const diff = s1 - s2;
            const maxDiff = 200; 
            
            // pct varia de -50 a +50
            let pct = (diff / maxDiff) * 50; 
            if (pct > 50) pct = 50;
            if (pct < -50) pct = -50;
            
            setP1Progress(50 + pct);
        }
    }, [duelState]);

    if (!duelState || !duelState.player1 || !duelState.player2) return <div style={{background: '#000', width: '100%', height: '100%', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>Carregando Arena...</div>;

    const myId = activeDuelRoom?.sessionId;
    const isP1 = myId === duelState.player1.id;
    
    // Determina quem fica na Esquerda e quem fica na Direita
    const LeftPlayer = isP1 ? duelState.player1 : duelState.player2;
    const RightPlayer = isP1 ? duelState.player2 : duelState.player1;

    // Se o jogo acabou, mostramos o overlay de vitória e o botão de voltar
    const isGameOver = duelState.status === 'finished';

    return (
        <div 
            onClick={handleScreenClick}
            style={{ 
                position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', 
                background: 'radial-gradient(circle at center, #1e1b4b, #000)', 
                overflow: 'hidden', userSelect: 'none',
                cursor: duelState.status === 'playing' ? 'crosshair' : 'default'
            }}
        >
            {/* 3D Scene - Câmera Fixa Side-View */}
            <Canvas camera={{ position: [0, 1.2, 5], fov: 45 }} style={{ position: 'absolute', zIndex: 1 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[0, 5, 5]} intensity={1} color="#a855f7" />
                <directionalLight position={[0, -5, -5]} intensity={0.5} color="#ec4899" />
                <Environment preset="night" />

                {/* Chão Grid Neon Simple */}
                <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[20, 20]} />
                    <meshBasicMaterial color="#000" wireframe />
                </mesh>
                <gridHelper args={[20, 20, '#a855f7', '#a855f7']} />

                {/* Left Player (P1 ou Você) */}
                {LeftPlayer?.model && (
                    <group position={[-1.5, 0, 0]} rotation={[0, Math.PI/2, 0]}>
                        <SimpleAvatar modelFile={LeftPlayer.model} animation={duelState.status === 'playing' ? 'dance' : 'idle'} />
                    </group>
                )}

                {/* Right Player (Oponente) */}
                {RightPlayer?.model && (
                    <group position={[1.5, 0, 0]} rotation={[0, -Math.PI/2, 0]}>
                        <SimpleAvatar modelFile={RightPlayer.model} animation={duelState.status === 'playing' ? 'dance' : 'idle'} />
                    </group>
                )}
            </Canvas>

            {/* HUD 2D SOBREPOSTA */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }}>
                
                {/* Cabeçalho de Duelo */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ color: '#fff', fontWeight: '900', fontSize: '2rem', textShadow: '0 0 10px #ef4444' }}>
                        {duelState.timeLeft}s
                    </div>
                    
                    {/* BARRA DE DOMÍNIO (CABO DE GUERRA) */}
                    <div style={{ 
                        width: '80%', height: '20px', background: '#000', border: '2px solid #333', 
                        borderRadius: '10px', marginTop: '10px', position: 'relative', overflow: 'hidden',
                        display: 'flex'
                    }}>
                        {/* Lado Azul (Você) */}
                        <div style={{ 
                            width: `${p1Progress}%`, height: '100%', 
                            background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                            transition: 'width 0.1s linear' 
                        }} />
                        
                        {/* Lado Vermelho (Adversário) */}
                        <div style={{ 
                            width: `${100 - p1Progress}%`, height: '100%', 
                            background: 'linear-gradient(90deg, #f87171, #ef4444)',
                            transition: 'width 0.1s linear'
                        }} />
                        
                        {/* Marcador Central */}
                        <div style={{ position: 'absolute', top: 0, left: '50%', width: '4px', height: '100%', background: '#fff', transform: 'translateX(-50%)' }} />
                    </div>

                    {/* Nomes dos Jogadores */}
                    <div style={{ width: '80%', display: 'flex', justifyContent: 'space-between', marginTop: '5px', color: '#fff', fontWeight: 'bold' }}>
                        <span style={{ color: '#60a5fa' }}>VOCÊ ({LeftPlayer?.score})</span>
                        <span style={{ color: '#f87171' }}>{RightPlayer?.name} ({RightPlayer?.score})</span>
                    </div>
                </div>

                {/* Overlays de Status */}
                {duelState.status === 'waiting' && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        Aguardando Oponente...
                    </div>
                )}
                
                {duelState.status === 'countdown' && (
                    <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', color: '#ef4444', fontSize: '5rem', fontWeight: '900', textShadow: '0 0 20px #000' }}>
                        {duelState.timeLeft}
                    </div>
                )}

                {/* Fim de Jogo */}
                {isGameOver && (
                    <div style={{ 
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
                        background: 'rgba(0,0,0,0.9)', border: '2px solid #ef4444', borderRadius: '16px',
                        padding: '30px', textAlign: 'center', pointerEvents: 'auto', width: '300px'
                    }}>
                        <Trophy size={48} color={duelState.winnerId === myId ? "#fbbf24" : "#6b7280"} style={{ margin: '0 auto 10px' }} />
                        <h1 style={{ color: '#fff', margin: 0 }}>
                            {duelState.winnerId === "draw" ? "EMPATE!" : (duelState.winnerId === myId ? "VITÓRIA!" : "DERROTA")}
                        </h1>
                        <p style={{ color: '#aaa' }}>
                            {duelState.winnerId === myId ? `Você ganhou ${duelState.betAmount * 2} AuraCash!` : `Você perdeu ${duelState.betAmount} AuraCash.`}
                        </p>
                        <button onClick={leaveDuel} style={{ 
                            background: '#ef4444', color: '#fff', border: 'none', padding: '12px 24px', 
                            borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px', width: '100%' 
                        }}>
                            SAIR DA ARENA
                        </button>
                    </div>
                )}
            </div>
            
            {/* INSTRUÇÃO DE JOGO (Desaparece quando começa) */}
            {duelState.status === 'countdown' && (
                <div style={{ position: 'absolute', bottom: '20%', left: '0', width: '100%', textAlign: 'center', color: '#fff', fontSize: '1.2rem', animation: 'pulse 1s infinite' }}>
                    PREPARE-SE PARA CLICAR!
                </div>
            )}
        </div>
    );
}
