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

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartGame, onBack }) => {
  const [playerNames, setPlayerNames] = useState<string[]>(['Kelompok 1', 'Kelompok 2']);
  const [activities, setActivities] = useState<BoardActivities>({});
  const [snakes, setSnakes] = useState<SnakeOrLadder[]>([
    { start: 23, end: 5 }, 
    { start: 16, end: 8 }
  ]);
  const [ladders, setLadders] = useState<SnakeOrLadder[]>([{ start: 4, end: 14 }, { start: 11, end: 21 }]);
  
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
    if (type === 'snakes') {
      setSnakes([...snakes, { start: 0, end: 0 }]);
    } else {
      setLadders([...ladders, { start: 0, end: 0 }]);
    }
  };
    
  const handleRemoveSpecialSquare = (index: number, type: 'snakes' | 'ladders') => {
    if (type === 'snakes') setSnakes(snakes.filter((_, i) => i !== index));
    else setLadders(ladders.filter((_, i) => i !== index));
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
        alert("Gagal membuat aktivitas. Pastikan API Key Anda valid dan coba lagi.");
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
      <div 
        className="w-full max-w-5xl bg-stone-50 rounded-2xl shadow-2xl shadow-black/30 p-6 sm:p-8 space-y-8 border-2 border-stone-200"
      >
        <div className="text-center relative">
          <button
            onClick={onBack}
            aria-label="Kembali ke menu utama"
            className="absolute top-0 left-0 flex items-center gap-1 text-sm font-semibold transition-colors text-sky-600 hover:text-sky-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Kembali
          </button>
          <h1 className="text-4xl sm:text-5xl font-bold font-poppins text-slate-800">Tangga Ilmu</h1>
          <p className="mt-2 text-lg text-slate-500">Atur Permainan Edukatif Anda</p>
        </div>

        {/* AI Activity Generation Section */}
        <div className="p-6 rounded-xl border bg-stone-100 border-stone-300">
            <h2 className="text-2xl font-semibold mb-4 font-poppins text-slate-700">1. Tentukan Konteks Pembelajaran</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input type="text" placeholder="Mata Pelajaran (e.g., Sejarah)" value={subject} onChange={e => setSubject(e.target.value)} className="p-3 border rounded-md focus:ring-2 focus:ring-orange-500 bg-white border-slate-300"/>
                <input type="text" placeholder="Materi Spesifik (e.g., Proklamasi)" value={topic} onChange={e => setTopic(e.target.value)} className="p-3 border rounded-md focus:ring-2 focus:ring-orange-500 bg-white border-slate-300"/>
                <input type="text" placeholder="Tingkat Kelas (e.g., Kelas 5 SD)" value={grade} onChange={e => setGrade(e.target.value)} className="p-3 border rounded-md focus:ring-2 focus:ring-orange-500 bg-white border-slate-300"/>
            </div>
             <div className="flex justify-center gap-6 my-4">
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-stone-200">
                    <input 
                    type="radio" 
                    name="activityType" 
                    value="cognitive"
                    checked={activityType === 'cognitive'}
                    onChange={() => setActivityType('cognitive')}
                    className="w-5 h-5 text-orange-600 focus:ring-orange-500 border-slate-400"
                    />
                    <span className="font-semibold text-slate-700">Kognitif (Tanya Jawab)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-stone-200">
                    <input 
                    type="radio" 
                    name="activityType" 
                    value="psychomotor"
                    checked={activityType === 'psychomotor'}
                    onChange={() => setActivityType('psychomotor')}
                    className="w-5 h-5 text-orange-600 focus:ring-orange-500 border-slate-400"
                    />
                    <span className="font-semibold text-slate-700">Psikomotor (Praktik)</span>
                </label>
            </div>
            <button
                onClick={handleGenerateActivities}
                disabled={isGeneratingActivities || !subject || !topic || !grade}
                className="w-full bg-orange-600 text-white font-bold text-lg py-3 rounded-lg hover:bg-orange-700 transition-all transform hover:scale-105 shadow disabled:bg-slate-400 disabled:cursor-not-allowed disabled:transform-none"
            >
                {isGeneratingActivities ? 'Sedang Membuat...' : 'Buat Aktivitas/Soal dengan AI'}
            </button>
            {!import.meta.env.VITE_API_KEY && (
              <p className="text-xs text-center mt-2 text-yellow-600">
                Fitur AI membutuhkan API Key. Jika tombol nonaktif, pastikan API Key telah diatur.
              </p>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Column 1: Activities Review */}
          <div>
            <h2 className="text-2xl font-semibold border-b-2 pb-2 mb-4 font-poppins text-slate-700 border-stone-200">2. Tinjau Kotak Aktivitas/Soal</h2>
            <div className="max-h-[450px] overflow-y-auto space-y-3 pr-3">
              {[...Array(BOARD_SIZE)].map((_, i) => {
                const squareNum = i + 1;
                return (
                  <div key={squareNum}>
                    <label className="font-semibold text-slate-600">Kotak {squareNum}:</label>
                    <textarea
                      value={activities[squareNum] || ''}
                      onChange={(e) => handleActivityChange(squareNum, e.target.value)}
                      placeholder="Kosong (atau isi manual)"
                      className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white border-slate-300"
                      rows={2}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Players & Special Squares */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold -mb-2 font-poppins text-slate-700">3. Atur Pemain & Papan</h2>
            {/* Players Setup */}
            <div>
              <h3 className="text-xl font-medium mb-2 text-slate-600">Pemain</h3>
              {playerNames.map((name, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <span className={`w-6 h-6 rounded-full ${PLAYER_COLORS[index % PLAYER_COLORS.length]}`}></span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                    className="flex-grow p-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white border-slate-300"
                  />
                  <button onClick={() => handleRemovePlayer(index)} className="text-red-500 hover:text-red-700 p-1">✕</button>
                </div>
              ))}
              {playerNames.length < PLAYER_COLORS.length && (
                <button onClick={handleAddPlayer} className="mt-2 w-full font-semibold border-2 rounded-md py-2 transition-colors text-orange-600 border-orange-500 hover:bg-orange-50">
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
              />
              <SpecialSquareSetup 
                  title="Tali (Turun)" 
                  items={snakes} 
                  onChange={(i, f, v) => handleSpecialSquareChange(i, 'snakes', f, v)} 
                  onAdd={() => handleAddSpecialSquare('snakes')} 
                  onRemove={(i) => handleRemoveSpecialSquare(i, 'snakes')}
              />
            </div>
          </div>
        </div>
        
        <div className="pt-6 border-t border-slate-200">
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
}

const SpecialSquareSetup: React.FC<SpecialSquareSetupProps> = ({ title, items, onChange, onAdd, onRemove }) => {
    const baseTitle = title.split(' ')[0];

    return (
        <div>
            <h3 className="text-xl font-medium mb-2 text-slate-600">{title}</h3>
            {items.map((item, index) => (
                <div key={index} className="p-2 border rounded-lg mb-2 bg-stone-100">
                  <div className="flex items-center gap-2">
                      <input type="number" value={item.start || ''} onChange={e => onChange(index, 'start', e.target.value)} className="w-16 p-2 border rounded-md bg-white" placeholder="Dari" />
                      <span>→</span>
                      <input type="number" value={item.end || ''} onChange={e => onChange(index, 'end', e.target.value)} className="w-16 p-2 border rounded-md bg-white" placeholder="Ke" />
                      <button onClick={() => onRemove(index)} className="text-red-500 hover:text-red-700 p-1 ml-auto">✕</button>
                  </div>
                </div>
            ))}
            <button onClick={onAdd} className="mt-1 w-full text-sm font-semibold border-2 border-dashed rounded-md py-1 transition-colors text-slate-600 border-slate-400 hover:bg-stone-200">
              + Tambah {baseTitle}
            </button>
        </div>
    );
};
