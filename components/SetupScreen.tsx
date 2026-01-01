
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
  const [snakes, setSnakes] = useState<SnakeOrLadder[]>([
    { start: 23, end: 5, imageUrl: ROPE_ASSETS[0] }, 
    { start: 16, end: 8, imageUrl: ROPE_ASSETS[1] }
  ]);
  const [ladders, setLadders] = useState<SnakeOrLadder[]>([{ start: 4, end: 14 }, { start: 11, end: 21 }]);
  
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
        // Correct initialization with API key from environment
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        let prompt;
        const maxSquares = gameType === GameType.ChallengeTrail ? 9 : BOARD_SIZE;

        if (gameType === GameType.ChallengeTrail) {
            prompt = `Anda adalah seorang pendidik ahli. Buatlah 9 ${activityType === 'cognitive' ? 'pertanyaan' : 'tugas praktik'} untuk game "Jalur Tantangan" dengan tingkat kesulitan yang meningkat (Scaffolding).
Konteks:
- Mapel: ${subject}
- Materi: ${topic}
- Kelas: ${grade}

PENTING:
1. Kotak 1-3: Tingkat MUDAH (Pengetahuan/Pemahaman dasar).
2. Kotak 4-6: Tingkat SEDANG (Aplikasi/Analisis).
3. Kotak 7-9: Tingkat SULIT/HOTS (Evaluasi/Kreasi).

Format: JSON ARRAY objek { "square": number, "activity": string }.
Buatlah tepat 9 aktivitas untuk kotak 1 sampai 9.`;
        } else {
            prompt = `Buatlah aktivitas edukatif untuk game Ular Tangga.
- Mapel: ${subject}, Materi: ${topic}, Kelas: ${grade}
- Tipe: ${activityType === 'cognitive' ? 'Kognitif (Tanya Jawab)' : 'Psikomotor (Tugas Praktik)'}
Buat untuk kotak 2 hingga ${BOARD_SIZE - 1}.
Format: JSON ARRAY objek { "square": number, "activity": string }.`;
        }
        
        // Correct generateContent call with model name and response configuration
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
        
        // Correct usage of .text property
        const generatedItems: { square: number; activity: string }[] = JSON.parse(response.text.trim());
        const newActivities: BoardActivities = {};
        generatedItems.forEach(item => { if (item.square && item.activity) newActivities[item.square] = item.activity; });
        setActivities(newActivities);
    } catch (error) {
        console.error("Error:", error);
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
        className={`w-full max-w-5xl rounded-2xl shadow-2xl p-6 sm:p-8 space-y-8 border-2 ${hasCustomBg ? 'bg-black/40 border-white/20 text-white' : 'bg-stone-50 border-stone-200 text-slate-800'}`}
        style={hasCustomBg ? { backgroundImage: `url(${visualSettings.containerBackground})`, backgroundSize: 'cover' } : {}}
      >
        <div className="text-center relative">
          <button onClick={onBack} className="absolute top-0 left-0 text-sky-500 font-bold">← Kembali</button>
          <h1 className="text-4xl font-bold font-poppins">Tangga Ilmu</h1>
          <p className="opacity-80">Siapkan Petualangan Belajar Anda</p>
        </div>

        {/* Game Mode Selector */}
        <div className={`p-4 rounded-xl border flex gap-4 justify-center ${hasCustomBg ? 'bg-white/10 border-white/20' : 'bg-white border-stone-200'}`}>
            <button 
                onClick={() => setGameType(GameType.SnakesLadders)}
                className={`px-6 py-2 rounded-full font-bold transition-all ${gameType === GameType.SnakesLadders ? 'bg-orange-600 text-white shadow-lg scale-105' : 'bg-stone-200 text-slate-600'}`}
            >
                Ular Tangga (25 Kotak)
            </button>
            <button 
                onClick={() => setGameType(GameType.ChallengeTrail)}
                className={`px-6 py-2 rounded-full font-bold transition-all ${gameType === GameType.ChallengeTrail ? 'bg-sky-600 text-white shadow-lg scale-105' : 'bg-stone-200 text-slate-600'}`}
            >
                Jalur Tantangan (9 Kotak S)
            </button>
        </div>

        <div className={`p-6 rounded-xl border ${hasCustomBg ? 'bg-black/30 border-white/20' : 'bg-stone-100 border-stone-300'}`}>
            <h2 className="text-2xl font-semibold mb-4 font-poppins">1. Konteks Pembelajaran</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" placeholder="Mapel" value={subject} onChange={e => setSubject(e.target.value)} className="p-3 border rounded bg-white text-slate-800"/>
                <input type="text" placeholder="Materi" value={topic} onChange={e => setTopic(e.target.value)} className="p-3 border rounded bg-white text-slate-800"/>
                <input type="text" placeholder="Kelas" value={grade} onChange={e => setGrade(e.target.value)} className="p-3 border rounded bg-white text-slate-800"/>
            </div>
             <div className="flex justify-center gap-6 my-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={activityType === 'cognitive'} onChange={() => setActivityType('cognitive')} />
                    <span>Kognitif</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={activityType === 'psychomotor'} onChange={() => setActivityType('psychomotor')} />
                    <span>Psikomotor</span>
                </label>
            </div>
            <button
                onClick={handleGenerateActivities}
                disabled={isGeneratingActivities || !subject || !topic || !grade}
                className="w-full bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700 disabled:bg-slate-400"
            >
                {isGeneratingActivities ? 'Memproses...' : 'Buat Aktivitas dengan AI'}
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold border-b pb-2 mb-4 font-poppins">2. Tinjau Aktivitas</h2>
            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
              {[...Array(gameType === GameType.ChallengeTrail ? 9 : BOARD_SIZE)].map((_, i) => (
                <div key={i+1} className="flex gap-2 items-center">
                    <span className="font-bold w-8">{i+1}:</span>
                    <input
                      value={activities[i+1] || ''}
                      onChange={(e) => setActivities({...activities, [i+1]: e.target.value})}
                      placeholder="Kosong..."
                      className="flex-grow p-2 border rounded text-slate-800 text-sm"
                    />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold font-poppins">3. Atur Pemain</h2>
            {playerNames.map((name, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${PLAYER_COLORS[index % PLAYER_COLORS.length]}`}></div>
                  <input value={name} onChange={(e) => {
                      const n = [...playerNames]; n[index] = e.target.value; setPlayerNames(n);
                  }} className="flex-grow p-2 border rounded text-slate-800" />
                  <button onClick={() => setPlayerNames(playerNames.filter((_, i) => i !== index))} className="text-red-500">✕</button>
                </div>
            ))}
            <button onClick={() => setPlayerNames([...playerNames, `Kelompok ${playerNames.length+1}`])} className="w-full py-1 border-2 border-dashed rounded text-sm">+ Tambah</button>
          </div>
        </div>
        
        <button onClick={handleStart} className="w-full bg-emerald-600 text-white font-bold text-xl py-4 rounded-lg hover:bg-emerald-700">
            Mulai Permainan
        </button>
      </div>
    </div>
  );
};
