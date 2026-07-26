import React, { useEffect, Suspense, Component } from 'react';
import { Scene } from './components/3d/Scene';
import { GameInterface } from './components/ui/GameInterface';
import { useDatabaseSystem } from './systems/useDatabaseSystem';
import { usePlayerSystem } from './systems/usePlayerSystem';
import { useAuraSystem } from './systems/useAuraSystem';
import { useUISystem } from './systems/useUISystem';
import { useQuestSystem } from './systems/useQuestSystem';
import { useAchievementSystem } from './systems/useAchievementSystem';
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

import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './config/firebase';

function App() {
  const currentScreen = useUISystem(state => state.currentScreen);

  useEffect(() => {
    // 1. Escuta o estado de autenticação do Firebase para Persistência (Auto-Login)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Usuário já estava logado (F5 na página)
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            
            // Restaura nome e auracash
            const realName = data.name ? data.name.split(' ')[0] : 'Jogador';
            useUISystem.getState().updateStats({ nickname: realName, diamonds: data.auracash || 0 });
            
            // Restaura aura, weeklyAura e combo
            useAuraSystem.setState({ 
              aura: data.aura || 0, 
              weeklyAura: data.weeklyAura || 0,
              comboCount: data.comboCount || 0, 
              maxCombo: data.maxCombo || 0 
            });
            
            // Restaura posição e personagem 3D
            if (data.position) usePlayerSystem.setState({ position: [data.position.x, data.position.y, data.position.z] });
            if (data.activeModel) usePlayerSystem.setState({ activeModel: data.activeModel });
            if (data.unlockedCharacters) usePlayerSystem.setState({ unlockedCharacters: data.unlockedCharacters });
            
            // Inicializa Missões Diárias e Conquistas
            import('./systems/useQuestSystem').then(m => {
                m.useQuestSystem.getState().initializeQuests(data.dailyQuests, data.lastResetDate);
            });
            useAchievementSystem.getState().initializeAchievements(data.achievements);

            // BUG #4 FIX: força sync retroativo das conquistas com os valores já salvos
            // (garante que conquistas merecidas antes desta sessão sejam reconhecidas)
            const loadedAura    = data.aura     || 0;
            const loadedCombo   = data.maxCombo || 0;
            if (loadedAura  > 0) useAchievementSystem.getState().updateProgress('aura',  loadedAura);
            if (loadedCombo > 0) useAchievementSystem.getState().updateProgress('combo', loadedCombo);


            // Lógica de Premiação do Ranking Semanal
            import('./systems/useRankingSystem').then(m => {
                m.useRankingSystem.getState().checkAndClaimWeeklyRewards(user.uid, data.lastWeeklyReset, data.auracash || 0);
            });
            
            // Pula o login e vai direto pro menu via Splash
            useUISystem.getState().setScreen('SPLASH');
          }
        } catch (error) {
          console.error("Erro ao puxar dados persistentes:", error);
        }
      } else {
        // Se não tiver logado, garante que a tela fique no LOGIN
        useUISystem.getState().setScreen('LOGIN');
      }
    });

    // 2. Auto-Save a cada 15 segundos
    const saveInterval = setInterval(() => {
      const position = usePlayerSystem.getState().position;
      const activeModel = usePlayerSystem.getState().activeModel;
      const comboCount = useAuraSystem.getState().comboCount;
      const maxCombo = useAuraSystem.getState().maxCombo;
      const aura = useAuraSystem.getState().aura;
      const weeklyAura = useAuraSystem.getState().weeklyAura;
      const diamonds = useUISystem.getState().playerStats.diamonds;
      
      // Missões, Conquistas e Personagens
      const dailyQuests = useQuestSystem.getState().dailyQuests;
      const lastResetDate = useQuestSystem.getState().lastResetDate;
      const achievements = useAchievementSystem.getState().getSavableData();
      const unlockedCharacters = usePlayerSystem.getState().unlockedCharacters;
      
      useDatabaseSystem.getState().saveGameState(position, comboCount, activeModel, aura, diamonds, maxCombo, dailyQuests, lastResetDate, weeklyAura, undefined, achievements, unlockedCharacters);
    }, 15000);

    return () => {
      clearInterval(saveInterval);
      unsubscribe();
    };
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
