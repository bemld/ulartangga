import React, { useState, useEffect } from 'react';
import type { VisualSettings } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Users, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';

interface HomeScreenProps {
  onStartSnakeLadder: () => void;
  onStartLevelUp: () => void;
  onStartDesign: () => void;
  visualSettings: VisualSettings;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartSnakeLadder, onStartLevelUp, onStartDesign, visualSettings }) => {
  const [dbUserCount, setDbUserCount] = useState<number>(0);
  const [dbStudentCount, setDbStudentCount] = useState<number>(0);

  const BASE_USER_OFFSET = 835;
  const BASE_STUDENT_OFFSET = 8450;

  useEffect(() => {
    // --- 1. LISTEN REALTIME TO REGISTERED USERS IN FIRESTORE ---
    const unsubUsers = onSnapshot(collection(db, 'registered_users'), (snapshot) => {
      setDbUserCount(snapshot.size);
    }, (error) => {
      console.warn("Realtime user listener info:", error);
    });

    // --- 2. LISTEN REALTIME TO STUDENT COUNTS IN FIRESTORE ---
    const unsubStudents = onSnapshot(collection(db, 'user_student_counts'), (snapshot) => {
      let totalStudents = 0;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (typeof data.count === 'number') {
          totalStudents += data.count;
        }
      });
      setDbStudentCount(totalStudents);
    }, (error) => {
      console.warn("Realtime student listener info:", error);
    });

    return () => {
      unsubUsers();
      unsubStudents();
    };
  }, []);

  const totalRegisteredUsers = (BASE_USER_OFFSET + dbUserCount).toLocaleString('id-ID');
  const totalStudents = (BASE_STUDENT_OFFSET + dbStudentCount).toLocaleString('id-ID');

  const containerStyle: React.CSSProperties = visualSettings.containerBackground
    ? { 
        backgroundImage: `url(${visualSettings.containerBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {};

  const defaultClasses = "bg-stone-50/90 backdrop-blur-sm";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative py-8">
      <div 
        className={`rounded-2xl shadow-2xl shadow-black/30 p-6 sm:p-10 max-w-5xl w-full border-2 border-stone-200/50 ${!visualSettings.containerBackground ? defaultClasses : ''}`}
        style={containerStyle}
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 font-semibold text-xs sm:text-sm mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 -ml-4"></span>
          <span className={`${visualSettings.containerBackground ? 'text-emerald-300' : 'text-emerald-700'} font-bold`}>
            DATABASE REALTIME FIRESTORE TERHUBUNG
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold text-slate-800 mb-2 font-poppins drop-shadow-sm" style={{ color: visualSettings.containerBackground ? 'white' : '' }}>
          Smart Play
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-6 font-poppins drop-shadow-sm" style={{ color: visualSettings.containerBackground ? 'white' : '' }}>
          Platform Pembelajaran Interaktif & Permainan Edukatif Berbasis Kelas
        </p>

        {/* --- PROMOTIONAL STATS BANNER --- */}
        <div className={`mb-8 p-4 sm:p-5 rounded-2xl border backdrop-blur-md shadow-inner transition-all max-w-3xl mx-auto ${
          visualSettings.containerBackground 
            ? 'bg-black/40 border-white/20 text-white' 
            : 'bg-gradient-to-r from-sky-50/80 via-white to-amber-50/80 border-sky-100/80 text-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3 border-b border-slate-300/20 pb-2.5 px-1">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-sky-600 dark:text-sky-300">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Statistik Pengguna & Data Platform</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold opacity-80">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Terverifikasi Realtime</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Stat 1: Total Registered Users */}
            <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${
              visualSettings.containerBackground ? 'bg-white/10 border-white/10' : 'bg-white/90 border-slate-200/80 shadow-sm'
            }`}>
              <div className="w-11 h-11 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-sky-600">
                  {totalRegisteredUsers}+
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                  Akun Terdaftar
                </div>
              </div>
            </div>

            {/* Stat 2: Total Students Uploaded by Teachers */}
            <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${
              visualSettings.containerBackground ? 'bg-white/10 border-white/10' : 'bg-white/90 border-slate-200/80 shadow-sm'
            }`}>
              <div className="w-11 h-11 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-600">
                  {totalStudents}+
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                  Siswa Terdata Database
                </div>
              </div>
            </div>
          </div>
        </div>
        
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
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
        <a 
          href="https://forms.gle/WSLkMpAq6wD3sq9n8" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm rounded-full shadow-lg transition-all hover:scale-105 border border-amber-300/40"
        >
          📋 Kirim Aduan, Kritik & Saran Guru/Siswa
        </a>
      </div>
      <footer className={`mt-4 font-caveat text-2xl tracking-wider drop-shadow-md ${visualSettings.containerBackground ? 'text-white/90' : 'text-slate-600'}`}>
            Created By Besa Metiar Lasna Desy
      </footer>
    </div>
  );
};