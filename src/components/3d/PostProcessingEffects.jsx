import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useAuraSystem } from '../../systems/useAuraSystem';

export function PostProcessingEffects() {
    // Referências para animar os efeitos frame a frame sem re-renderizar
    const vignetteRef = useRef();
    const chromaticRef = useRef();
    
    useFrame((state, delta) => {
        const comboCount = useAuraSystem.getState().comboCount;
        
        // Vinheta: Escurece as bordas a partir do combo 50
        let targetDarkness = 0.3; // Default
        if (comboCount >= 200) targetDarkness = 0.5;
        if (comboCount >= 400) targetDarkness = 0.65;
        if (comboCount >= 600) targetDarkness = 0.8;
        
        if (vignetteRef.current) {
            vignetteRef.current.darkness = THREE.MathUtils.lerp(
                vignetteRef.current.darkness, 
                targetDarkness, 
                delta * 2
            );
        }

        // Aberração Cromática: Distorce as cores nos cantos a partir do combo 400
        let targetOffsetX = 0;
        let targetOffsetY = 0;
        
        if (comboCount >= 400) {
            const intensity = comboCount >= 800 ? 0.008 : 0.003;
            // Efeito pulsante caótico
            const time = state.clock.elapsedTime;
            targetOffsetX = Math.sin(time * 10) * intensity;
            targetOffsetY = Math.cos(time * 8) * intensity;
        }
        
        if (chromaticRef.current && chromaticRef.current.offset) {
            const offset = chromaticRef.current.offset;
            const currentX = offset.x !== undefined ? offset.x : (offset[0] || 0);
            const currentY = offset.y !== undefined ? offset.y : (offset[1] || 0);
            
            const nextX = THREE.MathUtils.lerp(currentX, targetOffsetX, delta * 5);
            const nextY = THREE.MathUtils.lerp(currentY, targetOffsetY, delta * 5);
            
            if (typeof offset.set === 'function') {
                offset.set(nextX, nextY);
            } else {
                if (offset.x !== undefined) offset.x = nextX;
                if (offset.y !== undefined) offset.y = nextY;
                if (offset[0] !== undefined) offset[0] = nextX;
                if (offset[1] !== undefined) offset[1] = nextY;
            }
        }
    });

    return (
        <EffectComposer disableNormalPass multisampling={0}>
            {/* Bloom otimizado: Threshold alto (1.2) garante que apenas os textos HDR (com valores de cor absurdos) brilhem, mantendo o personagem natural. */}
            <Bloom 
                intensity={1.5} 
                luminanceThreshold={1.2} 
                luminanceSmoothing={0.1} 
            />
            
            {/* Vinheta foca a atenção no centro da tela */}
            <Vignette 
                ref={vignetteRef}
                eskil={false} 
                offset={0.1} 
                darkness={0.3} 
                blendFunction={BlendFunction.NORMAL} 
            />

            {/* Aberração Cromática traz a sensação de glitch/poder instável */}
            <ChromaticAberration 
                ref={chromaticRef}
                blendFunction={BlendFunction.NORMAL}
                radialModulation={true} 
                modulationOffset={0.5}
            />
        </EffectComposer>
    );
}
