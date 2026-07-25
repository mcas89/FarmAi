import React from 'react';
import { useUISystem } from '../../systems/useUISystem';

// Import Screens
import { SplashScreen } from './screens/SplashScreen';
import { MainMenu } from './screens/MainMenu';
import { ProfileScreen } from './screens/ProfileScreen';
import { CharacterScreen } from './screens/CharacterScreen';
import { RankingScreen } from './screens/RankingScreen';
import { AchievementsScreen } from './screens/AchievementsScreen';
import { GameHUD } from './screens/GameHUD';

export function GameInterface() {
    const currentScreen = useUISystem(state => state.currentScreen);

    // Renderiza a tela baseada no estado do Zustand
    const renderScreen = () => {
        switch (currentScreen) {
            case 'SPLASH':
                return <SplashScreen />;
            case 'MENU':
                return <MainMenu />;
            case 'PROFILE':
                return <ProfileScreen />;
            case 'CHARACTERS':
                return <CharacterScreen />;
            case 'RANKING':
                return <RankingScreen />;
            case 'ACHIEVEMENTS':
                return <AchievementsScreen />;
            case 'GAME':
                return <GameHUD />;
            default:
                return <MainMenu />;
        }
    };

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            pointerEvents: 'none', zIndex: 10
        }}>
            {renderScreen()}
        </div>
    );
}
