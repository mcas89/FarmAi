import React, { useEffect, Suspense, Component } from 'react';
import { Scene } from './components/3d/Scene';
import { GameInterface } from './components/ui/GameInterface';
import { useDatabaseSystem } from './systems/useDatabaseSystem';
import { usePlayerSystem } from './systems/usePlayerSystem';
import { useAuraSystem } from './systems/useAuraSystem';
import { useUISystem } from './systems/useUISystem';
import { useQuestSystem } from './systems/useQuestSystem';
import { useAchievementSystem } from './systems/useAchievementSystem';
import { useMapActivitiesSystem } from './systems/useMapActivitiesSystem';
import { pickInventory } from './utils/localGameCache';
import { ReloadPrompt } from './components/ui/ReloadPrompt';
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
import { auth } from './config/firebase';
import { usePaymentReturn } from './systems/usePaymentReturn';
import { useGraphicsSystem } from './systems/useGraphicsSystem';

function App() {
  const currentScreen = useUISystem(state => state.currentScreen);
  usePaymentReturn(); // Detecta retorno de pagamento InfinitePay

  useEffect(() => {
    // Qualidade gráfica: aplica detecção / preset salvo (localStorage)
    useGraphicsSystem.getState().detectAndApply();
  }, []);

  useEffect(() => {
    // 1. Escuta o estado de autenticação do Firebase para Persistência (Auto-Login)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Sempre via loadPlayerData (virada de semana + claimWeek)
          const data = await useDatabaseSystem.getState().loadPlayerData();
          if (data) {
            const realName = data.name ? data.name.split(' ')[0] : 'Jogador';

            // Hidrata aura ANTES de qualquer updateStats (diamonds)
            useAuraSystem.setState({
              aura: data.aura || 0,
              weeklyAura: data.weeklyAura || 0,
              comboCount: data.comboCount || 0,
              maxCombo: data.maxCombo || 0,
            });

            useUISystem.getState().setInventory(pickInventory(data.inventory || []));

            useMapActivitiesSystem.getState().hydrate(data.mapActivities || null);

            useUISystem.getState().updateStats({
              nickname: realName,
              diamonds: data.auracash || 0,
            });

            const DEFAULT_MODEL = 'carol.vrm';
            const DEFAULT_UNLOCKED = ['carol.vrm', 'rafa.vrm'];
            const unlocked = (Array.isArray(data.unlockedCharacters) && data.unlockedCharacters.length > 0)
              ? data.unlockedCharacters
              : DEFAULT_UNLOCKED;
            usePlayerSystem.getState().setUnlockedCharacters(unlocked);
            usePlayerSystem.setState({
              activeModel: data.activeModel || DEFAULT_MODEL,
            });

            import('./systems/useQuestSystem').then(m => {
              m.useQuestSystem.getState().initializeQuests(data.dailyQuests, data.lastResetDate);
            });
            useAchievementSystem.getState().initializeAchievements(data.achievements);

            const loadedAura = data.aura || 0;
            const loadedCombo = data.maxCombo || 0;
            if (loadedAura > 0) useAchievementSystem.getState().updateProgress('aura', loadedAura);
            if (loadedCombo > 0) useAchievementSystem.getState().updateProgress('combo', loadedCombo);

            // Libera saves completos só depois da hidratação
            useDatabaseSystem.getState().markDataLoaded();

            import('./systems/useFriendsSystem').then((m) => {
              m.ensureSocialProfileFields().catch(() => {});
            });

            if (data.claimWeek) {
              import('./systems/useRankingSystem').then(m => {
                m.useRankingSystem.getState().checkAndClaimWeeklyRewards(
                  user.uid,
                  data.claimWeek,
                  data.auracash || 0
                );
              });
            }

            useUISystem.getState().setScreen('SPLASH');
          }
        } catch (error) {
          console.error('Erro ao puxar dados persistentes:', error);
        }
      } else {
        useDatabaseSystem.getState().clearDataLoaded();
        useUISystem.getState().setScreen('LOGIN');
      }
    });

    // 2. Função de salvamento estratégico
    const executeGameSave = () => {
      if (!useDatabaseSystem.getState().isDataLoaded) {
        console.warn('[AutoSave] Ignorado: hidratação pendente.');
        return;
      }
      const position = usePlayerSystem.getState().position;
      const activeModel = usePlayerSystem.getState().activeModel;
      const comboCount = useAuraSystem.getState().comboCount;
      const maxCombo = useAuraSystem.getState().maxCombo;
      const aura = useAuraSystem.getState().aura;
      const weeklyAura = useAuraSystem.getState().weeklyAura;
      const diamonds = useUISystem.getState().playerStats.diamonds;

      const dailyQuests = useQuestSystem.getState().dailyQuests;
      const lastResetDate = useQuestSystem.getState().lastResetDate;
      const achievements = useAchievementSystem.getState().getSavableData();
      const unlockedCharacters = usePlayerSystem.getState().unlockedCharacters;
      const inventory = useUISystem.getState().inventory;

      useDatabaseSystem.getState().saveGameState(
        position,
        comboCount,
        activeModel,
        aura,
        diamonds,
        maxCombo,
        dailyQuests,
        lastResetDate,
        weeklyAura,
        undefined,
        achievements,
        unlockedCharacters,
        inventory
      );
    };

    // 3. Salvar ao fechar/sair do jogo (desktop)
    const handleBeforeUnload = () => {
      executeGameSave();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 3b. Salvar quando o app vai para background (mobile PWA / trocar de aba)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const screen = useUISystem.getState().currentScreen;
        if (screen && screen !== 'LOGIN' && screen !== 'SPLASH') {
          console.log('[AutoSave] App foi para background, salvando...');
          executeGameSave();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Efeito de clique global
    const handleGlobalClick = (e) => {
      const target = e.target;
      const isClickable =
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('.icon-btn') ||
        target.closest('.action-button') ||
        window.getComputedStyle(target).cursor === 'pointer';

      if (isClickable) {
        import('./systems/useAudioSystem').then(m => {
          m.useAudioSystem.getState().playSFX('click');
        });
      }
    };
    window.addEventListener('click', handleGlobalClick);

    // PWA Install Prompt Listener
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      import('./systems/usePWASystem').then(m => m.usePWASystem.getState().setPrompt(e));
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.executeGameSave = executeGameSave;

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      delete window.executeGameSave;
      unsubscribe();
    };
  }, []);

  // 4. Salvar quando o jogador abrir telas estratégicas
  useEffect(() => {
    if (
      window.executeGameSave &&
      useDatabaseSystem.getState().isDataLoaded &&
      ['STORE', 'RANKING', 'ACHIEVEMENTS', 'CHARACTERS'].includes(currentScreen)
    ) {
      window.executeGameSave();
    }
  }, [currentScreen]);

  // 5. Gerenciamento da Música de Fundo (BGM)
  useEffect(() => {
    import('./systems/useAudioSystem').then(m => {
        const audioSys = m.useAudioSystem.getState();
        if (currentScreen === 'LOGIN' || currentScreen === 'SPLASH') {
            audioSys.playBGM('intro');
        } else if (currentScreen === 'GAME') {
            audioSys.playBGM('game');
        } else {
            // Demais telas como MENU, STORE, RANKING, etc
            audioSys.playBGM('home');
        }
    });
  }, [currentScreen]);

  return (
    <ErrorBoundary>
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#15151e' }}>
        <GameInterface />
        
        {/* O Canvas agora só monta na hora do jogo para economizar GPU/Memória */}
        {(currentScreen === 'PREPARING_WORLD' || currentScreen === 'GAME') && (
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        )}
        
        <ReloadPrompt />
      </div>
    </ErrorBoundary>
  );
}

export default App;
