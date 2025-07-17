import React, { useState } from 'react';
import type { Player, SnakeOrLadder, BoardActivities, ActivityType, VisualSettings } from '../types';
import { BOARD_SIZE, PLAYER_COLORS } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";

interface SetupScreenProps {
  onStartGame: (
    players: Player[],
    activities: BoardActivities,
    snakes: SnakeOrLadder[],
    ladders: SnakeOrLadder[],
    activityType: ActivityType
  ) => void;
  visualSettings: VisualSettings;
  onBack: () => void;
}

/**
 * Processes a given image URL to remove a solid color background.
 * It assumes the pixel at (0,0) is the background color and makes all similar pixels transparent.
 * @param imageUrl The data URL of the image to process.
 * @returns A promise that resolves with the data URL of the processed image with a transparent background.
 */
const removeImageBackground = (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Tidak bisa mendapatkan konteks canvas'));
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Ambil warna piksel di pojok kiri atas sebagai warna latar.
      const bgR = data[0];
      const bgG = data[1];
      const bgB = data[2];

      const tolerance = 30; // Toleransi untuk variasi warna (anti-aliasing, dll.)

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Hitung perbedaan warna dari warna latar belakang.
        const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
        
        // Jika warna piksel sangat mirip dengan warna latar, buat transparan.
        if (diff < tolerance) {
          data[i + 3] = 0; // Atur alpha menjadi 0 (transparan)
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (err) => {
      console.error("Gagal memuat gambar:", err);
      reject(new Error('Gagal memuat gambar untuk diproses.'));
    };
    img.src = imageUrl;
  });
};


