
import React, { useState } from 'react';
import { Player, SnakeOrLadder, BoardActivities, ActivityType, VisualSettings, GameType } from '../types';
import { BOARD_SIZE, PLAYER_COLORS } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";

interface SetupScreenProps {
  onStartGame: (
    players: Player[],
    activities: BoardActivities,
    snakes: SnakeOrLadder[],
    ladders: SnakeOrLadder[],
    activityType: ActivityType,
    gameType: GameType
  ) => void;
  visualSettings: VisualSettings;
  onBack: () => void;
}

const ROPE_ASSETS = [
  '/assets/rope1.png',
  '/assets/rope2.png',
  '/assets/rope3.png',
];

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartGame, visualSettings, onBack }) => {
  const [gameType, setGameType] = useState<GameType>(GameType.SnakesLadders);
  const [playerNames, setPlayerNames] = useState<string[]>(['Kelompok 1', 'Kelompok 2']);
  const [activities, setActivities] = useState<BoardActivities>({});
  
  // State untuk Ular dan Tangga
  const [snakes, setSnakes] = useState<SnakeOrLadder[]>([
    { start: 23, end: 5, imageUrl: ROPE_ASSETS[0] }, 
    { start: 16, end: 8, imageUrl: ROPE_ASSETS[1] }
  ]);
  const [ladders, setLadders] = useState<SnakeOrLadder[]>([
    { start: 4, end: 14 }, 
    { start: 11, end: 21 }
  ]);
  
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('cognitive');
  const [isGeneratingActivities, setIsGeneratingActivities] = useState(false);

  const handleGenerateActivities = async () => {
    if (!subject || !topic || !grade) {
      alert("Harap isi Mata Pelajaran, Materi, dan Kelas terlebih dahulu.");
      return;
    }
    setIsGeneratingActivities(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let prompt;

        if (gameType === GameType.ChallengeTrail) {
            prompt = `Anda adalah seorang pendidik ahli. Buatlah 9 ${activityType === 'cognitive' ? 'pertanyaan' : 'tugas praktik'} untuk game "Jalur Tantangan" dengan tingkat kesulitan yang meningkat.
Konteks: Mapel: ${subject}, Materi: ${topic}, Kelas: ${grade}
PENTING:
1. Kotak 1-3: MUDAH.
2. Kotak 4-6: SEDANG.
3. Kotak 7-9: SULIT.
Format: JSON ARRAY objek { "square": number, "activity": string }.`;
        } else {
            prompt = `Buatlah aktivitas edukatif untuk game Ular Tangga.
- Mapel: ${subject}, Materi: ${topic}, Kelas: ${grade}
- Tipe: ${activityType === 'cognitive' ? 'Kognitif' : 'Psikomotor'}
Buat untuk kotak 2 hingga ${BOARD_SIZE - 1}. Berikan variasi aktivitas di sekitar 10-15 kotak saja secara acak.
Format: JSON ARRAY objek { "square": number, "activity": string }.`;
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            square: { type: Type.NUMBER },
                            activity: { type: Type.STRING }
                        },
                        required: ['square', 'activity']
                    }
                },
            },
        });
        
        const generatedItems: { square: number; activity: string }[] = JSON.parse(response.text.trim());
        const newActivities: BoardActivities = {};
        generatedItems.forEach(item => { if (item.square && item.activity) newActivities[item.square] = item.activity; });
        setActivities(newActivities);
    } catch (error) {
        console.error("Error AI:", error);
        alert("Gagal membuat aktivitas.");
    } finally {
        setIsGeneratingActivities(false);
    }
  };

  const handleStart = () => {
    const finalPlayers: Player[] = playerNames.map((name, index) => ({
      id: index,
      name,
      position: 1,
      color: PLAYER_COLORS[index % PLAYER_COLORS.length],
    }));
    onStartGame(finalPlayers, activities, snakes, ladders, activityType, gameType);
  };

  const hasCustomBg = !!visualSettings.containerBackground;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
      <div 
        className={`w-full max-w-6xl rounded-2xl shadow-2xl p-6 sm:p-8 space-y-8 border-2 ${hasCustomBg ? 'bg-black/60 border-white/20 text-white' : 'bg-stone-50 border-stone-200 text-slate-800'}`}
        style={hasCustomBg ? { backgroundImage: `url(${visualSettings.containerBackground})`, backgroundSize: 'cover' } : {}}
      >
        <div className="text-center relative">
          <button onClick={onBack} className="absolute top-0 left-0 text-sky-500 font-bold hover:underline">← Menu Utama</button>
          <h1 className="text-4xl font-bold font-poppins">Konfigurasi Permainan</h1>
          <p className="opacity-80">Pilih mode dan atur konten pembelajaran Anda</p>
        </div>

        {/* Pemilih Mode Game */}
        <div className="flex flex-col md:flex-row gap-4 justify-center items-stretch">
            <button 
                onClick={() => setGameType(GameType.SnakesLadders)}
                className={`flex-1 p-6 rounded-2xl border-4 transition-all text-left space-y-2 ${gameType === GameType.SnakesLadders ? 'bg-orange-600/20 border-orange-500 ring-4 ring-orange-500/20' : 'bg-white/5 border-transparent'}`}
            >
                <h3 className="text-2xl font-bold">Ular Tangga Klasik</h3>
                <p className="text-sm opacity-70">25 Kotak, menggunakan Dadu, ada Ular (Tali) & Tangga.</p>
            </button>
            <button 
                onClick={() => setGameType(GameType.ChallengeTrail)}
                className={`flex-1 p-6 rounded-2xl border-4 transition-all text-left space-y-2 ${gameType === GameType.ChallengeTrail ? 'bg-sky-600/20 border-sky-500 ring-4 ring-sky-500/20' : 'bg-white/5 border-transparent'}`}
            >
                <h3 className="text-2xl font-bold">Jalur Tantangan</h3>
                <p className="text-sm opacity-70">9 Kotak (S-Path), Tanpa Dadu, Kesulitan Bertingkat (Scaffolding).</p>
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Bagian 1: Konteks AI */}
            <div className={`p-6 rounded-xl border space-y-4 ${hasCustomBg ? 'bg-black/30 border-white/10' : 'bg-stone-100 border-stone-200'}`}>
                <h2 className="text-xl font-bold border-b pb-2">1. Materi Pembelajaran</h2>
                <div className="space-y-3">
                    <input type="text" placeholder="Mata Pelajaran" value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-3 border rounded bg-white text-slate-800"/>
                    <input type="text" placeholder="Materi / Topik" value={topic} onChange={e => setTopic(e.target.value)} className="w-full p-3 border rounded bg-white text-slate-800"/>
                    <input type="text" placeholder="Kelas (Misal: 4 SD)" value={grade} onChange={e => setGrade(e.target.value)} className="w-full p-3 border rounded bg-white text-slate-800"/>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setActivityType('cognitive')} className={`flex-1 py-2 rounded font-bold border-2 ${activityType === 'cognitive' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-white border-stone-300 text-slate-600'}`}>Kognitif</button>
                    <button onClick={() => setActivityType('psychomotor')} className={`flex-1 py-2 rounded font-bold border-2 ${activityType === 'psychomotor' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-white border-stone-300 text-slate-600'}`}>Psikomotor</button>
                </div>
                <button
                    onClick={handleGenerateActivities}
                    disabled={isGeneratingActivities || !subject || !topic || !grade}
                    className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 disabled:bg-slate-500 transition-colors"
                >
                    {isGeneratingActivities ? 'Menyusun...' : 'Buat Aktivitas dengan AI'}
                </button>
            </div>

            {/* Bagian 2: Pengaturan Papan */}
            <div className={`p-6 rounded-xl border space-y-4 ${hasCustomBg ? 'bg-black/30 border-white/10' : 'bg-stone-100 border-stone-200'}`}>
                <h2 className="text-xl font-bold border-b pb-2">2. Pengaturan Papan</h2>
                
                {gameType === GameType.SnakesLadders ? (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        <div>
                            <p className="text-sm font-bold mb-2 text-sky-500 uppercase">Tangga (Maju)</p>
                            {ladders.map((l, i) => (
                                <div key={i} className="flex items-center gap-2 mb-2">
                                    <input type="number" value={l.start} onChange={e => {
                                        const nl = [...ladders]; nl[i].start = parseInt(e.target.value); setLadders(nl);
                                    }} className="w-full p-1 border rounded text-slate-800 text-xs" />
                                    <span>→</span>
                                    <input type="number" value={l.end} onChange={e => {
                                        const nl = [...ladders]; nl[i].end = parseInt(e.target.value); setLadders(nl);
                                    }} className="w-full p-1 border rounded text-slate-800 text-xs" />
                                    <button onClick={() => setLadders(ladders.filter((_, idx) => idx !== i))} className="text-red-500">✕</button>
                                </div>
                            ))}
                            <button onClick={() => setLadders([...ladders, {start: 2, end: 10}])} className="text-xs text-sky-500 font-bold hover:underline">+ Tambah Tangga</button>
                        </div>
                        <div className="border-t pt-2">
                            <p className="text-sm font-bold mb-2 text-red-500 uppercase">Ular / Tali (Turun)</p>
                            {snakes.map((s, i) => (
                                <div key={i} className="flex items-center gap-2 mb-2">
                                    <input type="number" value={s.start} onChange={e => {
                                        const ns = [...snakes]; ns[i].start = parseInt(e.target.value); setSnakes(ns);
                                    }} className="w-full p-1 border rounded text-slate-800 text-xs" />
                                    <span>→</span>
                                    <input type="number" value={s.end} onChange={e => {
                                        const ns = [...snakes]; ns[i].end = parseInt(e.target.value); setSnakes(ns);
                                    }} className="w-full p-1 border rounded text-slate-800 text-xs" />
                                    <button onClick={() => setSnakes(snakes.filter((_, idx) => idx !== i))} className="text-red-500">✕</button>
                                </div>
                            ))}
                            <button onClick={() => setSnakes([...snakes, {start: 20, end: 5, imageUrl: ROPE_ASSETS[0]}])} className="text-xs text-red-500 font-bold hover:underline">+ Tambah Ular</button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 opacity-60">
                        <p>Mode Jalur Tantangan tidak memerlukan Ular dan Tangga.</p>
                    </div>
                )}
            </div>

            {/* Bagian 3: Pemain & Aktivitas */}
            <div className={`p-6 rounded-xl border space-y-4 ${hasCustomBg ? 'bg-black/30 border-white/10' : 'bg-stone-100 border-stone-200'}`}>
                <h2 className="text-xl font-bold border-b pb-2">3. Kelompok Pemain</h2>
                <div className="space-y-2">
                    {playerNames.map((name, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${PLAYER_COLORS[index % PLAYER_COLORS.length]}`}></div>
                            <input value={name} onChange={(e) => {
                                const n = [...playerNames]; n[index] = e.target.value; setPlayerNames(n);
                            }} className="flex-grow p-2 border rounded text-slate-800 text-sm" />
                            <button onClick={() => setPlayerNames(playerNames.filter((_, i) => i !== index))} className="text-red-500">✕</button>
                        </div>
                    ))}
                    <button onClick={() => setPlayerNames([...playerNames, `Kelompok ${playerNames.length+1}`])} className="w-full py-1 border-2 border-dashed border-stone-400 rounded text-xs text-stone-500 hover:bg-stone-200">+ Tambah Kelompok</button>
                </div>

                <div className="mt-6">
                    <h2 className="text-xl font-bold border-b pb-2 mb-3">Tinjau Aktivitas</h2>
                    <div className="max-h-[150px] overflow-y-auto space-y-1 pr-2">
                        {Object.keys(activities).sort((a,b) => parseInt(a)-parseInt(b)).map(square => (
                            <div key={square} className="text-xs flex gap-2">
                                <span className="font-bold">{square}:</span>
                                <span className="truncate opacity-80">{activities[parseInt(square)]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        
        <button onClick={handleStart} className="w-full bg-emerald-600 text-white font-bold text-2xl py-5 rounded-2xl hover:bg-emerald-700 shadow-xl transform active:scale-95 transition-all">
            Mulai Petualangan!
        </button>
      </div>
    </div>
  );
};
