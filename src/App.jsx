import React, { useEffect, Suspense, Component } from 'react';
import { Scene } from './components/3d/Scene';
import { GameInterface } from './components/ui/GameInterface';
import { useDatabaseSystem } from './systems/useDatabaseSystem';
import { usePlayerSystem } from './systems/usePlayerSystem';
import { useAuraSystem } from './systems/useAuraSystem';
import { useUISystem } from './systems/useUISystem';
import './index.css';

// Error Boundary para capturar erros fatais (ex: 404 em modelos) e mostrar na tela
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorInfo: error.message };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Erro fatal capturado:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'white', background: 'red', height: '100vh' }}>
          <h2>Ocorreu um erro fatal no carregamento:</h2>
          <pre>{this.state.errorInfo}</pre>
          <p>Tente limpar o cache do navegador ou atualizar a página.</p>
        </div>
      );
    }
    return this.props.children; 
  }
}

function App() {
  const currentScreen = useUISystem(state => state.currentScreen);

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
    <ErrorBoundary>
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#15151e' }}>
        <GameInterface />
        
        {/* Renderiza o mapa 3D apenas APÓS o login (no Splash em diante) */}
        {currentScreen !== 'LOGIN' && (
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
