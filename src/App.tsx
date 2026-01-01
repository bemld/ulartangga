import React, { useState, useCallback, useEffect } from 'react';
import { VisualSettings } from './types';
import { HomeScreen } from './components/HomeScreen';
import { DesignStudio } from './components/DesignStudio';
import { SnakeLadderGame } from './components/SnakeLadderGame';

const VISUAL_SETTINGS_KEY = 'tanggaIlmuVisualSettings';

const initialVisualSettings: VisualSettings = {
  mainBackground: null,
  containerBackground: null,
};

// Define the top-level views available in the app
type AppView = 'home' | 'design' | 'game-snake-ladder';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [visualSettings, setVisualSettings] = useState<VisualSettings>(initialVisualSettings);

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
      document.body.style.backgroundColor = ''; // Revert to CSS default
      document.body.classList.add('bg-stone-200'); // Ensure fallback
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

  const navigateToHome = useCallback(() => {
    setCurrentView('home');
  }, []);

  const navigateToDesign = useCallback(() => {
    setCurrentView('design');
  }, []);

  const startSnakeLadderGame = useCallback(() => {
    setCurrentView('game-snake-ladder');
  }, []);


  // --- Render Views ---

  if (currentView === 'home') {
    return (
      <HomeScreen 
        onStartSetup={startSnakeLadderGame} // Currently points to Snake Ladder
        onStartDesign={navigateToDesign} 
        visualSettings={visualSettings} 
      />
    );
  }
  
  if (currentView === 'design') {
    return (
      <DesignStudio 
        initialSettings={visualSettings} 
        onSave={handleSaveSettings} 
        onBack={navigateToHome} 
      />
    );
  }

  if (currentView === 'game-snake-ladder') {
    return (
      <SnakeLadderGame 
        visualSettings={visualSettings}
        onBackToMenu={navigateToHome}
      />
    );
  }

  return null;
};