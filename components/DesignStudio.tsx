
import React, { useState } from 'react';
import type { VisualSettings } from '../types';

interface DesignStudioProps {
  initialSettings: VisualSettings;
  onSave: (settings: VisualSettings) => void;
  onBack: () => void;
}

const themes = [
  {
    name: 'Hutan Fantasi',
    preview: '/assets/bg1.jpg',
    settings: { mainBackground: '/assets/bg1.jpg', containerBackground: '/assets/container1.jpg' }
  },
  {
    name: 'Kayu Klasik',
    preview: '/assets/bg2.jpg',
    settings: { mainBackground: '/assets/bg2.jpg', containerBackground: '/assets/container2.jpg' }
  },
  {
    name: 'Peta Petualangan',
    preview: '/assets/bg3.jpg',
    settings: { mainBackground: '/assets/bg3.jpg', containerBackground: '/assets/container3.jpg' }
  },
  {
    name: 'Jelajah Angkasa',
    preview: '/assets/bg4.jpg',
    settings: { mainBackground: '/assets/bg4.jpg', containerBackground: '/assets/container4.jpg' }
  },
  {
    name: 'Dunia Bawah Laut',
    preview: '/assets/bg5.jpg',
    settings: { mainBackground: '/assets/bg5.jpg', containerBackground: '/assets/container5.jpg' }
  },
  {
    name: 'Default (Tanpa Tema)',
    preview: null,
    settings: { mainBackground: null, containerBackground: null }
  },
];

export const DesignStudio: React.FC<DesignStudioProps> = ({ initialSettings, onSave, onBack }) => {
  const [settings, setSettings] = useState<VisualSettings>(initialSettings);

  const handleSelectTheme = (themeSettings: VisualSettings) => {
    setSettings(themeSettings);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-100">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-8">
        <div className="flex justify-between items-center border-b pb-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">Studio Desain</h1>
          <button onClick={onBack} className="text-sm font-semibold flex items-center gap-1 text-sky-600 hover:text-sky-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Kembali ke Menu
          </button>
        </div>
        <div className="text-center">
            <h2 className="text-2xl font-semibold text-slate-700">Pilih Tema Visual Permainan</h2>
            <p className="text-slate-500 mt-1">Pilih tampilan papan dan latar belakang permainan Anda.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {themes.map((theme) => (
                <div 
                    key={theme.name} 
                    onClick={() => handleSelectTheme(theme.settings)}
                    className={`rounded-lg p-3 border-4 cursor-pointer transition-all duration-200 ${settings.mainBackground === theme.settings.mainBackground ? 'border-emerald-500 scale-105 shadow-lg' : 'border-transparent hover:border-emerald-300'}`}
                >
                    <div className="aspect-video bg-slate-200 rounded-md overflow-hidden shadow-inner mb-2">
                        {theme.preview ? (
                            <img src={theme.preview} alt={theme.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                                Tampilan Default
                            </div>
                        )}
                    </div>
                    <h3 className="font-semibold text-center text-slate-700">{theme.name}</h3>
                </div>
            ))}
        </div>
        <div className="pt-6 border-t mt-4">
          <button onClick={() => onSave(settings)} className="w-full bg-emerald-600 text-white font-bold text-xl py-3 rounded-lg hover:bg-emerald-700 transition-transform transform hover:scale-105 shadow-lg">
            Simpan Desain & Kembali
          </button>
        </div>
      </div>
    </div>
  );
};
