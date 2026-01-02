import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Settings, Palette, User } from 'lucide-react';

interface TopBarProps {
  onOpenClassManager: () => void;
  onOpenDesign: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenClassManager, onOpenDesign }) => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="w-full h-16 bg-white/90 backdrop-blur-md border-b border-stone-200 flex items-center justify-between px-4 sm:px-6 fixed top-0 left-0 z-50 shadow-sm">
      <div className="flex items-center gap-2">
         <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold font-caveat text-xl">S</div>
         <span className="font-bold text-slate-800 font-poppins text-lg hidden sm:block">SmartPlay</span>
      </div>

      <div className="relative">
        <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 hover:bg-slate-100 p-1.5 rounded-full transition-colors pr-3"
        >
             <span className="text-sm font-medium text-slate-700 hidden sm:block">{user?.displayName}</span>
             {user?.photoURL ? (
                 <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-slate-300" />
             ) : (
                 <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500"><User size={16} /></div>
             )}
        </button>

        {isDropdownOpen && (
            <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden py-1">
                    <div className="px-4 py-3 border-b border-slate-100 sm:hidden">
                        <p className="text-sm font-bold text-slate-800">{user?.displayName}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <button 
                        onClick={() => { onOpenClassManager(); setIsDropdownOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 transition-colors"
                    >
                        <Settings size={16} />
                        Manajemen Kelas
                    </button>
                    <button 
                        onClick={() => { onOpenDesign(); setIsDropdownOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center gap-2 transition-colors"
                    >
                        <Palette size={16} />
                        Studio Desain
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button 
                        onClick={logout}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                        <LogOut size={16} />
                        Keluar
                    </button>
                </div>
            </>
        )}
      </div>
    </div>
  );
};