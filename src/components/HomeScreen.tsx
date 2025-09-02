import React from 'react';
import type { VisualSettings } from '../types';

interface HomeScreenProps {
  onStartSetup: () => void;
  onStartDesign: () => void;
  visualSettings: VisualSettings;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartSetup, onStartDesign }) => {
  
  const defaultClasses = "bg-stone-50/90 backdrop-blur-sm";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <main 
        className={`rounded-2xl shadow-2xl shadow-black/30 p-8 sm:p-12 max-w-4xl w-full border-2 border-stone-200/50 ${defaultClasses}`}
      >
        <h1 className="text-5xl sm:text-7xl font-bold text-slate-800 mb-4 font-poppins drop-shadow-sm">
          Tangga Ilmu
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 font-poppins drop-shadow-sm">
          Ubah pelajaran di kelas menjadi petualangan seru! Buat papan permainan Ular Tangga edukatif yang disesuaikan dengan mata pelajaran, materi, dan tingkat kelas Anda.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
            
            {/* --- Step 1 --- */}
            <div className="flex flex-col items-center">
                <span className="font-caveat text-xl mb-1 text-slate-500">Langkah 1</span>
                <button
                    onClick={onStartDesign}
                    className="bg-emerald-600 text-white font-bold text-xl sm:text-2xl py-4 px-10 rounded-full hover:bg-emerald-700 transition-all transform hover:scale-110 shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-300"
                >
                    Studio Desain
                </button>
            </div>

            {/* --- Arrow --- */}
            <div className="sm:mt-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 transform sm:rotate-0 rotate-90 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
            </div>

            {/* --- Step 2 --- */}
            <div className="flex flex-col items-center">
                <span className="font-caveat text-xl mb-1 text-slate-500">Langkah 2</span>
                <button
                    onClick={onStartSetup}
                    className="bg-sky-600 text-white font-bold text-xl sm:text-2xl py-4 px-10 rounded-full hover:bg-sky-700 transition-all transform hover:scale-110 shadow-xl focus:outline-none focus:ring-4 focus:ring-sky-300"
                >
                    Siapkan Permainan Baru
                </button>
            </div>

        </div>
      </main>
       <footer className="w-full text-center mt-8">
            <p className="text-slate-600 font-caveat text-xl tracking-wider drop-shadow-md">
                Created By Besa MLD
            </p>
            <p className="text-slate-500 font-caveat text-base tracking-wider drop-shadow-md">
                Didukung AI untuk pembelajaran yang menyenangkan.
            </p>
        </footer>
    </div>
  );
};