import React, { useState } from 'react';
import type { VisualSettings } from '../types';
import { GoogleGenAI } from "@google/genai";

interface DesignStudioProps {
  initialSettings: VisualSettings;
  onSave: (settings: VisualSettings) => void;
  onBack: () => void;
}

// Pre-defined themes for the container background
const containerThemes = [
  { name: 'Perkamen Klasik', prompt: 'A clean, high-resolution texture of aged parchment paper. Light beige color with subtle, soft fibers visible. No text, stains, or tears. Minimalist and elegant. Flat lay view.' },
  { name: 'Meja Kayu Gelap', prompt: 'A top-down view of a clean, polished dark oak wood tabletop. Rich, dark brown color with visible, elegant wood grain patterns. No objects on the table. Studio lighting.' },
  { name: 'Peta Petualangan', prompt: 'A background texture of an old, rolled-out treasure map with faint illustrations of jungle leaves and compass roses in the corners. The center is mostly clear for content. Beige and green tones.' },
  { name: 'Konsol Futuristik', prompt: 'A clean, futuristic sci-fi interface background. Dark metal with subtle, glowing blue holographic grid lines. Minimalist and high-tech. Center area is darker and less detailed.' },
  { name: 'Papan Tulis Hijau', prompt: 'A clean, dark green chalkboard background texture. Evenly lit with faint, subtle chalk dust residue. No writing or drawings on it. Perfect for educational themes.' }
];

