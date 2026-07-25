import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import { useFarmSystem } from '../../systems/useFarmSystem';
import { AnimationEngine } from '../../systems/animation/AnimationEngine';
import { useMovementSystem } from '../../systems/useMovementSystem';
import { usePlayerSystem } from '../../systems/usePlayerSystem';
import { useAuraSystem } from '../../systems/useAuraSystem';
import { useCollisionSystem } from '../../systems/useCollisionSystem';

export function Avatar({ url }) {
  const [vrm, setVrm] = useState(null);
  const keys = useRef({ isLeftDebug: false, isRightDebug: false, shift: false });
  const blinkStateRef = useRef({ timer: 4.0, state: 0 });
  const levitationWeightRef = useRef(0);
  const comboCount = useAuraSystem(state => state.comboCount);
  const [ascension, setAscension] = useState(0);
  
  const { camera } = useThree();
  const { joystick, isMoving } = useMovementSystem();
  const { setPosition } = usePlayerSystem();

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'f') { keys.current.isLeftDebug = true; keys.current.isRightDebug = true; }
      if (key === 'q') keys.current.isLeftDebug = true;
      if (key === 'e') keys.current.isRightDebug = true;
      if (key === 'i') { keys.current.isLeftDebug = false; keys.current.isRightDebug = false; }
      if (key === 'shift') keys.current.shift = true;
    };

    const handleKeyUp = (e) => {
        const key = e.key.toLowerCase();
        if (key === 'q') keys.current.isLeftDebug = false;
        if (key === 'e') keys.current.isRightDebug = false;
        if (key === 'f') { keys.current.isLeftDebug = false; keys.current.isRightDebug = false; }
        if (key === 'shift') keys.current.shift = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  useEffect(() => {
    let isMounted = true;
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    
    loader.load(url, (gltf) => {
      if (!isMounted) {
          // Se desmontou antes de carregar, limpa imediatamente
          gltf.scene.traverse((child) => {
              if (child.isMesh) {
                  child.geometry?.dispose();
                  if (child.material) {
                      const mats = Array.isArray(child.material) ? child.material : [child.material];
                      mats.forEach(m => {
                          m.map?.dispose();
                          m.dispose();
                      });
                  }
              }
          });
          return;
      }
      
      const vrmData = gltf.userData.vrm;
      
      // Habilitar sombras no personagem
      gltf.scene.traverse((child) => {
          if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
          }
      });
      
      // Personagem livre para rotacionar
      vrmData.scene.rotation.y = Math.PI; 
      
      // Aplicar o ponto de Spawn Aleatório inicial
      const spawnPos = usePlayerSystem.getState().position;
      vrmData.scene.position.set(spawnPos[0], spawnPos[1], spawnPos[2]);
      
      AnimationEngine.setBasePose('arms_down_pose');
      
      setVrm(vrmData);
    });

    return () => {
      isMounted = false;
      setVrm((currentVrm) => {
          if (currentVrm) {
              currentVrm.scene.traverse((child) => {
                  if (child.isMesh) {
                      child.geometry?.dispose();
                      if (child.material) {
                          const mats = Array.isArray(child.material) ? child.material : [child.material];
                          mats.forEach(m => {
                              m.map?.dispose();
                              m.dispose();
                          });
                      }
                  }
              });
          }
          return null;
      });
    };
  }, [url]);

  const { isLeftFarming, isRightFarming } = useFarmSystem();

  useFrame((state, delta) => {
    if (!vrm) return;
    vrm.update(delta); // Física e Blendshapes
    
    const leftFarmActive = isLeftFarming || keys.current.isLeftDebug;
    const rightFarmActive = isRightFarming || keys.current.isRightDebug;
    
    // Personagem só está ocioso se não se move, não farma e não segura teclas extras
    const isIdle = !isMoving && !leftFarmActive && !rightFarmActive && !keys.current.shift;
    const isRunning = isMoving && keys.current.shift;

    AnimationEngine.update(vrm, delta, leftFarmActive, rightFarmActive, isMoving, isIdle, isRunning);
    // SISTEMA COMPLEMENTAR: PISCAR OLHOS (BLINK)
    // =====================================
    // Arquitetura preservada: O Engine de ossos não é tocado.
    if (vrm.expressionManager) {
        const blinkData = blinkStateRef.current;
        
        if (blinkData.state === 0) {
            blinkData.timer -= delta;
            if (blinkData.timer <= 0) {
                blinkData.state = 1; 
                // Sorteia a próxima piscada para daqui a 2 a 8 segundos
                blinkData.timer = 2.0 + Math.random() * 6.0; 
            }
        } else if (blinkData.state === 1) {
            // Fechando rápido
            const currentBlink = vrm.expressionManager.getValue('blink') || 0;
            const newBlink = Math.min(1.0, currentBlink + delta * 18.0);
            vrm.expressionManager.setValue('blink', newBlink);
            if (newBlink >= 1.0) blinkData.state = 2; 
        } else if (blinkData.state === 2) {
            // Abrindo natural
            const currentBlink = vrm.expressionManager.getValue('blink') || 1;
            const newBlink = Math.max(0.0, currentBlink - delta * 12.0);
            vrm.expressionManager.setValue('blink', newBlink);
            if (newBlink <= 0.0) blinkData.state = 0; 
        }
    }

    // =====================================
    // ATUALIZAÇÃO DE ESTADO PARA A CÂMERA
    // =====================================
    const isLevitating = comboCount >= 700;
    
    const newState = isLevitating ? 'levitating' : isMoving ? (isRunning ? 'run' : 'walk') : 'idle';
    if (usePlayerSystem.getState().currentState !== newState) {
        usePlayerSystem.setState({ currentState: newState });
    }

    // =====================================
    // SISTEMA DE MOVIMENTAÇÃO (JOYSTICK)
    // =====================================
    if (isMoving) {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        forward.y = 0;
        forward.normalize();
        
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        right.y = 0;
        right.normalize();
        
        const moveDir = new THREE.Vector3();
        moveDir.addScaledVector(forward, -joystick.y);
        moveDir.addScaledVector(right, joystick.x);
        moveDir.normalize();
        
        const speed = isRunning ? 6.5 : 2.5; 
        
        const nextPosition = vrm.scene.position.clone().addScaledVector(moveDir, speed * delta);
        
        // =====================================
        // FÍSICA DE COLISÃO DINÂMICA (Radar)
        // =====================================
        const obstacles = useCollisionSystem.getState().obstacles;
        
        for (const ob of obstacles) {
            const dx = nextPosition.x - ob.x;
            const dz = nextPosition.z - ob.z;
            const dist = Math.hypot(dx, dz);
            
            if (dist < ob.radius) {
                // Se tentar entrar no raio, empurra de volta para a borda (cria efeito de deslizar ao redor)
                const angleFromCenter = Math.atan2(dx, dz);
                nextPosition.x = ob.x + Math.sin(angleFromCenter) * ob.radius;
                nextPosition.z = ob.z + Math.cos(angleFromCenter) * ob.radius;
            }
        }
        
        vrm.scene.position.copy(nextPosition);
        
        const targetAngle = Math.atan2(moveDir.x, moveDir.z);
        const targetQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);
        vrm.scene.quaternion.slerp(targetQuat, 0.15); 
    }

    // =====================================
    // SISTEMA COMPLEMENTAR: LEVITAÇÃO (COMBO 700+)
    // =====================================
    // Transição suave (lerp) de 0 a 1 (aprox. 1 a 2 segundos dependendo do delta)
    const targetWeight = isLevitating ? 1.0 : 0.0;
    levitationWeightRef.current = THREE.MathUtils.lerp(levitationWeightRef.current, targetWeight, delta * 3.0);
    const levWeight = levitationWeightRef.current;

    // Reseta forçadamente os ossos que o AnimationEngine original não gerencia, 
    // para garantir que eles não fiquem "presos" na última rotação quando a levitação acabar.
    ['leftFoot', 'rightFoot', 'spine'].forEach(boneName => {
        const bone = vrm.humanoid.getNormalizedBoneNode(boneName);
        if (bone) bone.rotation.set(0, 0, 0);
    });

    if (levWeight > 0.01) {
        // Aplicação da Pose Exata de Levitação (Lerp para o target)
        const applyLevitation = (boneName, targetRot, mobilityFactor = 1.0) => {
            const bone = vrm.humanoid.getNormalizedBoneNode(boneName);
            if (bone) {
                // Quando o personagem caminha, reduzimos o peso nos ossos das pernas
                // para não "engessar" a animação de caminhada, mas manter um pouco da postura.
                const finalWeight = isMoving ? levWeight * mobilityFactor : levWeight;
                
                if (targetRot.x !== undefined) bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, targetRot.x, finalWeight);
                if (targetRot.y !== undefined) bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, targetRot.y, finalWeight);
                if (targetRot.z !== undefined) bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, targetRot.z, finalWeight);
            }
        };

        // Postura exata repassada
        applyLevitation('leftUpperLeg', { x: 0.38, y: 0.13, z: 0 }, 0.2);
        applyLevitation('rightUpperLeg', { x: 0.36, y: 0, z: 0 }, 0.2);
        applyLevitation('leftFoot', { x: 0.81, y: 0, z: 0 }, 0.4);
        applyLevitation('rightFoot', { x: 0.98, y: 0, z: 0 }, 0.4);
        applyLevitation('spine', { x: -0.21, y: 0, z: 0 }, 1.0); 

        // Flutuação Orgânica (Onda Senoidal no Eixo Y global)
        // Flutuando bem mais alto (28cm)
        const floatY = (0.28 + Math.sin(state.clock.elapsedTime * 2.5) * 0.06) * levWeight;
        vrm.scene.position.y = floatY;
    } else {
        // Garante que o personagem fique exatamente no chão
        vrm.scene.position.y = 0;
    }

    // Atualiza posição global para câmera e auras
    setPosition([vrm.scene.position.x, vrm.scene.position.y, vrm.scene.position.z]);
  });

  return vrm ? <primitive object={vrm.scene} /> : null;
}
