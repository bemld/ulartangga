import React, { useState, useCallback } from 'react';
import { GameStage, Player, LevelContent, ActivityType, VisualSettings, LevelTask } from '../types';
import { PLAYER_COLORS } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";
import { VictoryScreen } from './VictoryScreen';
import { PlayerPawn } from './PlayerPawn';

// --- SETUP COMPONENT FOR LEVEL UP ---
interface LevelUpSetupProps {
    onStartGame: (players: Player[], content: LevelContent, type: ActivityType) => void;
    visualSettings: VisualSettings;
    onBack: () => void;
}

const LevelUpSetup: React.FC<LevelUpSetupProps> = ({ onStartGame, visualSettings, onBack }) => {
    const [subject, setSubject] = useState('');
    const [grade, setGrade] = useState('');
    const [objective, setObjective] = useState(''); // Tujuan Pembelajaran
    const [activityType, setActivityType] = useState<ActivityType>('cognitive');
    const [playerNames, setPlayerNames] = useState<string[]>(['Tim A', 'Tim B']);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleAddPlayer = () => {
        if (playerNames.length < PLAYER_COLORS.length) setPlayerNames([...playerNames, `Tim ${String.fromCharCode(65 + playerNames.length)}`]);
    };

    const handleGenerateAndStart = async () => {
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
            - Level 9: SANGAT SULIT / PUNCAK (Harus menguji ketercapaian "${objective}").

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
            
            // Convert array to map for easier access
            const contentMap: LevelContent = {};
            generatedData.forEach(task => {
                if (task.level >= 1 && task.level <= 9) {
                    contentMap[task.level] = task;
                }
            });

            // Create Players
            const finalPlayers: Player[] = playerNames.map((name, index) => ({
                id: index,
                name,
                position: 1, // Start at Level 1
                color: PLAYER_COLORS[index % PLAYER_COLORS.length],
            }));

            onStartGame(finalPlayers, contentMap, activityType);

        } catch (error) {
            console.error(error);
            alert("Gagal membuat konten AI. Cek koneksi atau API Key.");
        } finally {
            setIsGenerating(false);
        }
    };

    const hasCustomBg = !!visualSettings.containerBackground;
    const textColor = hasCustomBg ? 'text-white' : 'text-slate-800';
    const subTextColor = hasCustomBg ? 'text-slate-200' : 'text-slate-600';
    const inputClass = `w-full p-3 rounded border focus:ring-2 focus:ring-orange-500 ${hasCustomBg ? 'bg-slate-800/50 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-slate-300'}`;

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
             <div className={`w-full max-w-4xl rounded-2xl shadow-2xl p-8 border-2 space-y-6 ${hasCustomBg ? 'bg-black/40 border-white/20' : 'bg-stone-50 border-stone-200'}`} style={visualSettings.containerBackground ? { backgroundImage: `url(${visualSettings.containerBackground})`, backgroundSize: 'cover' } : {}}>
                
                <div className="relative text-center">
                    <button onClick={onBack} className={`absolute left-0 top-0 text-sm font-bold ${hasCustomBg ? 'text-sky-300' : 'text-sky-600'}`}>← Kembali</button>
                    <h1 className={`text-4xl font-bold font-poppins ${textColor}`}>Setup Level Up</h1>
                    <p className={subTextColor}>Taklukkan 9 Tingkat Tantangan!</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Input Konteks */}
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

                    {/* Input Tim */}
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
                        onClick={handleGenerateAndStart} 
                        disabled={isGenerating}
                        className="w-full bg-orange-600 text-white text-xl font-bold py-4 rounded-xl shadow-lg hover:bg-orange-700 disabled:bg-slate-500 transition-all transform hover:scale-105"
                    >
                        {isGenerating ? 'Sedang Meracik Level...' : 'Mulai Petualangan!'}
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
    const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null); // Guru memilih siapa yang dites
    const [modalTask, setModalTask] = useState<LevelTask | null>(null);
    const [winner, setWinner] = useState<Player | null>(null);

    const handleStart = (newPlayers: Player[], newLevels: LevelContent) => {
        setPlayers(newPlayers);
        setLevels(newLevels);
        setStage(GameStage.Playing);
    };

    const handleGroupClick = (index: number) => {
        const player = players[index];
        // Jika sudah menang (level > 9), abaikan
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
                player.position += 1; // Naik Level
                
                // Cek Win Condition (Menyelesaikan Level 9 berarti posisi jadi 10)
                if (player.position > 9) {
                    setWinner(player);
                    setTimeout(() => setStage(GameStage.Finished), 500);
                }
                return newPlayers;
            });
        }
        // Reset modal
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
        <div className="min-h-screen p-4 flex flex-col items-center">
            {/* Header */}
            <div className={`w-full max-w-6xl flex justify-between items-center mb-6 p-4 rounded-xl border-2 ${bgClass}`}>
                <h1 className="text-3xl font-bold font-poppins">Level Up Adventure</h1>
                <button onClick={onBackToMenu} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-bold">Keluar</button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl flex-grow">
                {/* Board Area (Left/Top) */}
                <div className="flex-grow relative bg-slate-200/50 rounded-2xl border-4 border-slate-400 p-8 min-h-[600px] flex items-center justify-center">
                    {/* S-Shape Grid Layout */}
                    <div className="relative w-full max-w-md aspect-[3/4] grid grid-cols-3 grid-rows-3 gap-8">
                        {/* 
                           Grid Mapping for S-Shape:
                           Row 1 (Top): 9 8 7
                           Row 2 (Mid): 4 5 6
                           Row 3 (Bot): 1 2 3
                        */}
                        {[9, 8, 7, 4, 5, 6, 1, 2, 3].map((levelNum) => {
                            const isBoss = levelNum === 9;
                            // Find players on this level
                            const playersHere = players.filter(p => p.position === levelNum);

                            return (
                                <div key={levelNum} className="relative flex items-center justify-center">
                                    {/* Level Node */}
                                    <div 
                                        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 flex items-center justify-center shadow-xl z-0
                                            ${isBoss ? 'bg-yellow-400 border-orange-600 animate-pulse' : 'bg-stone-100 border-stone-400'}
                                        `}
                                    >
                                        <span className={`text-2xl font-bold ${isBoss ? 'text-red-800' : 'text-slate-600'}`}>
                                            {isBoss ? '★' : levelNum}
                                        </span>
                                    </div>

                                    {/* Players on this level */}
                                    <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                                        {playersHere.map((p, i) => (
                                            <div 
                                                key={p.id} 
                                                className={`absolute transform transition-all duration-500`}
                                                style={{ 
                                                    transform: `translate(${i * 10 - (playersHere.length-1)*5}px, ${i * -10}px)` 
                                                }}
                                            >
                                                <div className={`w-8 h-8 rounded-full border-2 border-white shadow-md ${p.color}`} title={p.name}></div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Level Label */}
                                    <div className="absolute -bottom-6 text-xs font-bold bg-white/80 px-2 py-1 rounded">
                                        {levels[levelNum]?.difficulty}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* Connecting Lines (SVG Overlay) - Simple Visual Representation */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" style={{ zIndex: -1 }}>
                            {/* Line logic is complex to draw perfectly dynamically in grid, 
                                but essentially connects center of grid cells. 
                                For now, we rely on the visual layout.
                            */}
                        </svg>
                    </div>
                </div>

                {/* Controls Area (Right/Bottom) */}
                <div className={`w-full lg:w-96 flex-shrink-0 p-6 rounded-2xl border-2 ${bgClass}`}>
                    <h2 className="text-xl font-bold mb-4 text-center border-b pb-2">Kontrol Guru</h2>
                    <p className="mb-4 text-sm text-center opacity-80">Klik kelompok di bawah untuk memberikan tantangan.</p>
                    
                    <div className="space-y-3">
                        {players.map((p, idx) => (
                            <button 
                                key={p.id}
                                onClick={() => handleGroupClick(idx)}
                                className={`w-full flex items-center p-3 rounded-lg border-2 transition-transform hover:scale-105 ${p.position > 9 ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-700/50 border-transparent hover:border-yellow-400'}`}
                            >
                                <div className={`w-8 h-8 rounded-full ${p.color} mr-3 border border-white`}></div>
                                <div className="text-left flex-grow">
                                    <div className="font-bold text-white">{p.name}</div>
                                    <div className="text-xs text-slate-300">Level Saat Ini: {p.position > 9 ? '🏆 TAMAT' : p.position}</div>
                                </div>
                                <div className="bg-white/20 px-3 py-1 rounded text-white font-bold text-sm">
                                    {p.position > 9 ? 'Selesai' : 'Uji →'}
                                </div>
                            </button>
                        ))}
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

                        <div className="bg-yellow-50 p-6 rounded-xl border-2 border-yellow-200 mb-8 min-h-[150px] flex items-center justify-center text-center">
                            <p className="text-2xl font-medium text-slate-800">{modalTask.content}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => handleValidation(false)}
                                className="bg-red-100 text-red-700 font-bold py-4 rounded-xl hover:bg-red-200 transition-colors border-2 border-red-200"
                            >
                                ❌ Belum Berhasil
                                <span className="block text-xs font-normal opacity-70 mt-1">Tetap di Level {modalTask.level}</span>
                            </button>
                            <button 
                                onClick={() => handleValidation(true)}
                                className="bg-emerald-500 text-white font-bold py-4 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg border-2 border-emerald-400 transform hover:scale-105"
                            >
                                ✅ LULUS!
                                <span className="block text-xs font-normal opacity-90 mt-1">Naik ke Level {modalTask.level + 1}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};