const LoadingSpinner: React.FC = () => (
    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center rounded-lg">
        <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

export const DesignStudio: React.FC<DesignStudioProps> = ({ initialSettings, onSave, onBack }) => {
  const [settings, setSettings] = useState<VisualSettings>(initialSettings);
  
  const [mainBgPrompt, setMainBgPrompt] = useState('Pemandangan hutan fantasi dengan pohon-pohon bercahaya');
  // Replaced free-form prompt with a selection from pre-defined themes
  const [selectedThemeName, setSelectedThemeName] = useState<string>('');
  
  const [mainBgResults, setMainBgResults] = useState<string[]>([]);
  const [containerBgResults, setContainerBgResults] = useState<string[]>([]);

  const [mainBgLoading, setMainBgLoading] = useState(false);
  const [containerBgLoading, setContainerBgLoading] = useState(false);

  // Check if the API key is configured
  const apiKey = import.meta.env.VITE_API_KEY;
  const isApiKeyConfigured = !!apiKey;


  const handleGenerateImages = async (type: 'main' | 'container') => {
    if (!isApiKeyConfigured) {
        alert("Kunci API belum diatur. Silakan atur di pengaturan hosting Anda.");
        return;
    }
      
    let prompt: string | undefined = '';
    
    if (type === 'main') {
        prompt = mainBgPrompt;
        setMainBgLoading(true);
    } else {
        const selectedTheme = containerThemes.find(theme => theme.name === selectedThemeName);
        prompt = selectedTheme?.prompt;
        setContainerBgLoading(true);
    }
    
    if (!prompt) {
      alert('Harap masukkan prompt atau pilih tema untuk membuat gambar.');
      if (type === 'main') setMainBgLoading(false);
      else setContainerBgLoading(false);
      return;
    }

    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
                numberOfImages: 4,
                outputMimeType: 'image/jpeg', // JPEG is smaller for backgrounds
                aspectRatio: '16:9'
            },
        });

        const imageBase64Strings = response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);

        if (type === 'main') {
            setMainBgResults(imageBase64Strings);
        } else {
            setContainerBgResults(imageBase64Strings);
        }

    } catch (error) {
        console.error(`Error generating ${type} background images:`, error);
        alert('Gagal membuat gambar. Pastikan API Key Anda benar dan coba lagi.');
    } finally {
        if (type === 'main') setMainBgLoading(false);
        else setContainerBgLoading(false);
    }
  };

  const handleSelectImage = (type: 'main' | 'container', imageUrl: string) => {
    setSettings(prev => ({
        ...prev,
        [type === 'main' ? 'mainBackground' : 'containerBackground']: imageUrl,
    }));
  };

  const handleClearImage = (type: 'main' | 'container') => {
    setSettings(prev => ({
        ...prev,
        [type === 'main' ? 'mainBackground' : 'containerBackground']: null,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-100">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-8">
        <div className="flex justify-between items-center border-b pb-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">Studio Desain AI</h1>
            <button onClick={onBack} className="text-slate-500 hover:text-slate-800">&larr; Kembali ke Menu</button>
        </div>

        {!isApiKeyConfigured && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-r-lg" role="alert">
                <p className="font-bold">Fitur AI Dinonaktifkan</p>
                <p className="text-sm">
                    Kunci API Gemini belum dikonfigurasi. Untuk mengaktifkan fitur ini, tambahkan variabel lingkungan 
                    <code className="bg-yellow-200 text-yellow-900 font-mono text-xs px-1 py-0.5 rounded mx-1">VITE_API_KEY</code> 
                    di pengaturan hosting Anda (misalnya di dashboard Vercel).
                </p>
            </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Main Background Section */}
            <div className="space-y-4 p-6 bg-slate-50 rounded-xl border">
                <h2 className="text-2xl font-semibold text-slate-700">Latar Belakang Utama</h2>
                <div className="relative w-full aspect-video bg-slate-200 rounded-lg overflow-hidden shadow-inner">
                    {settings.mainBackground && <img src={settings.mainBackground} alt="Pratinjau Latar Utama" className="w-full h-full object-cover" />}
                    {mainBgLoading && <LoadingSpinner />}
                    {!settings.mainBackground && <div className="flex items-center justify-center h-full text-slate-500">Pilih gambar di bawah</div>}
                </div>
                 {settings.mainBackground && <button onClick={() => handleClearImage('main')} className="w-full text-sm text-red-600 font-semibold border border-red-500 rounded-md py-1 hover:bg-red-50">Hapus Latar Utama</button>}
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Prompt untuk Latar Utama:</label>
                    <textarea value={mainBgPrompt} onChange={e => setMainBgPrompt(e.target.value)} placeholder="Contoh: Pemandangan gunung bersalju saat matahari terbenam" className="w-full p-2 border rounded-md" rows={2}></textarea>
                </div>
                <button 
                    onClick={() => handleGenerateImages('main')} 
                    disabled={!isApiKeyConfigured || mainBgLoading} 
                    className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    {mainBgLoading ? 'Membuat...' : 'Buat Gambar Latar Utama'}
                </button>
                {mainBgResults.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {mainBgResults.map((imgSrc, i) => (
                            <img key={i} src={imgSrc} onClick={() => handleSelectImage('main', imgSrc)} className="cursor-pointer aspect-video object-cover rounded-md border-2 border-transparent hover:border-blue-500" alt={`Opsi Latar Utama ${i+1}`} />
                        ))}
                    </div>
                )}
            </div>

            {/* Container Background Section */}
            <div className="space-y-4 p-6 bg-slate-50 rounded-xl border">
                <h2 className="text-2xl font-semibold text-slate-700">Latar Konten/Papan</h2>
                <div className="relative w-full aspect-video bg-slate-200 rounded-lg overflow-hidden shadow-inner">
                    {settings.containerBackground && <img src={settings.containerBackground} alt="Pratinjau Latar Konten" className="w-full h-full object-cover" />}
                    {containerBgLoading && <LoadingSpinner />}
                     {!settings.containerBackground && <div className="flex items-center justify-center h-full text-slate-500">Pilih gambar di bawah</div>}
                </div>
                {settings.containerBackground && <button onClick={() => handleClearImage('container')} className="w-full text-sm text-red-600 font-semibold border border-red-500 rounded-md py-1 hover:bg-red-50">Hapus Latar Konten</button>}
                <div>
                    <label htmlFor="theme-select" className="block text-sm font-medium text-slate-600 mb-1">Pilih Tema Latar Konten:</label>
                    <select
                        id="theme-select"
                        value={selectedThemeName}
                        onChange={e => setSelectedThemeName(e.target.value)}
                        className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="" disabled>-- Pilih sebuah tema --</option>
                        {containerThemes.map(theme => (
                            <option key={theme.name} value={theme.name}>
                                {theme.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button 
                    onClick={() => handleGenerateImages('container')} 
                    disabled={!isApiKeyConfigured || containerBgLoading || !selectedThemeName} 
                    className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    {containerBgLoading ? 'Membuat...' : 'Buat Gambar Latar Konten'}
                </button>
                 {containerBgResults.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {containerBgResults.map((imgSrc, i) => (
                            <img key={i} src={imgSrc} onClick={() => handleSelectImage('container', imgSrc)} className="cursor-pointer aspect-video object-cover rounded-md border-2 border-transparent hover:border-indigo-500" alt={`Opsi Latar Konten ${i+1}`} />
                        ))}
                    </div>
                )}
            </div>
        </div>

        <div className="pt-6 border-t">
          <button onClick={() => onSave(settings)} className="w-full bg-emerald-600 text-white font-bold text-xl py-3 rounded-lg hover:bg-emerald-700 transition-transform transform hover:scale-105 shadow-lg">
            Simpan Desain & Kembali
          </button>
        </div>
      </div>
    </div>
  );
};
