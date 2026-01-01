import React from 'react';
import type { VisualSettings } from '../types';

interface HomeScreenProps {
  onStartSnakeLadder: () => void;
  onStartLevelUp: () => void;
  onStartDesign: () => void;
  visualSettings: VisualSettings;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartSnakeLadder, onStartLevelUp, onStartDesign, visualSettings }) => {
  
  const containerStyle: React.CSSProperties = visualSettings.containerBackground
    ? { 
        backgroundImage: `url(${visualSettings.containerBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {};

  const defaultClasses = "bg-stone-50/90 backdrop-blur-sm";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative">
      <div 
        className={`rounded-2xl shadow-2xl shadow-black/30 p-8 sm:p-12 max-w-5xl w-full border-2 border-stone-200/50 ${!visualSettings.containerBackground ? defaultClasses : ''}`}
        style={containerStyle}
      >
        <h1 className="text-5xl sm:text-7xl font-bold text-slate-800 mb-4 font-poppins drop-shadow-sm" style={{ color: visualSettings.containerBackground ? 'white' : '' }}>
          Tangga Ilmu
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 font-poppins drop-shadow-sm" style={{ color: visualSettings.containerBackground ? 'white' : '' }}>
          Pilih petualangan belajar Anda!
        </p>
        
        <div className="flex flex-col md:flex-row justify-center items-stretch gap-6">
            
            {/* --- Game 1: Ular Tangga --- */}
            <div className={`flex-1 p-6 rounded-xl border-2 transition-all hover:scale-105 ${visualSettings.containerBackground ? 'bg-black/30 border-white/20' : 'bg-white border-stone-200'}`}>
                <h2 className={`text-2xl font-bold mb-2 font-poppins ${visualSettings.containerBackground ? 'text-white' : 'text-slate-700'}`}>Ular Tangga Klasik</h2>
                <p className={`mb-4 text-sm ${visualSettings.containerBackground ? 'text-slate-300' : 'text-slate-500'}`}>
                    Permainan dadu klasik dengan Tali dan Tangga. Cocok untuk review materi santai.
                </p>
                <button
                    onClick={onStartSnakeLadder}
                    className="w-full bg-sky-600 text-white font-bold text-lg py-3 rounded-lg hover:bg-sky-700 shadow-lg"
                >
                    Main Ular Tangga
                </button>
            </div>

            {/* --- Game 2: Level Up (NEW) --- */}
            <div className={`flex-1 p-6 rounded-xl border-2 border-yellow-400/50 relative overflow-hidden transition-all hover:scale-105 ${visualSettings.containerBackground ? 'bg-black/30' : 'bg-white'}`}>
                <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg">BARU!</div>
                <h2 className={`text-2xl font-bold mb-2 font-poppins ${visualSettings.containerBackground ? 'text-white' : 'text-slate-700'}`}>Level Up Adventure</h2>
                <p className={`mb-4 text-sm ${visualSettings.containerBackground ? 'text-slate-300' : 'text-slate-500'}`}>
                    Taklukkan 9 Level bertingkat. Tantangan makin sulit hingga mencapai puncak!
                </p>
                <button
                    onClick={onStartLevelUp}
                    className="w-full bg-orange-600 text-white font-bold text-lg py-3 rounded-lg hover:bg-orange-700 shadow-lg"
                >
                    Main Level Up
                </button>
            </div>
             
             {/* --- Design Studio --- */}
            <div className={`flex-1 p-6 rounded-xl border-2 transition-all hover:scale-105 ${visualSettings.containerBackground ? 'bg-black/30 border-white/20' : 'bg-white border-stone-200'}`}>
                <h2 className={`text-2xl font-bold mb-2 font-poppins ${visualSettings.containerBackground ? 'text-white' : 'text-slate-700'}`}>Studio Desain</h2>
                <p className={`mb-4 text-sm ${visualSettings.containerBackground ? 'text-slate-300' : 'text-slate-500'}`}>
                    Kustomisasi tampilan papan dan latar belakang permainan agar lebih menarik.
                </p>
                <button
                    onClick={onStartDesign}
                    className="w-full bg-emerald-600 text-white font-bold text-lg py-3 rounded-lg hover:bg-emerald-700 shadow-lg"
                >
                    Atur Desain
                </button>
            </div>

        </div>
      </div>
       <footer className={`absolute bottom-4 font-caveat text-2xl tracking-wider drop-shadow-md ${visualSettings.containerBackground ? 'text-white/90' : 'text-slate-600'}`}>
            Created By Besa Metiar Lasna Desy
        </footer>
    </div>
  );
};