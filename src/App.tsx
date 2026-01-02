import React, { useState, useCallback, useEffect } from 'react';
import { VisualSettings } from './types';
import { HomeScreen } from './components/HomeScreen';
import { DesignStudio } from './components/DesignStudio';
import { SnakeLadderGame } from './components/SnakeLadderGame';
import { LevelUpGame } from './components/LevelUpGame';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { ClassManager } from './components/ClassManager';
import { TopBar } from './components/TopBar';

const VISUAL_SETTINGS_KEY = 'tanggaIlmuVisualSettings';

const initialVisualSettings: VisualSettings = {
  mainBackground: null,
  containerBackground: null,
};

type AppView = 'home' | 'design' | 'game-snake-ladder' | 'game-level-up';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [visualSettings, setVisualSettings] = useState<VisualSettings>(initialVisualSettings);
  const [showClassManager, setShowClassManager] = useState(false);

  // Load and apply visual settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(VISUAL_SETTINGS_KEY);
      if (savedSettings) {
        setVisualSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error("Failed to load visual settings from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (visualSettings.mainBackground) {
      document.body.style.backgroundImage = `url(${visualSettings.mainBackground})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundColor = '';
      document.body.classList.add('bg-stone-200');
    }
  }, [visualSettings.mainBackground]);
  
  const handleSaveSettings = useCallback((newSettings: VisualSettings) => {
    setVisualSettings(newSettings);
    try {
      localStorage.setItem(VISUAL_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Failed to save visual settings to localStorage", error);
    }
    setCurrentView('home');
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Memuat data...</div>;
  if (!user) return <LoginScreen />;

  return (
    <>
        <TopBar 
            onOpenClassManager={() => setShowClassManager(true)} 
            onOpenDesign={() => setCurrentView('design')}
        />
        
        {/* Spacer for TopBar */}
        <div className="pt-16">
            {currentView === 'home' && (
                <HomeScreen 
                    onStartSnakeLadder={() => setCurrentView('game-snake-ladder')}
                    onStartLevelUp={() => setCurrentView('game-level-up')}
                    onStartDesign={() => setCurrentView('design')} 
                    visualSettings={visualSettings} 
                />
            )}
            
            {currentView === 'design' && (
                <DesignStudio 
                    initialSettings={visualSettings} 
                    onSave={handleSaveSettings} 
                    onBack={() => setCurrentView('home')} 
                />
            )}

            {currentView === 'game-snake-ladder' && (
                <SnakeLadderGame 
                    visualSettings={visualSettings}
                    onBackToMenu={() => setCurrentView('home')}
                />
            )}

            {currentView === 'game-level-up' && (
                <LevelUpGame 
                    visualSettings={visualSettings}
                    onBackToMenu={() => setCurrentView('home')}
                />
            )}
        </div>

        {showClassManager && <ClassManager onClose={() => setShowClassManager(false)} />}
    </>
  );
};

export const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};