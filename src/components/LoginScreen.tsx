import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-200 p-4">
      <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-2xl max-w-md w-full text-center border-2 border-stone-100">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 font-poppins mb-2">SmartPlay</h1>
        <p className="text-slate-500 mb-8">Platform Game Edukasi & Manajemen Kelas</p>
        
        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-700 font-semibold py-3 px-4 rounded-lg hover:bg-slate-50 transition-all shadow-sm"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Masuk dengan Google
        </button>
        <p className="mt-6 text-xs text-slate-400">
            Khusus untuk Guru. Kelola kelas dan siswa Anda dengan mudah.
        </p>
      </div>
    </div>
  );
};