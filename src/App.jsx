import React, { useEffect } from 'react';
import { Scene } from './components/3d/Scene';
import { GameInterface } from './components/ui/GameInterface';
import { useDatabaseSystem } from './systems/useDatabaseSystem';
import { usePlayerSystem } from './systems/usePlayerSystem';
import { useAuraSystem } from './systems/useAuraSystem';
import './index.css';

function App() {
  useEffect(() => {
    // 1. Carrega os dados quando o app abre
    const loadGame = async () => {
      const data = await useDatabaseSystem.getState().loadPlayerData();
      if (data) {
        // Restaura a posição, combo e personagem da nuvem!
        if (data.position) usePlayerSystem.setState({ position: [data.position.x, data.position.y, data.position.z] });
        if (data.comboCount) useAuraSystem.setState({ comboCount: data.comboCount });
        if (data.activeModel) usePlayerSystem.setState({ activeModel: data.activeModel });
      }
    };
    loadGame();

    // 2. Auto-Save a cada 15 segundos
    const saveInterval = setInterval(() => {
      const position = usePlayerSystem.getState().position;
      const activeModel = usePlayerSystem.getState().activeModel;
      const comboCount = useAuraSystem.getState().comboCount;
      
      useDatabaseSystem.getState().saveGameState(position, comboCount, activeModel);
    }, 15000);

    return () => clearInterval(saveInterval);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#15151e' }}>
      <GameInterface />
      <Scene />
    </div>
  );
}

export default App;
