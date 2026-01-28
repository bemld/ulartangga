import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User as UserIcon, LogIn, UserPlus, AlertCircle } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithEmail, registerWithEmail } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
        if (isRegistering) {
            if (!name.trim()) throw new Error("Nama wajib diisi.");
            if (password.length < 6) throw new Error("Password minimal 6 karakter.");
            await registerWithEmail(name, email, password);
        } else {
            await loginWithEmail(email, password);
        }
    } catch (err: any) {
        console.error(err);
        let msg = "Terjadi kesalahan. Silakan coba lagi.";
        
        // Menerjemahkan Error Code Firebase ke Bahasa Indonesia
        if (err.code === 'auth/invalid-email') msg = "Format email tidak valid.";
        if (err.code === 'auth/user-not-found') msg = "Akun tidak ditemukan. Silakan daftar.";
        if (err.code === 'auth/wrong-password') msg = "Password salah.";
        if (err.code === 'auth/invalid-credential') msg = "Email atau password salah.";
        if (err.code === 'auth/email-already-in-use') msg = "Email sudah terdaftar. Silakan login.";
        if (err.code === 'auth/weak-password') msg = "Password terlalu lemah (min. 6 karakter).";
        if (err.message) msg = err.message; // Fallback ke pesan manual di atas

        setError(msg);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-200 p-4 font-poppins">
      <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-2xl max-w-md w-full border-2 border-stone-100 relative overflow-hidden">
        
        {/* Header Logo */}
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 transform rotate-3 shadow-sm">
                <span className="text-3xl font-bold font-caveat text-orange-600">S</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800">SmartPlay</h1>
            <p className="text-slate-500 text-sm mt-1">Platform Game Edukasi & Manajemen Kelas</p>
        </div>

        {/* Error Message */}
        {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-start gap-2 animate-pulse">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
            </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name Input (Register Only) */}
            {isRegistering && (
                <div className="relative group">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                    <input 
                        type="text" 
                        placeholder="Nama Lengkap Guru"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        required
                    />
                </div>
            )}

            {/* Email Input */}
            <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                <input 
                    type="email" 
                    placeholder="Email Sekolah / Pribadi"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    required
                />
            </div>

            {/* Password Input */}
            <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                <input 
                    type="password" 
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    required
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-all transform hover:scale-[1.02] shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : isRegistering ? (
                    <>
                        <UserPlus size={20} /> Daftar Akun Baru
                    </>
                ) : (
                    <>
                        <LogIn size={20} /> Masuk
                    </>
                )}
            </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center pt-4 border-t border-slate-100">
            <p className="text-slate-500 text-sm">
                {isRegistering ? "Sudah punya akun?" : "Belum punya akun?"}
                <button 
                    onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                    className="ml-2 font-bold text-orange-600 hover:text-orange-700 hover:underline transition-colors focus:outline-none"
                >
                    {isRegistering ? "Login disini" : "Daftar sekarang"}
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};