export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartGame, visualSettings, onBack }) => {
  const [playerNames, setPlayerNames] = useState<string[]>(['Kelompok 1', 'Kelompok 2']);
  const [activities, setActivities] = useState<BoardActivities>({});
  const [snakes, setSnakes] = useState<SnakeOrLadder[]>([{ start: 23, end: 5 }, { start: 16, end: 8 }]);
  const [ladders, setLadders] = useState<SnakeOrLadder[]>([{ start: 4, end: 14 }, { start: 11, end: 21 }]);
  const [generatingSnakeIndex, setGeneratingSnakeIndex] = useState<number | null>(null);
  
  // State for AI Activity Generation
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('cognitive');
  const [isGeneratingActivities, setIsGeneratingActivities] = useState(false);


  const handleAddPlayer = () => {
    if (playerNames.length < PLAYER_COLORS.length) {
      setPlayerNames([...playerNames, `Kelompok ${playerNames.length + 1}`]);
    }
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    const newPlayerNames = [...playerNames];
    newPlayerNames[index] = name;
    setPlayerNames(newPlayerNames);
  };

  const handleRemovePlayer = (index: number) => {
    setPlayerNames(playerNames.filter((_, i) => i !== index));
  };
  
  const handleActivityChange = (square: number, text: string) => {
    const newActivities = {...activities};
    if(text.trim() === '') {
        delete newActivities[square];
    } else {
        newActivities[square] = text;
    }
    setActivities(newActivities);
  };

  const handleSpecialSquareChange = (
    index: number,
    type: 'snakes' | 'ladders',
    field: 'start' | 'end',
    value: string
  ) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 1 || numValue > BOARD_SIZE) return;

    const list = type === 'snakes' ? [...snakes] : [...ladders];
    const updatedItem = { ...list[index], [field]: numValue };
    list[index] = updatedItem;

    if (type === 'snakes') setSnakes(list);
    else setLadders(list);
  };

  const handleAddSpecialSquare = (type: 'snakes' | 'ladders') => {
    const newItem = { start: 0, end: 0 };
    if (type === 'snakes') setSnakes([...snakes, newItem]);
    else setLadders([...ladders, newItem]);
  };
    
  const handleRemoveSpecialSquare = (index: number, type: 'snakes' | 'ladders') => {
    if (type === 'snakes') setSnakes(snakes.filter((_, i) => i !== index));
    else setLadders(ladders.filter((_, i) => i !== index));
  };

  const handleGenerateSnakeImage = async (index: number) => {
    if (generatingSnakeIndex !== null) return;
    setGeneratingSnakeIndex(index);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: 'A simple, cartoon rope, like a thick climbing rope. 2D flat vector art style. The rope must be in a long, stretched-out, gently waving line shape. The entire rope must be visible. CRUCIAL: The rope must NOT be coiled, knotted, or circular. It must be elongated. Isolated on a solid plain white background. No shadows or gradients.',
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
        },
      });

      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      const initialImageUrl = `data:image/png;base64,${base64ImageBytes}`;
      
      const finalImageUrl = await removeImageBackground(initialImageUrl);
      
      const newSnakes = [...snakes];
      newSnakes[index] = { ...newSnakes[index], imageUrl: finalImageUrl };
      setSnakes(newSnakes);

    } catch (error) {
      console.error("Error processing rope image:", error);
      alert("Gagal memproses gambar tali. Silakan coba lagi.");
    } finally {
      setGeneratingSnakeIndex(null);
    }
  };

  const handleGenerateActivities = async () => {
    if (!subject || !topic || !grade) {
      alert("Harap isi Mata Pelajaran, Materi, dan Kelas terlebih dahulu.");
      return;
    }
    setIsGeneratingActivities(true);
    try {
        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
        
        let prompt;

        if (activityType === 'psychomotor') {
            prompt = `Anda adalah seorang fasilitator kreatif dan instruktur yang merancang aktivitas untuk permainan Ular Tangga edukatif. Buatlah serangkaian TUGAS PRAKTIK atau PERAGAAN yang secara EKSKLUSIF berfokus pada konteks berikut:
- Mata Pelajaran: ${subject}
- Materi: ${topic}
- Tingkat: ${grade}

PENTING: Semua aktivitas HARUS berupa instruksi praktik/fisik/peragaan yang aman, relevan dengan materi (${topic}), dan dapat dilakukan oleh siswa tingkat ${grade}. JANGAN membuat pertanyaan teori atau kognitif (misalnya, "Sebutkan...", "Jelaskan...").
Contoh tugas untuk materi 'Sejarah Kemerdekaan': "Peragakan gaya Soekarno saat membacakan proklamasi.", "Berbarislah seperti pasukan Paskibraka selama 5 detik."
Contoh tugas untuk materi 'Biologi - Rantai Makanan': "Tiru gerakan kelinci melompat 3 kali.", "Peragakan cara tumbuhan melakukan fotosintesis dengan tanganmu."

Buatlah tugas untuk SETIAP KOTAK dari nomor 2 hingga ${BOARD_SIZE - 1}. Total harus ada ${BOARD_SIZE - 2} aktivitas. Jangan menempatkan aktivitas di kotak 1 atau kotak terakhir (${BOARD_SIZE}).

Kembalikan hasilnya dalam format JSON berupa sebuah ARRAY. Setiap elemen dalam array harus berupa OBJEK dengan dua properti: 'square' (nomor kotak sebagai ANGKA) dan 'activity' (tugas praktik sebagai STRING).
Contoh format: [ { "square": 2, "activity": "Lakukan gerakan menendang bola ke depan sebanyak 5 kali (tanpa bola)." }, { "square": 3, "activity": "Tiru gerakan seorang kiper menangkap bola 3 kali." }, ... ]`;
        } else { // 'cognitive'
            prompt = `Anda adalah seorang guru ahli yang merancang kuis untuk permainan Ular Tangga edukatif. Buatlah serangkaian pertanyaan singkat dan menarik yang secara EKSKLUSIF berfokus pada konteks berikut:
- Mata Pelajaran: ${subject}
- Materi: ${topic}
- Tingkat: ${grade}

PENTING: Semua pertanyaan HARUS relevan dengan materi (${topic}) dan sesuai untuk pemahaman siswa tingkat ${grade}. JANGAN membuat tugas fisik atau peragaan.

Buatlah pertanyaan untuk SETIAP KOTAK dari nomor 2 hingga ${BOARD_SIZE - 1}. Total harus ada ${BOARD_SIZE - 2} pertanyaan. Jangan menempatkan aktivitas di kotak 1 atau kotak terakhir (${BOARD_SIZE}).

Kembalikan hasilnya dalam format JSON berupa sebuah ARRAY. Setiap elemen dalam array harus berupa OBJEK dengan dua properti: 'square' (nomor kotak sebagai ANGKA) dan 'activity' (pertanyaan sebagai STRING).
Contoh format: [ { "square": 2, "activity": "Apa ibukota Indonesia?" }, { "square": 3, "activity": "Sebutkan 3 pahlawan nasional." }, ... ]`;
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            square: {
                                type: Type.NUMBER,
                                description: 'Nomor kotak untuk aktivitas ini.'
                            },
                            activity: {
                                type: Type.STRING,
                                description: 'Teks pertanyaan atau tugas untuk kotak ini.'
                            }
                        },
                        required: ['square', 'activity']
                    }
                },
            },
        });
        
        const jsonText = response.text.trim();
        const generatedItems: { square: number; activity: string }[] = JSON.parse(jsonText);
        
        const newActivities: BoardActivities = {};
        for (const item of generatedItems) {
            if (item.square && item.activity) {
                newActivities[item.square] = item.activity;
            }
        }
        setActivities(newActivities);

    } catch (error) {
        console.error("Error generating activities:", error);
        alert("Gagal membuat aktivitas. Silakan coba lagi.");
    } finally {
        setIsGeneratingActivities(false);
    }
  };

  const handleStart = () => {
    if (playerNames.some(name => name.trim() === '')) {
      alert('Nama pemain tidak boleh kosong.');
      return;
    }
    const finalPlayers: Player[] = playerNames.map((name, index) => ({
      id: index,
      name,
      position: 1,
      color: PLAYER_COLORS[index % PLAYER_COLORS.length],
    }));
    onStartGame(finalPlayers, activities, snakes, ladders, activityType);
  };

  const containerStyle: React.CSSProperties = visualSettings.containerBackground
    ? {
        backgroundImage: `url(${visualSettings.containerBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white', // Ganti warna teks agar kontras
      }
    : {};

  const defaultClasses = "bg-stone-50";
  const hasCustomBg = !!visualSettings.containerBackground;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
      <div 
        className={`w-full max-w-5xl rounded-2xl shadow-2xl shadow-black/30 p-6 sm:p-8 space-y-8 border-2 ${hasCustomBg ? 'border-white/20' : 'border-stone-200'} ${!hasCustomBg ? defaultClasses : ''}`}
        style={containerStyle}
      >
        <div className="text-center relative">
          <button
            onClick={onBack}
            aria-label="Kembali ke menu utama"
            className={`absolute top-0 left-0 flex items-center gap-1 text-sm font-semibold transition-colors ${hasCustomBg ? 'text-sky-300 hover:text-sky-100' : 'text-sky-600 hover:text-sky-800'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Kembali
          </button>
          <h1 className={`text-4xl sm:text-5xl font-bold font-poppins ${hasCustomBg ? 'text-white' : 'text-slate-800'}`}>Tangga Ilmu</h1>
          <p className={`mt-2 text-lg ${hasCustomBg ? 'text-slate-200' : 'text-slate-500'}`}>Atur Permainan Edukatif Anda</p>
        </div>

        {/* AI Activity Generation Section */}
        <div className={`p-6 rounded-xl border ${hasCustomBg ? 'bg-black/30 border-white/20' : 'bg-stone-100 border-stone-300'}`}>
            <h2 className={`text-2xl font-semibold mb-4 font-poppins ${hasCustomBg ? 'text-white' : 'text-slate-700'}`}>1. Tentukan Konteks Pembelajaran</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input type="text" placeholder="Mata Pelajaran (e.g., Sejarah)" value={subject} onChange={e => setSubject(e.target.value)} className={`p-3 border rounded-md focus:ring-2 focus:ring-orange-500 ${hasCustomBg ? 'bg-slate-800/50 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-slate-300'}`}/>
                <input type="text" placeholder="Materi Spesifik (e.g., Proklamasi)" value={topic} onChange={e => setTopic(e.target.value)} className={`p-3 border rounded-md focus:ring-2 focus:ring-orange-500 ${hasCustomBg ? 'bg-slate-800/50 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-slate-300'}`}/>
                <input type="text" placeholder="Tingkat Kelas (e.g., Kelas 5 SD)" value={grade} onChange={e => setGrade(e.target.value)} className={`p-3 border rounded-md focus:ring-2 focus:ring-orange-500 ${hasCustomBg ? 'bg-slate-800/50 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-slate-300'}`}/>
            </div>
             <div className="flex justify-center gap-6 my-4">
                <label className={`flex items-center gap-2 cursor-pointer p-2 rounded-md ${hasCustomBg ? 'hover:bg-black/20' : 'hover:bg-stone-200'}`}>
                    <input 
                    type="radio" 
                    name="activityType" 
                    value="cognitive"
                    checked={activityType === 'cognitive'}
                    onChange={() => setActivityType('cognitive')}
                    className="w-5 h-5 text-orange-600 focus:ring-orange-500 border-slate-400"
                    />
                    <span className={`font-semibold ${hasCustomBg ? 'text-slate-200' : 'text-slate-700'}`}>Kognitif (Tanya Jawab)</span>
                </label>
                <label className={`flex items-center gap-2 cursor-pointer p-2 rounded-md ${hasCustomBg ? 'hover:bg-black/20' : 'hover:bg-stone-200'}`}>
                    <input 
                    type="radio" 
                    name="activityType" 
                    value="psychomotor"
                    checked={activityType === 'psychomotor'}
                    onChange={() => setActivityType('psychomotor')}
                    className="w-5 h-5 text-orange-600 focus:ring-orange-500 border-slate-400"
                    />
                    <span className={`font-semibold ${hasCustomBg ? 'text-slate-200' : 'text-slate-700'}`}>Psikomotor (Praktik)</span>
                </label>
            </div>
            <button
                onClick={handleGenerateActivities}
                disabled={isGeneratingActivities || !subject || !topic || !grade}
                className="w-full bg-orange-600 text-white font-bold text-lg py-3 rounded-lg hover:bg-orange-700 transition-all transform hover:scale-105 shadow disabled:bg-slate-400 disabled:cursor-not-allowed disabled:transform-none"
            >
                {isGeneratingActivities ? 'Sedang Membuat Aktivitas...' : 'Buat Aktivitas dengan AI'}
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Left Column: Players & Special Squares */}
          <div className="space-y-6">
            <h2 className={`text-2xl font-semibold -mb-2 font-poppins ${hasCustomBg ? 'text-white' : 'text-slate-700'}`}>2. Atur Pemain & Papan</h2>
            {/* Players Setup */}
            <div>
              <h3 className={`text-xl font-medium mb-2 ${hasCustomBg ? 'text-slate-200' : 'text-slate-600'}`}>Pemain</h3>
              {playerNames.map((name, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <span className={`w-6 h-6 rounded-full ${PLAYER_COLORS[index % PLAYER_COLORS.length]}`}></span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                    className={`flex-grow p-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${hasCustomBg ? 'bg-slate-800/50 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-slate-300'}`}
                  />
                  <button onClick={() => handleRemovePlayer(index)} className="text-red-500 hover:text-red-700 p-1">✕</button>
                </div>
              ))}
              {playerNames.length < PLAYER_COLORS.length && (
                <button onClick={handleAddPlayer} className={`mt-2 w-full font-semibold border-2 rounded-md py-2 transition-colors ${hasCustomBg ? 'text-orange-300 border-orange-400 hover:bg-black/20' : 'text-orange-600 border-orange-500 hover:bg-orange-50'}`}>
                  + Tambah Pemain
                </button>
              )}
            </div>
            
            {/* Special Squares Setup */}
            <div className="space-y-4">
              <SpecialSquareSetup 
                  title="Tangga (Naik)" 
                  items={ladders} 
                  onChange={(i, f, v) => handleSpecialSquareChange(i, 'ladders', f, v)} 
                  onAdd={() => handleAddSpecialSquare('ladders')} 
                  onRemove={(i) => handleRemoveSpecialSquare(i, 'ladders')}
                  hasCustomBg={hasCustomBg}
              />
              <SpecialSquareSetup 
                  title="Tali (Turun)" 
                  items={snakes} 
                  onChange={(i, f, v) => handleSpecialSquareChange(i, 'snakes', f, v)} 
                  onAdd={() => handleAddSpecialSquare('snakes')} 
                  onRemove={(i) => handleRemoveSpecialSquare(i, 'snakes')}
                  onGenerateImage={handleGenerateSnakeImage}
                  generatingIndex={generatingSnakeIndex}
                  hasCustomBg={hasCustomBg}
              />
            </div>
          </div>
          
          {/* Right Column: Activities */}
          <div>
            <h2 className={`text-2xl font-semibold border-b-2 pb-2 mb-4 font-poppins ${hasCustomBg ? 'text-white border-white/20' : 'text-slate-700 border-stone-200'}`}>3. Tinjau Aktivitas Kotak</h2>
            <div className="max-h-[450px] overflow-y-auto space-y-3 pr-3">
              {[...Array(BOARD_SIZE)].map((_, i) => {
                const squareNum = i + 1;
                return (
                  <div key={squareNum}>
                    <label className={`font-semibold ${hasCustomBg ? 'text-slate-200' : 'text-slate-600'}`}>Kotak {squareNum}:</label>
                    <textarea
                      value={activities[squareNum] || ''}
                      onChange={(e) => handleActivityChange(squareNum, e.target.value)}
                      placeholder="Kosong (atau isi manual)"
                      className={`w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${hasCustomBg ? 'bg-slate-800/50 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-slate-300'}`}
                      rows={2}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className={`pt-6 border-t ${hasCustomBg ? 'border-white/20' : 'border-slate-200'}`}>
          <button onClick={handleStart} className="w-full bg-emerald-600 text-white font-bold text-xl py-4 rounded-lg hover:bg-emerald-700 transition-transform transform hover:scale-105 shadow-lg">
            Mulai Permainan
          </button>
        </div>
      </div>
    </div>
  );
};

interface SpecialSquareSetupProps {
    title: string;
    items: SnakeOrLadder[];
    onChange: (index: number, field: 'start' | 'end', value: string) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
    onGenerateImage?: (index: number) => void;
    generatingIndex?: number | null;
    hasCustomBg: boolean;
}

const SpecialSquareSetup: React.FC<SpecialSquareSetupProps> = ({ title, items, onChange, onAdd, onRemove, onGenerateImage, generatingIndex, hasCustomBg }) => {
    const baseTitle = title.split(' ')[0];

    return (
        <div>
            <h3 className={`text-xl font-medium mb-2 ${hasCustomBg ? 'text-slate-200' : 'text-slate-600'}`}>{title}</h3>
            {items.map((item, index) => (
                <div key={index} className={`p-2 border rounded-lg mb-2 ${hasCustomBg ? 'bg-black/20 border-white/10' : 'bg-stone-100'}`}>
                  <div className="flex items-center gap-2">
                      <input type="number" value={item.start || ''} onChange={e => onChange(index, 'start', e.target.value)} className={`w-16 p-2 border rounded-md ${hasCustomBg ? 'bg-slate-800/50 border-slate-500 text-white' : 'bg-white'}`} placeholder="Dari" />
                      <span>→</span>
                      <input type="number" value={item.end || ''} onChange={e => onChange(index, 'end', e.target.value)} className={`w-16 p-2 border rounded-md ${hasCustomBg ? 'bg-slate-800/50 border-slate-500 text-white' : 'bg-white'}`} placeholder="Ke" />
                      <button onClick={() => onRemove(index)} className="text-red-500 hover:text-red-700 p-1 ml-auto">✕</button>
                  </div>
                  {onGenerateImage && (
                      <div className="flex items-center gap-2 mt-2">
                        {item.imageUrl && <img src={item.imageUrl} alt={`Pratinjau ${baseTitle}`} className="w-10 h-10 rounded-md object-cover border" />}
                        <button
                            onClick={() => onGenerateImage(index)}
                            disabled={generatingIndex !== null}
                            className="flex-grow text-sm bg-emerald-500 text-white font-semibold rounded-md py-1.5 px-2 hover:bg-emerald-600 transition-colors disabled:bg-slate-400 disabled:cursor-wait"
                        >
                            {generatingIndex === index ? 'Membuat...' : `Buat Gambar ${baseTitle}`}
                        </button>
                      </div>
                  )}
                </div>
            ))}
            <button onClick={onAdd} className={`mt-1 w-full text-sm font-semibold border-2 border-dashed rounded-md py-1 transition-colors ${hasCustomBg ? 'text-slate-400 border-slate-500 hover:bg-black/20' : 'text-slate-600 border-slate-400 hover:bg-stone-200'}`}>
              + Tambah {baseTitle}
            </button>
        </div>
    );
};