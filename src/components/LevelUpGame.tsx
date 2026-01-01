import React, { useState } from 'react';
import { GameStage, Player, LevelContent, ActivityType, VisualSettings, LevelTask } from '../types';
import { PLAYER_COLORS } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";
import { VictoryScreen } from './VictoryScreen';

// --- TYPES INTERNAL ---
type SetupStep = 'input' | 'review';

// --- SETUP COMPONENT ---
interface LevelUpSetupProps {
    onStartGame: (players: Player[], content: LevelContent, type: ActivityType) => void;
    visualSettings: VisualSettings;
    onBack: () => void;
}

const LevelUpSetup: React.FC<LevelUpSetupProps> = ({ onStartGame, visualSettings, onBack }) => {
    // State Input
    const [step, setStep] = useState<SetupStep>('input');
    const [subject, setSubject] = useState('');
    const [grade, setGrade] = useState('');
    const [objective, setObjective] = useState('');
    const [activityType, setActivityType] = useState<ActivityType>('cognitive');
    const [playerNames, setPlayerNames] = useState<string[]>(['Tim A', 'Tim B']);
    
    // State Processing
    const [isGenerating, setIsGenerating] = useState(false);
    const [draftLevels, setDraftLevels] = useState<LevelContent>({});

    const handleAddPlayer = () => {
        if (playerNames.length < PLAYER_COLORS.length) setPlayerNames([...playerNames, `Tim ${String.fromCharCode(65 + playerNames.length)}`]);
    };

    // Step 1: Generate Content
    const handleGenerate = async () => {
        if (!subject || !grade || !objective) {
            alert("Mohon lengkapi Mata Pelajaran, Kelas, dan Tujuan Pembelajaran.");
            return;
        }

        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
            
            const promptContext = activityType === 'cognitive' 
                ? "Pertanyaan Kuis/Soal (Kognitif)" 
                : "Tantangan Fisik/Praktik (Psikomotor)";

            const prompt = `Anda adalah desainer game edukasi level bertingkat. Buatlah 9 konten ${promptContext} untuk permainan "Level Up".
            
            Konteks:
            - Mapel: ${subject}
            - Kelas: ${grade}
            - TUJUAN AKHIR (Level 9): ${objective}

            Aturan Tingkat Kesulitan:
            - Level 1-2: Sangat Mudah (Pengenalan/Pemanasan).
            - Level 3-4: Mudah.
            - Level 5-6: Menengah.
            - Level 7-8: Sulit.
            - Level 9: PUNCAK (Harus menguji ketercapaian "${objective}").

            Output JSON Array dengan 9 objek. Format:
            [
                { "level": 1, "difficulty": "Mudah", "content": "..." },
                ...
                { "level": 9, "difficulty": "Puncak", "content": "..." }
            ]`;

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
                                level: { type: Type.NUMBER },
                                difficulty: { type: Type.STRING },
                                content: { type: Type.STRING }
                            },
                            required: ['level', 'content', 'difficulty']
                        }
                    },
                },
            });

            const generatedData = JSON.parse(response.text.trim()) as LevelTask[];
            const contentMap: LevelContent = {};
            
            // Fill 1-9
            for(let i=1; i<=9; i++) {
                const found = generatedData.find(d => d.level === i);
                contentMap[i] = found || { level: i, difficulty: 'N/A', content: 'Konten tidak tergenerate' };
            }

            setDraftLevels(contentMap);
            setStep('review'); // Pindah ke mode edit

        } catch (error) {
            console.error(error);
            alert("Gagal membuat konten AI. Cek API Key.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Step 2: Update Manual
    const handleUpdateLevelContent = (level: number, newContent: string) => {
        setDraftLevels(prev => ({
            ...prev,
            [level]: { ...prev[level], content: newContent }
        }));
    };

    // Step 3: Start Game
    const handleFinalizeGame = () => {
        const finalPlayers: Player[] = playerNames.map((name, index) => ({
            id: index,
            name,
            position: 1, 
            color: PLAYER_COLORS[index % PLAYER_COLORS.length],
        }));
        onStartGame(finalPlayers, draftLevels, activityType);
    };

    const hasCustomBg = !!visualSettings.containerBackground;
    const textColor = hasCustomBg ? 'text-white' : 'text-slate-800';
    const subTextColor = hasCustomBg ? 'text-slate-200' : 'text-slate-600';
    const inputClass = `w-full p-3 rounded border focus:ring-2 focus:ring-orange-500 ${hasCustomBg ? 'bg-slate-800/50 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-slate-300'}`;

    // --- RENDER STEP 1: INPUT ---
    if (step === 'input') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                 <div className={`w-full max-w-4xl rounded-2xl shadow-2xl p-8 border-2 space-y-6 ${hasCustomBg ? 'bg-black/40 border-white/20' : 'bg-stone-50 border-stone-200'}`} style={visualSettings.containerBackground ? { backgroundImage: `url(${visualSettings.containerBackground})`, backgroundSize: 'cover' } : {}}>
                    
                    <div className="relative text-center">
                        <button onClick={onBack} className={`absolute left-0 top-0 text-sm font-bold ${hasCustomBg ? 'text-sky-300' : 'text-sky-600'}`}>← Kembali</button>
                        <h1 className={`text-4xl font-bold font-poppins ${textColor}`}>Setup Level Up</h1>
                        <p className={subTextColor}>Taklukkan 9 Tingkat Tantangan!</p>
                    </div>
    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className={`text-xl font-bold border-b pb-2 ${textColor}`}>1. Konteks Pembelajaran</h3>
                            <input type="text" placeholder="Mata Pelajaran (Misal: IPA)" value={subject} onChange={e => setSubject(e.target.value)} className={inputClass} />
                            <input type="text" placeholder="Fase / Kelas (Misal: Kelas 4)" value={grade} onChange={e => setGrade(e.target.value)} className={inputClass} />
                            <textarea rows={3} placeholder="Tujuan Pembelajaran Akhir (Untuk Level 9)" value={objective} onChange={e => setObjective(e.target.value)} className={inputClass} />
                            
                            <div className="flex gap-4 pt-2">
                                 <label className={`flex items-center gap-2 cursor-pointer ${textColor}`}>
                                    <input type="radio" checked={activityType === 'cognitive'} onChange={() => setActivityType('cognitive')} className="w-5 h-5 text-orange-600" />
                                    <span>Kognitif (Soal)</span>
                                </label>
                                <label className={`flex items-center gap-2 cursor-pointer ${textColor}`}>
                                    <input type="radio" checked={activityType === 'psychomotor'} onChange={() => setActivityType('psychomotor')} className="w-5 h-5 text-orange-600" />
                                    <span>Psikomotor (Gerak)</span>
                                </label>
                            </div>
                        </div>
    
                        <div className="space-y-4">
                            <h3 className={`text-xl font-bold border-b pb-2 ${textColor}`}>2. Kelompok Peserta</h3>
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                {playerNames.map((name, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <div className={`w-10 h-10 rounded-full flex-shrink-0 ${PLAYER_COLORS[idx % PLAYER_COLORS.length]}`}></div>
                                        <input value={name} onChange={(e) => {
                                            const newNames = [...playerNames];
                                            newNames[idx] = e.target.value;
                                            setPlayerNames(newNames);
                                        }} className={inputClass} />
                                        <button onClick={() => setPlayerNames(playerNames.filter((_, i) => i !== idx))} className="text-red-500 font-bold px-2">✕</button>
                                    </div>
                                ))}
                            </div>
                            {playerNames.length < 8 && (
                                <button onClick={handleAddPlayer} className={`w-full py-2 border-2 border-dashed rounded font-bold ${hasCustomBg ? 'border-slate-400 text-slate-300 hover:bg-white/10' : 'border-slate-400 text-slate-500 hover:bg-slate-100'}`}>+ Tambah Kelompok</button>
                            )}
                        </div>
                    </div>
    
                    <div className="pt-4 border-t border-slate-400/30">
                        <button 
                            onClick={handleGenerate} 
                            disabled={isGenerating}
                            className="w-full bg-orange-600 text-white text-xl font-bold py-4 rounded-xl shadow-lg hover:bg-orange-700 disabled:bg-slate-500 transition-all transform hover:scale-105"
                        >
                            {isGenerating ? 'Sedang Meracik Level...' : 'Buat Konten & Review'}
                        </button>
                    </div>
                 </div>
            </div>
        );
    }

    // --- RENDER STEP 2: REVIEW ---
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className={`w-full max-w-6xl h-[90vh] flex flex-col rounded-2xl shadow-2xl p-6 border-2 ${hasCustomBg ? 'bg-black/80 border-white/20' : 'bg-stone-50 border-stone-200'}`}>
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className={`text-3xl font-bold font-poppins ${textColor}`}>Review & Edit Level</h2>
                    <button onClick={() => setStep('input')} className="text-sm text-red-400 hover:text-red-500 underline">Ubah Pengaturan Awal</button>
                </div>

                <div className="flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-2 pb-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((levelNum) => {
                        const data = draftLevels[levelNum];
                        return (
                            <div key={levelNum} className={`p-4 rounded-lg border-2 flex flex-col ${hasCustomBg ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}>
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-orange-500">Level {levelNum}</span>
                                    <span className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-700">{data?.difficulty}</span>
                                </div>
                                <textarea 
                                    value={data?.content || ''}
                                    onChange={(e) => handleUpdateLevelContent(levelNum, e.target.value)}
                                    className={`flex-grow w-full p-2 text-sm rounded border resize-none focus:ring-2 focus:ring-orange-500 ${hasCustomBg ? 'bg-slate-900 text-white border-slate-700' : 'bg-slate-50 text-slate-800 border-slate-300'}`}
                                    rows={4}
                                />
                            </div>
                        )
                    })}
                </div>

                <div className="pt-4 mt-auto border-t border-slate-500/30 flex gap-4">
                    <button onClick={() => setStep('input')} className="flex-1 py-3 bg-slate-500 text-white rounded-lg font-bold hover:bg-slate-600">
                        Batal
                    </button>
                    <button onClick={handleFinalizeGame} className="flex-[3] py-3 bg-emerald-600 text-white text-xl rounded-lg font-bold hover:bg-emerald-700 shadow-lg transform transition hover:scale-105">
                        Mulai Petualangan! 🚀
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN GAME COMPONENT ---

interface LevelUpGameProps {
    visualSettings: VisualSettings;
    onBackToMenu: () => void;
}

export const LevelUpGame: React.FC<LevelUpGameProps> = ({ visualSettings, onBackToMenu }) => {
    const [stage, setStage] = useState<GameStage>(GameStage.Setup);
    const [players, setPlayers] = useState<Player[]>([]);
    const [levels, setLevels] = useState<LevelContent>({});
    const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
    const [modalTask, setModalTask] = useState<LevelTask | null>(null);
    const [winner, setWinner] = useState<Player | null>(null);

    const handleStart = (newPlayers: Player[], newLevels: LevelContent) => {
        setPlayers(newPlayers);
        setLevels(newLevels);
        setStage(GameStage.Playing);
    };

    const handleGroupClick = (index: number) => {
        const player = players[index];
        // Jika sudah menang (seharusnya tidak mungkin diklik jika UI dilock), return
        if (player.position > 9) return;
        
        setActiveGroupIndex(index);
        setModalTask(levels[player.position]);
    };

    const handleValidation = (passed: boolean) => {
        if (activeGroupIndex === null) return;
        
        if (passed) {
            setPlayers(prev => {
                const newPlayers = [...prev];
                const player = newPlayers[activeGroupIndex];
                
                // Jika player ada di level 9 dan lulus, dia menang.
                if (player.position === 9) {
                    setWinner(player);
                    setTimeout(() => setStage(GameStage.Finished), 500);
                } else {
                    player.position += 1; // Naik Level
                }
                return newPlayers;
            });
        }
        setModalTask(null);
        setActiveGroupIndex(null);
    };

    if (stage === GameStage.Setup) {
        return <LevelUpSetup onStartGame={handleStart} visualSettings={visualSettings} onBack={onBackToMenu} />;
    }

    if (stage === GameStage.Finished && winner) {
        return <VictoryScreen winner={winner} onNewGame={onBackToMenu} onResetGame={() => setStage(GameStage.Setup)} />;
    }

    const hasCustomBg = !!visualSettings.containerBackground;
    const bgClass = hasCustomBg ? 'bg-black/40 border-white/20 text-white' : 'bg-white border-slate-200 text-slate-800';

    return (
        <div className="min-h-screen p-2 sm:p-4 flex flex-col items-center">
            {/* Header */}
            <div className={`w-full max-w-6xl flex justify-between items-center mb-4 p-4 rounded-xl border-2 ${bgClass}`}>
                <h1 className="text-2xl sm:text-3xl font-bold font-poppins">Level Up Adventure</h1>
                <button onClick={onBackToMenu} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-bold text-sm">Keluar</button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl flex-grow h-full">
                
                {/* --- BOARD AREA --- */}
                <div className="flex-grow relative bg-slate-200/50 rounded-2xl border-4 border-slate-400 p-4 sm:p-8 flex items-center justify-center min-h-[500px]">
                    
                    {/* Container Board (Fixed Aspect Ratio) */}
                    <div className="relative w-full max-w-[500px] aspect-square">
                        
                        {/* SVG Connector Lines (The Road) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                             <defs>
                                <filter id="roadShadow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.3"/>
                                </filter>
                            </defs>
                            
                            {/* Base Road (Thick Line) */}
                            <path 
                                d="M 16.66 83.33 L 83.33 83.33 
                                   Q 98 83.33 98 66.66 Q 98 50 83.33 50
                                   L 16.66 50 
                                   Q 2 50 2 33.33 Q 2 16.66 16.66 16.66
                                   L 83.33 16.66"
                                stroke="#94a3b8" // slate-400
                                strokeWidth="26" 
                                fill="none" 
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                filter="url(#roadShadow)"
                            />
                            
                            {/* Inner Road (Lighter Line) */}
                            <path 
                                d="M 16.66 83.33 L 83.33 83.33 
                                   Q 98 83.33 98 66.66 Q 98 50 83.33 50
                                   L 16.66 50 
                                   Q 2 50 2 33.33 Q 2 16.66 16.66 16.66
                                   L 83.33 16.66"
                                stroke="#cbd5e1" // slate-300
                                strokeWidth="20" 
                                fill="none" 
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* Road Markings (Dashed Line) */}
                             <path 
                                d="M 16.66 83.33 L 83.33 83.33 
                                   Q 98 83.33 98 66.66 Q 98 50 83.33 50
                                   L 16.66 50 
                                   Q 2 50 2 33.33 Q 2 16.66 16.66 16.66
                                   L 83.33 16.66"
                                stroke="#f8fafc" // slate-50
                                strokeWidth="3" 
                                fill="none" 
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray="10 15"
                            />
                        </svg>

                        {/* Grid Nodes */}
                        <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-0 relative z-10">
                            {/* 
                                Kita mapping berdasarkan visual grid (atas kiri ke kanan, baris per baris)
                                Row 1: 7, 8, 9
                                Row 2: 4, 5, 6
                                Row 3: 1, 2, 3
                                Namun karena grid CSS render urut DOM, kita susun array manual.
                            */}
                            {/* Row 1 */}
                            {[7, 8, 9].map(lvl => <LevelNode key={lvl} level={lvl} players={players} levels={levels} />)}
                            {/* Row 2 - Urutan visual di layar 4, 5, 6 tapi logic S-shape kita handle di mapping SVG */}
                            {[6, 5, 4].reverse().map(lvl => <LevelNode key={lvl} level={lvl} players={players} levels={levels} />)}
                            {/* Row 3 */}
                            {[1, 2, 3].map(lvl => <LevelNode key={lvl} level={lvl} players={players} levels={levels} />)}
                        </div>
                    </div>
                </div>

                {/* --- CONTROLS AREA --- */}
                <div className={`w-full lg:w-96 flex-shrink-0 p-4 sm:p-6 rounded-2xl border-2 overflow-y-auto max-h-[80vh] ${bgClass}`}>
                    <h2 className="text-xl font-bold mb-4 text-center border-b pb-2">Kontrol Guru</h2>
                    <p className="mb-4 text-sm text-center opacity-80">Klik kelompok untuk memberi tantangan.</p>
                    
                    <div className="space-y-3">
                        {players.map((p, idx) => {
                            const isFinished = winner?.id === p.id; // Logic sederhana, jika ada winner, anggap game selesai
                            return (
                                <button 
                                    key={p.id}
                                    onClick={() => handleGroupClick(idx)}
                                    disabled={!!winner}
                                    className={`w-full flex items-center p-3 rounded-lg border-2 transition-transform hover:scale-105 ${isFinished ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-700/50 border-transparent hover:border-yellow-400'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full ${p.color} mr-3 border border-white`}></div>
                                    <div className="text-left flex-grow">
                                        <div className="font-bold text-white">{p.name}</div>
                                        <div className="text-xs text-slate-300">Level: {isFinished ? '🏆 SELESAI' : p.position}</div>
                                    </div>
                                    <div className="bg-white/20 px-3 py-1 rounded text-white font-bold text-sm">
                                        {isFinished ? 'Win' : 'Uji'}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Task Modal */}
            {modalTask && activeGroupIndex !== null && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl rounded-2xl p-8 border-4 border-yellow-400 relative animate-content-fade">
                        <div className="absolute -top-6 -left-6 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-white shadow-lg text-2xl font-bold text-yellow-900">
                            {modalTask.level}
                        </div>
                        
                        <h2 className="text-center text-3xl font-bold font-caveat text-slate-800 mb-2">
                            Tantangan {players[activeGroupIndex].name}
                        </h2>
                        <div className="text-center mb-6">
                            <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
                                Tingkat: {modalTask.difficulty}
                            </span>
                        </div>

                        <div className="bg-yellow-50 p-6 rounded-xl border-2 border-yellow-200 mb-8 min-h-[150px] flex items-center justify-center text-center overflow-y-auto max-h-[40vh]">
                            <p className="text-xl sm:text-2xl font-medium text-slate-800 whitespace-pre-wrap">{modalTask.content}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => handleValidation(false)}
                                className="bg-red-100 text-red-700 font-bold py-4 rounded-xl hover:bg-red-200 transition-colors border-2 border-red-200"
                            >
                                ❌ Belum
                                <span className="block text-xs font-normal opacity-70 mt-1">Tetap di Level {modalTask.level}</span>
                            </button>
                            <button 
                                onClick={() => handleValidation(true)}
                                className="bg-emerald-500 text-white font-bold py-4 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg border-2 border-emerald-400 transform hover:scale-105"
                            >
                                {modalTask.level === 9 ? '🏆 JUARA!' : '✅ LULUS!'}
                                <span className="block text-xs font-normal opacity-90 mt-1">{modalTask.level === 9 ? 'Menangkan Game' : `Naik ke Level ${modalTask.level + 1}`}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- SUB COMPONENT FOR NODE ---
const LevelNode: React.FC<{ level: number, players: Player[], levels: LevelContent }> = ({ level, players, levels }) => {
    const isBoss = level === 9;
    const playersHere = players.filter(p => p.position === level);

    return (
        <div className="relative flex items-center justify-center w-full h-full">
            {/* Circle Node */}
            <div 
                className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full border-4 flex flex-col items-center justify-center shadow-xl z-10 transition-transform hover:scale-110
                    ${isBoss ? 'bg-gradient-to-br from-yellow-300 to-orange-400 border-white ring-4 ring-orange-500/50' : 'bg-stone-100 border-stone-400'}
                `}
            >
                <span className={`text-2xl sm:text-4xl font-bold font-caveat ${isBoss ? 'text-red-900 drop-shadow-sm' : 'text-slate-600'}`}>
                    {isBoss ? '👑' : level}
                </span>
                {isBoss && <span className="text-[10px] font-bold text-red-900 uppercase tracking-widest -mt-1">Puncak</span>}
            </div>

            {/* Players on this level */}
            <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                {playersHere.map((p, i) => (
                    <div 
                        key={p.id} 
                        className={`absolute transform transition-all duration-500 hover:z-30 hover:scale-125`}
                        style={{ 
                            // Spread players slightly so they don't overlap perfectly
                            transform: `translate(${i * 12 - (playersHere.length-1)*6}px, ${i * -8}px)` 
                        }}
                    >
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-md ${p.color} flex items-center justify-center text-[10px] text-white font-bold`} title={p.name}>
                            {p.name.charAt(0)}
                        </div>
                    </div>
                ))}
            </div>
            
             {/* Difficulty Label (Optional, maybe too cluttered for mobile) */}
             {!isBoss && (
                 <div className="absolute bottom-2 text-[10px] text-slate-500 font-bold bg-white/60 px-1 rounded backdrop-blur-sm shadow-sm z-30">
                     {levels[level]?.difficulty}
                 </div>
             )}
        </div>
    );
}