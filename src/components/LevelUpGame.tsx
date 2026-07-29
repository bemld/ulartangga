import React, { useState, useEffect } from 'react';
import { GameStage, Player, LevelContent, ActivityType, VisualSettings, LevelTask, QuestionItem, ClassData, SavedActivity } from '../types';
import { PLAYER_COLORS } from '../constants';
import { Type } from "@google/genai";
import { generateAIContent } from '../services/aiService';
import { VictoryScreen } from './VictoryScreen';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { generateSmartGroups } from '../utils/grouping';
import { Shuffle, Star, FolderOpen, Save, Trash2, Award, Plus, Eye, EyeOff, Bot, CheckCircle2, XCircle, Sparkles, RefreshCw } from 'lucide-react';
import { PlayerPawn } from './PlayerPawn';

// --- TYPES INTERNAL ---
type SetupStep = 'input' | 'review';

// --- SETUP COMPONENT ---
interface LevelUpSetupProps {
    onStartGame: (players: Player[], content: LevelContent, type: ActivityType, customAwards: string[]) => void;
    visualSettings: VisualSettings;
    onBack: () => void;
}

const LevelUpSetup: React.FC<LevelUpSetupProps> = ({ onStartGame, visualSettings, onBack }) => {
    const { user } = useAuth();
    
    // State Input
    const [step, setStep] = useState<SetupStep>('input');
    const [subject, setSubject] = useState('');
    const [grade, setGrade] = useState('');
    const [objective, setObjective] = useState('');
    const [activityType, setActivityType] = useState<ActivityType>('cognitive');
    
    // Player State
    const [inputMode, setInputMode] = useState<'manual' | 'class'>('manual');
    const [playerNames, setPlayerNames] = useState<string[]>(['Tim A', 'Tim B']);
    const [pawnStyles, setPawnStyles] = useState<Record<number, 'car' | 'kid' | 'classic'>>({});
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [groupCount, setGroupCount] = useState(4);

    // Custom Award Categories State
    const [customAwards, setCustomAwards] = useState<string[]>([
        "Kelompok Paling Sportif", 
        "Kelompok Paling Kompak", 
        "Kelompok Paling Kreatif", 
        "Kelompok Paling Aktif"
    ]);
    const [newAwardInput, setNewAwardInput] = useState('');

    // State Processing
    const [isGenerating, setIsGenerating] = useState(false);
    const [draftLevels, setDraftLevels] = useState<LevelContent>({});

    // Load Classes & Saved Presets State & Handlers
    const [savedActivities, setSavedActivities] = useState<SavedActivity[]>([]);
    const [presetTitle, setPresetTitle] = useState('');
    const [isSavingPreset, setIsSavingPreset] = useState(false);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'users', user.uid, 'classes'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassData)));
        }, (error) => {
            console.error("Firestore classes load error:", error);
        });
        return unsubscribe;
    }, [user]);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'users', user.uid, 'savedActivities'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedActivity));
            setSavedActivities(list.filter(item => item.type === 'level-up'));
        }, (error) => {
            console.error("Firestore presets load error:", error);
        });
        return unsubscribe;
    }, [user]);

    const handleSavePreset = async () => {
        if (!user) {
            alert("Harap login terlebih dahulu.");
            return;
        }
        if (!presetTitle.trim()) {
            alert("Harap masukkan nama/judul preset ini.");
            return;
        }
        if (Object.keys(draftLevels).length === 0) {
            alert("Belum ada konten level untuk disimpan. Silakan buat/generate konten terlebih dahulu.");
            return;
        }
        setIsSavingPreset(true);
        try {
            await addDoc(collection(db, 'users', user.uid, 'savedActivities'), {
                title: presetTitle.trim(),
                subject,
                topic: objective,
                grade,
                type: 'level-up',
                activityType,
                levelContent: draftLevels,
                customAwards,
                createdAt: serverTimestamp()
            });
            setPresetTitle('');
            alert("Preset Level Up berhasil disimpan ke local cache dan cloud!");
        } catch (error) {
            console.error("Gagal menyimpan preset:", error);
            alert("Gagal menyimpan preset.");
        } finally {
            setIsSavingPreset(false);
        }
    };

    const handleLoadPreset = (presetId: string) => {
        const found = savedActivities.find(p => p.id === presetId);
        if (!found) return;

        setSubject(found.subject || '');
        setObjective(found.topic || '');
        setGrade(found.grade || '');
        setActivityType(found.activityType || 'cognitive');
        if (found.levelContent) {
            setDraftLevels(found.levelContent);
            setStep('review'); // instantly go to review mode to show loaded content
        }
        if (found.customAwards && found.customAwards.length > 0) {
            setCustomAwards(found.customAwards);
        }
        alert(`Berhasil memuat preset "${found.title}"!`);
    };

    const handleDeletePreset = async (presetId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user || !window.confirm("Hapus preset ini?")) return;
        try {
            await deleteDoc(doc(db, 'users', user.uid, 'savedActivities', presetId));
        } catch (error) {
            console.error("Gagal menghapus preset:", error);
            alert("Gagal menghapus preset.");
        }
    };

    const handleAutoGroup = () => {
        const cls = classes.find(c => c.id === selectedClassId);
        if (!cls || cls.students.length === 0) {
            alert("Pilih kelas yang memiliki siswa.");
            return;
        }
        
        const groups = generateSmartGroups(cls.students, groupCount);
        const names = groups.map(g => g.name); 
        setPlayerNames(names);
        alert(`Berhasil membagi ${cls.students.length} siswa menjadi ${groups.length} kelompok.`);
    };

    const handleAddPlayer = () => {
        if (playerNames.length < PLAYER_COLORS.length) setPlayerNames([...playerNames, `Tim ${String.fromCharCode(65 + playerNames.length)}`]);
    };

    // Step 1: Generate Content with Multiple Questions & Answer Keys per Level
    const handleGenerate = async () => {
        if (!subject || !grade || !objective) {
            alert("Mohon lengkapi Mata Pelajaran, Kelas, dan Tujuan Pembelajaran.");
            return;
        }

        setIsGenerating(true);
        try {
            const promptContext = activityType === 'cognitive' 
                ? "Pertanyaan Kuis/Soal (Kognitif)" 
                : "Tantangan Fisik/Praktik (Psikomotor)";

            const qCount = Math.max(playerNames.length, 5);

            const prompt = `Anda adalah desainer game edukasi bertingkat interaktif.
Buatlah 9 level ${promptContext} untuk permainan "Level Up".
Di SETIAP LEVEL (Level 1 sampai 9), buatlah tepat ${qCount} buah kartu pertanyaan tantangan yang BERBEDA untuk dikocok bagi kelompok siswa, LENGKAP DENGAN KUNCI JAWABAN masing-masing untuk koreksi AI.

Konteks Pembelajaran:
- Mata Pelajaran: ${subject}
- Kelas/Fase: ${grade}
- TUJUAN AKHIR (Level 9): ${objective}

Tingkat Kesulitan:
- Level 1-2: Sangat Mudah (Pengenalan/Pemanasan).
- Level 3-4: Mudah.
- Level 5-6: Menengah.
- Level 7-8: Sulit.
- Level 9: PUNCAK (Menguji ketercapaian "${objective}").

Output HARUS dalam format JSON Array berisikan 9 objek level (level 1-9).
Format JSON:
[
  {
    "level": 1,
    "difficulty": "Sangat Mudah",
    "questions": [
      { "id": "l1_q1", "question": "Pertanyaan 1...", "answerKey": "Kunci jawaban acuan 1..." },
      { "id": "l1_q2", "question": "Pertanyaan 2...", "answerKey": "Kunci jawaban acuan 2..." }
    ]
  },
  ...
]`;

            const jsonText = await generateAIContent({
                prompt,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            level: { type: Type.NUMBER },
                            difficulty: { type: Type.STRING },
                            questions: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        question: { type: Type.STRING },
                                        answerKey: { type: Type.STRING }
                                    },
                                    required: ['question', 'answerKey']
                                }
                            }
                        },
                        required: ['level', 'difficulty', 'questions']
                    }
                },
            });

            const generatedData = JSON.parse(jsonText.trim()) as any[];
            const contentMap: LevelContent = {};
            
            // Fill 1-9
            for (let i = 1; i <= 9; i++) {
                const found = generatedData.find(d => d.level === i);
                if (found && Array.isArray(found.questions) && found.questions.length > 0) {
                    contentMap[i] = {
                        level: i,
                        difficulty: found.difficulty || 'Normal',
                        questions: found.questions.map((q: any, idx: number) => ({
                            id: q.id || `l${i}_q${idx + 1}_${Date.now()}`,
                            question: q.question || '',
                            answerKey: q.answerKey || ''
                        }))
                    };
                } else {
                    contentMap[i] = { 
                        level: i, 
                        difficulty: 'Normal', 
                        questions: [
                            { id: `l${i}_q1`, question: `Soal Tantangan Level ${i}`, answerKey: 'Kunci jawaban dasar.' }
                        ] 
                    };
                }
            }

            setDraftLevels(contentMap);
            setStep('review'); // Go to review & edit screen

        } catch (error) {
            console.error("Generate content error:", error);
            alert("Gagal membuat konten AI. Mohon periksa API Key atau koneksi internet.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Step 2: Update Manual Question / Answer Key
    const handleUpdateQuestion = (level: number, qIndex: number, field: 'question' | 'answerKey', value: string) => {
        setDraftLevels(prev => {
            const levelData = prev[level] || { level, difficulty: 'Normal', questions: [] };
            const questions = [...(levelData.questions || [])];
            if (!questions[qIndex]) {
                questions[qIndex] = { id: `q_${Date.now()}_${qIndex}`, question: '', answerKey: '' };
            }
            questions[qIndex] = { ...questions[qIndex], [field]: value };
            return {
                ...prev,
                [level]: { ...levelData, questions }
            };
        });
    };

    const handleAddQuestionToLevel = (level: number) => {
        setDraftLevels(prev => {
            const levelData = prev[level] || { level, difficulty: 'Normal', questions: [] };
            const questions = [...(levelData.questions || [])];
            questions.push({
                id: `q_${Date.now()}_${questions.length + 1}`,
                question: `Pertanyaan Tantangan ${questions.length + 1}`,
                answerKey: `Kunci jawaban singkat`
            });
            return {
                ...prev,
                [level]: { ...levelData, questions }
            };
        });
    };

    const handleRemoveQuestionFromLevel = (level: number, qIndex: number) => {
        setDraftLevels(prev => {
            const levelData = prev[level];
            if (!levelData || !levelData.questions) return prev;
            const questions = levelData.questions.filter((_, idx) => idx !== qIndex);
            return {
                ...prev,
                [level]: { ...levelData, questions }
            };
        });
    };

    // Step 3: Start Game
    const handleFinalizeGame = () => {
        const finalPlayers: Player[] = playerNames.map((name, index) => ({
            id: index,
            name,
            position: 1, 
            color: PLAYER_COLORS[index % PLAYER_COLORS.length],
            stars: 0,
            pawnStyle: pawnStyles[index] || (index % 3 === 0 ? 'car' : index % 3 === 1 ? 'kid' : 'classic')
        }));
        onStartGame(finalPlayers, draftLevels, activityType, customAwards);
    };

    const hasCustomBg = !!visualSettings.containerBackground;
    const textColor = hasCustomBg ? 'text-amber-300 font-bold' : 'text-slate-800 font-bold';
    const subTextColor = hasCustomBg ? 'text-slate-200' : 'text-slate-600';
    const inputClass = `w-full p-3 rounded border focus:ring-2 focus:ring-orange-500 font-medium text-sm ${hasCustomBg ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'}`;

    // --- RENDER STEP 1: INPUT ---
    if (step === 'input') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 py-8">
                 <div className={`w-full max-w-4xl rounded-2xl shadow-2xl p-6 sm:p-8 border-2 space-y-6 ${hasCustomBg ? 'bg-slate-950/95 backdrop-blur-md border-slate-700/90 text-white shadow-black/80' : 'bg-stone-50 border-stone-200'}`} style={visualSettings.containerBackground ? { backgroundImage: `url(${visualSettings.containerBackground})`, backgroundSize: 'cover' } : {}}>
                    
                    <div className={`relative text-center p-5 rounded-2xl border ${hasCustomBg ? 'bg-slate-900/95 border-slate-700/90 shadow-xl text-white' : ''}`}>
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onBack();
                            }} 
                            className={`absolute left-4 top-4 z-40 flex items-center gap-1.5 text-sm font-black transition-all px-4 py-2 rounded-xl shadow-lg cursor-pointer hover:scale-105 ${
                                hasCustomBg 
                                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-2 border-amber-300 shadow-black/50' 
                                    : 'bg-sky-700 hover:bg-sky-800 text-white border-2 border-sky-600 shadow-sky-900/20'
                            }`}
                        >
                            ← Kembali ke Menu
                        </button>
                        <h1 className={`text-4xl font-extrabold font-poppins ${hasCustomBg ? 'text-amber-300' : 'text-slate-800'}`}>Setup Level Up</h1>
                        <p className={`mt-1 text-sm font-bold ${hasCustomBg ? 'text-slate-200' : 'text-slate-600'}`}>Taklukkan 9 Tingkat Tantangan Berbasis AI!</p>
                    </div>
    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className={`p-5 rounded-2xl border space-y-4 ${hasCustomBg ? 'bg-slate-900/95 border-slate-700/90 shadow-xl text-white' : 'bg-stone-100/60 border-stone-200'}`}>
                            <h3 className={`text-xl font-bold border-b pb-2 ${hasCustomBg ? 'text-amber-300 border-slate-700' : 'text-slate-800 border-stone-300'}`}>1. Konteks Pembelajaran</h3>
                            <input type="text" placeholder="Mata Pelajaran (Misal: IPA)" value={subject} onChange={e => setSubject(e.target.value)} className={inputClass} />
                            <input type="text" placeholder="Fase / Kelas (Misal: Kelas 4)" value={grade} onChange={e => setGrade(e.target.value)} className={inputClass} />
                            <textarea rows={3} placeholder="Tujuan Pembelajaran Akhir (Untuk Level 9)" value={objective} onChange={e => setObjective(e.target.value)} className={inputClass} />
                            
                            <div className="flex gap-3 pt-2 flex-wrap">
                                 <label className={`flex items-center gap-2 cursor-pointer px-3.5 py-2 rounded-xl border transition-all ${hasCustomBg ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-stone-300 text-slate-800'}`}>
                                    <input type="radio" checked={activityType === 'cognitive'} onChange={() => setActivityType('cognitive')} className="w-4 h-4 text-orange-600" />
                                    <span className="font-bold text-sm">Kognitif (Soal)</span>
                                </label>
                                <label className={`flex items-center gap-2 cursor-pointer px-3.5 py-2 rounded-xl border transition-all ${hasCustomBg ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-stone-300 text-slate-800'}`}>
                                    <input type="radio" checked={activityType === 'psychomotor'} onChange={() => setActivityType('psychomotor')} className="w-4 h-4 text-orange-600" />
                                    <span className="font-bold text-sm">Psikomotor (Gerak)</span>
                                </label>
                            </div>

                            {/* Saved Presets Load Panel */}
                            {savedActivities.length > 0 && (
                                <div className={`pt-4 border-t ${hasCustomBg ? 'border-slate-700' : 'border-stone-200'} space-y-2`}>
                                    <label className={`text-sm font-bold flex items-center gap-2 ${hasCustomBg ? 'text-sky-300' : 'text-sky-750'}`}>
                                        <FolderOpen size={16} /> Gunakan Preset Tersimpan (Offline):
                                    </label>
                                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                                        {savedActivities.map(p => (
                                            <div 
                                                key={p.id}
                                                onClick={() => handleLoadPreset(p.id)}
                                                className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all hover:scale-105 ${hasCustomBg ? 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700' : 'bg-white border-stone-200 text-slate-700 hover:bg-stone-50 hover:border-orange-300'}`}
                                            >
                                                <span className="truncate max-w-[155px]">{p.title} <span className="text-[10px] opacity-75">({p.subject})</span></span>
                                                <button 
                                                    type="button"
                                                    onClick={(e) => handleDeletePreset(p.id, e)}
                                                    className="text-red-400 hover:text-red-500 opacity-80 group-hover:opacity-100 transition-opacity p-0.5 ml-1"
                                                    title="Hapus Preset"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
    
                        <div className={`p-5 rounded-2xl border space-y-4 ${hasCustomBg ? 'bg-slate-900/95 border-slate-700/90 shadow-xl text-white' : 'bg-stone-100/60 border-stone-200'}`}>
                            <h3 className={`text-xl font-bold border-b pb-2 ${hasCustomBg ? 'text-amber-300 border-slate-700' : 'text-slate-800 border-stone-300'}`}>2. Kelompok Peserta</h3>
                            
                            <div className="flex gap-2 mb-2 bg-slate-800/80 p-1 rounded-xl w-fit border border-slate-700">
                                <button 
                                    type="button"
                                    onClick={() => setInputMode('manual')}
                                    className={`px-3.5 py-1 text-sm font-bold rounded-lg transition-colors ${inputMode === 'manual' ? 'bg-orange-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
                                >
                                    Manual
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setInputMode('class')}
                                    className={`px-3.5 py-1 text-sm font-bold rounded-lg transition-colors ${inputMode === 'class' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
                                >
                                    Dari Kelas
                                </button>
                            </div>

                            {inputMode === 'class' ? (
                                <div className={`p-4 rounded-xl border-2 border-emerald-400/50 ${hasCustomBg ? 'bg-emerald-950/40' : 'bg-emerald-50'}`}>
                                    <select 
                                        value={selectedClassId} 
                                        onChange={e => setSelectedClassId(e.target.value)}
                                        className={`w-full p-2.5 rounded-lg mb-3 text-sm font-bold ${hasCustomBg ? 'bg-slate-800 text-white border-slate-600 border' : 'bg-white border-slate-300 border'}`}
                                    >
                                        <option value="">-- Pilih Kelas --</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.students.length} Siswa)</option>)}
                                    </select>

                                    <input 
                                        type="number" 
                                        min={2} 
                                        max={8} 
                                        placeholder="Jumlah Kelompok"
                                        value={groupCount}
                                        onChange={e => setGroupCount(parseInt(e.target.value))}
                                        className={`w-full p-2.5 rounded-lg mb-3 text-sm font-bold ${hasCustomBg ? 'bg-slate-800 text-white border-slate-600 border' : 'bg-white border-slate-300 border'}`}
                                    />
                                    
                                    <button type="button" onClick={handleAutoGroup} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow">
                                        <Shuffle size={16} />
                                        Buat Kelompok
                                    </button>
                                </div>
                            ) : (
                                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                                    {playerNames.map((name, idx) => {
                                        const currentStyle = pawnStyles[idx] || (idx % 3 === 0 ? 'car' : idx % 3 === 1 ? 'kid' : 'classic');
                                        return (
                                            <div key={idx} className={`p-3 rounded-xl border transition-colors ${hasCustomBg ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-stone-200 shadow-sm'}`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`w-4 h-4 rounded-full flex-shrink-0 ${PLAYER_COLORS[idx % PLAYER_COLORS.length]}`}></span>
                                                    <input
                                                        type="text"
                                                        value={name}
                                                        onChange={(e) => {
                                                            const newNames = [...playerNames];
                                                            newNames[idx] = e.target.value;
                                                            setPlayerNames(newNames);
                                                        }}
                                                        className={`flex-grow p-1.5 py-1 text-sm rounded font-medium focus:ring-1 focus:ring-orange-500 border ${hasCustomBg ? 'bg-slate-900 border-slate-600 text-white' : 'bg-stone-50 border-stone-200 text-slate-800'}`}
                                                        placeholder="Nama Kelompok"
                                                    />
                                                    <button type="button" onClick={() => setPlayerNames(playerNames.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-500 p-1 font-bold text-xs" title="Hapus">✕</button>
                                                </div>
                                                <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
                                                    <span className={`text-[11px] font-bold ${hasCustomBg ? 'text-slate-300' : 'text-slate-500'}`}>Model Pion:</span>
                                                    <div className="flex gap-1.5">
                                                        {[
                                                            { label: '👦 Anak', value: 'kid' },
                                                            { label: '🚗 Mobil', value: 'car' },
                                                            { label: '♟️ Klasik', value: 'classic' }
                                                        ].map(item => (
                                                            <button
                                                                key={item.value}
                                                                type="button"
                                                                onClick={() => setPawnStyles({ ...pawnStyles, [idx]: item.value as any })}
                                                                className={`text-[10px] px-2 py-1 rounded-md transition-all font-bold ${
                                                                    currentStyle === item.value 
                                                                        ? 'bg-orange-600 text-white scale-105 shadow' 
                                                                        : (hasCustomBg ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-stone-100 text-slate-600 hover:bg-stone-200')
                                                                }`}
                                                            >
                                                                {item.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                     {playerNames.length < 8 && (
                                        <button type="button" onClick={handleAddPlayer} className={`w-full py-2 border-2 border-dashed rounded-xl font-bold ${hasCustomBg ? 'border-amber-400/80 text-amber-300 bg-slate-800 hover:bg-slate-700' : 'border-slate-400 text-slate-600 hover:bg-slate-100'}`}>+ Tambah Kelompok</button>
                                    )}
                                </div>
                            )}

                            {/* Custom Awards list & editor */}
                            <div className={`p-4 rounded-xl border mt-4 ${hasCustomBg ? 'bg-slate-800 border-slate-600 text-white' : 'bg-orange-50/50 border-orange-200 shadow-sm'}`}>
                                <h4 className={`text-sm font-bold flex items-center gap-1.5 ${hasCustomBg ? 'text-amber-300' : 'text-slate-800'}`}>
                                    <Award className="text-amber-400" size={16} /> Regu Apresiasi & Karakter
                                </h4>
                                <p className={`text-[11px] mb-2 ${hasCustomBg ? 'text-slate-300' : 'text-slate-600'}`}>Guru dapat mengcustom kategori penghargaan di akhir game.</p>
                                
                                <div className="space-y-1.5 max-h-32 overflow-y-auto mb-2.5 pr-1 font-sans">
                                    {customAwards.map((award, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5">
                                            <Award size={12} className="text-amber-400 flex-shrink-0" />
                                            <input
                                                type="text"
                                                value={award}
                                                onChange={(e) => {
                                                    const updated = [...customAwards];
                                                    updated[idx] = e.target.value;
                                                    setCustomAwards(updated);
                                                }}
                                                className={`flex-grow p-1 text-xs rounded border ${hasCustomBg ? 'bg-slate-900 text-white border-slate-600' : 'bg-white border-slate-300 text-slate-800'}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setCustomAwards(customAwards.filter((_, i) => i !== idx))}
                                                className="text-red-400 hover:text-red-500 p-0.5 text-xs font-bold"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-1.5 font-sans">
                                    <input
                                        type="text"
                                        placeholder="Kategori baru..."
                                        value={newAwardInput}
                                        onChange={(e) => setNewAwardInput(e.target.value)}
                                        className={`flex-grow p-1.5 text-xs rounded border ${hasCustomBg ? 'bg-slate-900 text-white border-slate-600 placeholder-slate-400' : 'bg-white border-slate-300 text-slate-800'}`}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (newAwardInput.trim()) {
                                                    setCustomAwards([...customAwards, newAwardInput.trim()]);
                                                    setNewAwardInput('');
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (newAwardInput.trim()) {
                                                setCustomAwards([...customAwards, newAwardInput.trim()]);
                                                setNewAwardInput('');
                                            }
                                        }}
                                        className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-700 flex items-center gap-1 flex-shrink-0 shadow cursor-pointer"
                                    >
                                        <Plus size={12} /> Tambah
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
    
                    <div className="pt-4 border-t border-slate-400/30">
                        <button 
                            onClick={handleGenerate} 
                            disabled={isGenerating}
                            className="w-full bg-orange-600 text-white text-xl font-bold py-4 rounded-xl shadow-lg hover:bg-orange-700 disabled:bg-slate-500 transition-all transform hover:scale-105"
                        >
                            {isGenerating ? 'Sedang Meracik Soal & Kunci Jawaban...' : 'Buat Soal + Kunci Jawaban & Review'}
                        </button>
                    </div>
                 </div>
            </div>
        );
    }

    // --- RENDER STEP 2: REVIEW & EDIT SOAL + KUNCI JAWABAN ---
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className={`w-full max-w-6xl h-[90vh] flex flex-col rounded-2xl shadow-2xl p-6 border-2 ${hasCustomBg ? 'bg-black/80 border-white/20' : 'bg-stone-50 border-stone-200'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 border-b pb-3">
                    <div>
                        <h2 className={`text-3xl font-bold font-poppins ${textColor}`}>Review & Edit Soal + Kunci Jawaban</h2>
                        <p className="text-xs text-slate-400">Guru dapat mengubah/menambah soal dan kunci jawaban acuan AI sebelum memulai.</p>
                        <button onClick={() => setStep('input')} className="text-xs text-red-400 hover:text-red-500 underline mt-1">← Ubah Pengaturan Awal</button>
                    </div>

                    {/* Save Level Up Preset */}
                    {Object.keys(draftLevels).length > 0 && (
                        <div className="flex items-center gap-2 bg-slate-800/10 p-1.5 rounded-lg border border-slate-500/20">
                            <input
                                type="text"
                                placeholder="Nama preset... (e.g. Kuis IPA 4)"
                                value={presetTitle}
                                onChange={e => setPresetTitle(e.target.value)}
                                className={`px-2 py-1.5 text-xs rounded border w-44 ${hasCustomBg ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-800'}`}
                            />
                            <button
                                onClick={handleSavePreset}
                                disabled={isSavingPreset}
                                className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-all hover:scale-105 shadow"
                            >
                                <Save size={13} />
                                {isSavingPreset ? 'Simpan...' : 'Simpan Preset'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-2 pb-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((levelNum) => {
                        const levelData = draftLevels[levelNum];
                        const questions = levelData?.questions || (
                            levelData?.content 
                              ? [{ id: `q_${levelNum}_0`, question: levelData.content, answerKey: 'Sesuai konteks jawaban siswa.' }]
                              : [{ id: `q_${levelNum}_0`, question: `Soal Tantangan Level ${levelNum}`, answerKey: 'Kunci jawaban dasar.' }]
                        );

                        return (
                            <div key={levelNum} className={`p-4 rounded-xl border-2 flex flex-col space-y-3 ${hasCustomBg ? 'bg-slate-800/90 border-slate-600' : 'bg-white border-slate-200 shadow-sm'}`}>
                                <div className="flex justify-between items-center border-b pb-2 border-slate-300/30">
                                    <span className="font-extrabold text-orange-500 text-base">Level {levelNum}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">{levelData?.difficulty || 'Normal'}</span>
                                        <span className="text-[10px] font-semibold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">{questions.length} Kartu Soal</span>
                                    </div>
                                </div>

                                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                                    {questions.map((q, qIdx) => (
                                        <div key={q.id || qIdx} className={`p-2.5 rounded-lg border text-xs space-y-1.5 ${hasCustomBg ? 'bg-slate-900/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                                            <div className="flex items-center justify-between font-bold text-slate-500">
                                                <span className="text-orange-600">Kartu Soal #{qIdx + 1}</span>
                                                {questions.length > 1 && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleRemoveQuestionFromLevel(levelNum, qIdx)} 
                                                        className="text-red-400 hover:text-red-600 text-[10px] p-0.5 font-bold"
                                                        title="Hapus Kartu Ini"
                                                    >
                                                        ✕ Hapus
                                                    </button>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-sky-600 mb-0.5">
                                                    {activityType === 'psychomotor' ? '🤸 Tantangan Praktik Psikomotor:' : 'Soal / Tantangan:'}
                                                </label>
                                                <textarea
                                                    value={q.question}
                                                    onChange={(e) => handleUpdateQuestion(levelNum, qIdx, 'question', e.target.value)}
                                                    className={`w-full p-2 text-xs rounded border resize-none focus:ring-1 focus:ring-orange-500 ${hasCustomBg ? 'bg-slate-950 text-white border-slate-800' : 'bg-white text-slate-800 border-slate-300'}`}
                                                    rows={2}
                                                    placeholder={activityType === 'psychomotor' ? "Masukkan instruksi praktik/peragaan..." : "Masukkan pertanyaan..."}
                                                />
                                            </div>

                                            {activityType === 'cognitive' && (
                                                <div>
                                                    <label className="block text-[10px] font-bold text-emerald-600 mb-0.5">🔑 Kunci Jawaban (Acuan Koreksi AI):</label>
                                                    <textarea
                                                        value={q.answerKey}
                                                        onChange={(e) => handleUpdateQuestion(levelNum, qIdx, 'answerKey', e.target.value)}
                                                        className={`w-full p-2 text-xs rounded border resize-none focus:ring-1 focus:ring-emerald-500 ${hasCustomBg ? 'bg-slate-950 text-emerald-300 border-slate-800' : 'bg-emerald-50/60 text-emerald-900 border-emerald-300'}`}
                                                        rows={2}
                                                        placeholder="Masukkan kunci jawaban acuan AI..."
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleAddQuestionToLevel(levelNum)}
                                    className="w-full py-1.5 border border-dashed border-orange-400 text-orange-600 hover:bg-orange-50 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                >
                                    <Plus size={13} /> Tambah Kartu Soal
                                </button>
                            </div>
                        );
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
    const [activeQuestion, setActiveQuestion] = useState<QuestionItem | null>(null);
    
    // Interactive Student Answer & AI Evaluation States
    const [studentAnswer, setStudentAnswer] = useState<string>('');
    const [showAnswerKey, setShowAnswerKey] = useState<boolean>(false);
    const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
    const [aiEvaluation, setAiEvaluation] = useState<{ passed: boolean; score: number; feedback: string } | null>(null);
    
    const [winner, setWinner] = useState<Player | null>(null);
    const [characterStars, setCharacterStars] = useState<number>(0);
    const [customAwards, setCustomAwards] = useState<string[]>([]);
    const [activityType, setActivityType] = useState<ActivityType>('cognitive');

    const handleStart = (newPlayers: Player[], newLevels: LevelContent, type: ActivityType, awards: string[]) => {
        setPlayers(newPlayers);
        setLevels(newLevels);
        setCustomAwards(awards);
        setActivityType(type);
        setStage(GameStage.Playing);
    };

    const handleGroupClick = (index: number, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const player = players[index];
        if (!player || player.position > 9) return;
        
        const currentLevelTask = levels[player.position];
        const qPool = currentLevelTask?.questions && currentLevelTask.questions.length > 0
            ? currentLevelTask.questions
            : [{ id: 'q_legacy', question: currentLevelTask?.content || 'Tantangan Level', answerKey: 'Sesuai analisis guru' }];
        
        // Pick a random card from pool
        const randomCard = qPool[Math.floor(Math.random() * qPool.length)];

        // Atomic state updates to prevent glitching/flashing
        setActiveGroupIndex(index);
        setModalTask(currentLevelTask || { level: player.position, difficulty: 'Normal' });
        setActiveQuestion(randomCard);
        setStudentAnswer('');
        setShowAnswerKey(false);
        setAiEvaluation(null);
        setCharacterStars(0);
    };

    const handleReshuffleQuestion = () => {
        if (!modalTask) return;
        const qPool = modalTask.questions && modalTask.questions.length > 0
            ? modalTask.questions
            : [{ id: 'q_legacy', question: modalTask.content || 'Tantangan Level', answerKey: 'Sesuai analisis guru' }];
        
        if (qPool.length <= 1) {
            alert("Hanya ada 1 kartu soal pada level ini. Anda dapat menambah kartu soal di menu Review Soal.");
            return;
        }

        // Pick a different card than current activeQuestion
        const otherCards = qPool.filter(q => q.id !== activeQuestion?.id);
        const nextCard = otherCards[Math.floor(Math.random() * otherCards.length)] || qPool[0];

        setActiveQuestion(nextCard);
        setStudentAnswer('');
        setShowAnswerKey(false);
        setAiEvaluation(null);
    };

    const handleCloseModal = () => {
        setModalTask(null);
        setActiveQuestion(null);
        setActiveGroupIndex(null);
        setStudentAnswer('');
        setShowAnswerKey(false);
        setAiEvaluation(null);
        setCharacterStars(0);
    };

    const handleEvaluateAnswerWithAI = async () => {
        if (!studentAnswer.trim()) {
            alert("Harap ketikkan jawaban siswa/kelompok terlebih dahulu.");
            return;
        }
        if (!activeQuestion) return;

        if (!navigator.onLine) {
            setAiEvaluation({
                passed: true,
                score: 100,
                feedback: "⚡ Mode Offline Aktif: Evaluasi AI otomatis memerlukan jaringan internet. Kunci jawaban acuan di atas telah dibuka agar Guru dapat mengevaluasi jawaban siswa secara manual."
            });
            setShowAnswerKey(true);
            return;
        }

        setIsEvaluating(true);
        setAiEvaluation(null);

        try {
            const prompt = `Anda adalah penilai dan evaluator kuis edukasi interaktif ramah anak sekolah.
Tugas Anda: Evaluasi secara Cermat & Fleksibel apakah Jawaban Siswa secara LOGIKA & MAKNA sudah BENAR / MENDEKATI Kunci Jawaban.

Soal Tantangan:
"${activeQuestion.question}"

Kunci Jawaban Acuan:
"${activeQuestion.answerKey}"

Jawaban Siswa:
"${studentAnswer}"

Petunjuk Evaluasi:
1. Pahami inti/maksud dari Kunci Jawaban. Jawaban siswa tidak harus persis kata demi kata, cukup esensi logisnya benar.
2. Jika jawaban siswa secara logika benar, nyatakan LULUS ("passed": true, score 75-100).
3. Jika jawaban siswa masih salah, ngawur, atau tidak relevan, nyatakan BELUM LULUS ("passed": false, score 0-60).
4. Berikan "feedback" ramah (2-3 kalimat) dalam bahasa Indonesia, berikan penjelasan edukatif singkat kenapa benar atau bagian mana yang perlu diperbaiki.

Output HARUS JSON persis:
{
  "passed": true,
  "score": 85,
  "feedback": "Bagus sekali! Jawaban kelompok kamu sudah tepat..."
}`;

            const jsonRes = await generateAIContent({
                prompt,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        passed: { type: Type.BOOLEAN },
                        score: { type: Type.NUMBER },
                        feedback: { type: Type.STRING }
                    },
                    required: ['passed', 'score', 'feedback']
                }
            });

            const result = JSON.parse(jsonRes.trim());
            setAiEvaluation(result);
        } catch (err) {
            console.error("Gagal melakukan evaluasi AI:", err);
            setAiEvaluation({
                passed: true,
                score: 100,
                feedback: "⚡ Kendala Koneksi / AI: Jaringan terputus. Kunci jawaban acuan di atas telah dibuka agar Guru dapat menentukan kelulusan secara manual."
            });
            setShowAnswerKey(true);
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleValidation = (passed: boolean) => {
        if (activeGroupIndex === null) return;
        
        if (passed) {
            setPlayers(prev => {
                const newPlayers = [...prev];
                const player = newPlayers[activeGroupIndex];
                
                // Tambahkan Bintang (5 dari Tugas + Karakter)
                const starsEarned = 5 + characterStars;
                player.stars = (player.stars || 0) + starsEarned;

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
        setActiveQuestion(null);
        setActiveGroupIndex(null);
        setCharacterStars(0);
        setAiEvaluation(null);
    };

    if (stage === GameStage.Setup) {
        return <LevelUpSetup onStartGame={handleStart} visualSettings={visualSettings} onBack={onBackToMenu} />;
    }

    if (stage === GameStage.Finished && winner) {
        return <VictoryScreen winner={winner} players={players} customAwards={customAwards} onNewGame={onBackToMenu} onResetGame={() => setStage(GameStage.Setup)} />;
    }

    const hasCustomBg = !!visualSettings.containerBackground;
    const bgClass = hasCustomBg ? 'bg-black/40 border-white/20 text-white' : 'bg-white border-slate-200 text-slate-800';

    return (
        <div className="min-h-screen p-2 sm:p-4 flex flex-col items-center">
            {/* Header */}
            <div className="w-full max-w-7xl flex flex-wrap items-center justify-between bg-slate-900/90 backdrop-blur-md p-3 px-5 rounded-2xl border-2 border-slate-700/80 shadow-xl text-white gap-3 z-10 mb-4">
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (window.confirm('Apakah Anda yakin ingin kembali ke menu utama? Permainan saat ini akan berakhir.')) {
                            onBackToMenu();
                        }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white rounded-xl font-bold text-sm border border-slate-600 transition-all cursor-pointer shadow-md hover:scale-105 z-30"
                >
                    ← Kembali ke Menu Utama
                </button>
                <h1 className="text-xl sm:text-2xl font-extrabold font-poppins text-amber-300">Level Up Adventure</h1>
                <button
                    type="button"
                    onClick={() => {
                        if (window.confirm('Apakah Anda yakin ingin mengulang permainan dari awal?')) {
                            setStage(GameStage.Setup);
                        }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-sm transition-all cursor-pointer shadow-md hover:scale-105"
                >
                    ⚙️ Ulangi Pengaturan
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl flex-grow h-full">
                
                {/* --- BOARD AREA --- */}
                <div className="flex-grow relative bg-slate-200/50 rounded-2xl border-4 border-slate-400 p-4 sm:p-8 flex items-center justify-center min-h-[600px]">
                    
                    {/* Container Board */}
                    <div className="relative w-full max-w-3xl aspect-square">
                        
                        {/* SVG Connector Lines */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible" viewBox="0 0 300 300" preserveAspectRatio="none">
                             <defs>
                                <filter id="roadShadow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.5"/>
                                </filter>
                            </defs>
                            
                            <path 
                                d="M 50 250 L 250 250 
                                   C 300 250 300 150 250 150
                                   L 50 150
                                   C 0 150 0 50 50 50
                                   L 250 50"
                                stroke="#475569"
                                strokeWidth="50" 
                                fill="none" 
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                filter="url(#roadShadow)"
                            />

                             <path 
                                d="M 50 250 L 250 250 
                                   C 300 250 300 150 250 150
                                   L 50 150
                                   C 0 150 0 50 50 50
                                   L 250 50"
                                stroke="#64748b"
                                strokeWidth="44" 
                                fill="none" 
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                             <path 
                                d="M 50 250 L 250 250 
                                   C 300 250 300 150 250 150
                                   L 50 150
                                   C 0 150 0 50 50 50
                                   L 250 50"
                                stroke="#facc15"
                                strokeWidth="4" 
                                fill="none" 
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray="15 20"
                            />
                        </svg>

                        {/* Grid Nodes */}
                        <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-0 relative z-10">
                            {[7, 8, 9].map(lvl => <LevelNode key={lvl} level={lvl} players={players} levels={levels} />)}
                            {[6, 5, 4].map(lvl => <LevelNode key={lvl} level={lvl} players={players} levels={levels} />)}
                            {[1, 2, 3].map(lvl => <LevelNode key={lvl} level={lvl} players={players} levels={levels} />)}
                        </div>
                    </div>
                </div>

                {/* --- CONTROLS AREA --- */}
                <div className={`w-full lg:w-96 flex-shrink-0 p-4 sm:p-6 rounded-2xl border-2 overflow-y-auto max-h-[80vh] ${bgClass}`}>
                    <h2 className="text-xl font-bold mb-2 text-center border-b pb-2">Kontrol Guru</h2>
                    <p className="mb-4 text-xs text-center opacity-80">Klik tombol "Uji" pada kelompok untuk mengocok kartu soal & meminta AI mengoreksi jawaban.</p>
                    
                    <div className="space-y-3">
                        {players.map((p, idx) => {
                            const isFinished = winner?.id === p.id;
                            return (
                                <button 
                                    key={p.id}
                                    type="button"
                                    onClick={(e) => handleGroupClick(idx, e)}
                                    disabled={!!winner}
                                    className={`w-full flex items-center p-3 rounded-lg border-2 transition-transform hover:scale-105 ${isFinished ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-700/50 border-transparent hover:border-yellow-400'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full ${p.color} mr-3 border border-white flex-shrink-0`}></div>
                                    <div className="text-left flex-grow">
                                        <div className="font-bold text-white text-sm">{p.name}</div>
                                        <div className="flex justify-between items-center mt-1">
                                             <div className="text-xs text-slate-300">Level: {isFinished ? '🏆 SELESAI' : p.position}</div>
                                             <div className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded-full">
                                                 <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                                 <span className="text-xs font-bold text-yellow-100">{p.stars}</span>
                                             </div>
                                        </div>
                                    </div>
                                    <div className="ml-2 bg-white/20 px-3 py-1 rounded text-white font-bold text-xs">
                                        {isFinished ? 'Win' : 'Uji AI'}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* TASK MODAL WITH SHUFFLED CARD & AI CORRECTION */}
            {modalTask && activeGroupIndex !== null && activeQuestion && (
                <div 
                    className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto"
                    onClick={handleCloseModal}
                >
                    <div 
                        className="bg-white w-full max-w-2xl rounded-2xl p-6 sm:p-8 border-4 border-yellow-400 relative my-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button 
                            type="button"
                            onClick={handleCloseModal}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 font-bold text-lg w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                            title="Tutup Modal"
                        >
                            ✕
                        </button>

                        <div className="absolute -top-5 -left-5 w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-white shadow-lg text-2xl font-bold text-yellow-900">
                            {modalTask.level}
                        </div>
                        
                        <div className="text-center mb-4 pr-6">
                            <h2 className="text-2xl sm:text-3xl font-bold font-caveat text-slate-800">
                                Tantangan {players[activeGroupIndex].name} (Level {modalTask.level})
                            </h2>
                            <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
                                <span className="bg-slate-200 text-slate-700 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                                    Tingkat: {modalTask.difficulty}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleReshuffleQuestion}
                                    className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors border border-amber-300 shadow-sm"
                                    title="Kocok ulang kartu soal lain untuk level ini"
                                >
                                    <RefreshCw size={12} /> Kocok Soal Lain 🎲
                                </button>
                            </div>
                        </div>

                        {/* SHUFFLED QUESTION CARD */}
                        <div className="bg-gradient-to-b from-yellow-50 to-amber-50/80 p-5 rounded-2xl border-2 border-yellow-300 mb-4 shadow-inner text-center">
                            <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                                <Sparkles size={13} className="text-amber-500" />
                                {activityType === 'psychomotor' ? 'Aktivitas Praktik / Peragaan Psikomotor' : 'Kartu Soal Acak'}
                            </div>
                            <p className="text-lg sm:text-xl font-bold text-slate-800 whitespace-pre-wrap leading-snug">
                                {activeQuestion.question}
                            </p>
                        </div>

                        {/* COGNITIVE ONLY: TEACHER PEEK ANSWER KEY TOGGLE & STUDENT ANSWER INPUT */}
                        {activityType === 'cognitive' && (
                            <>
                                {/* TEACHER PEEK ANSWER KEY TOGGLE */}
                                <div className="mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAnswerKey(!showAnswerKey)}
                                        className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg border border-sky-200 transition-colors"
                                    >
                                        {showAnswerKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                        {showAnswerKey ? "Sembunyikan Kunci Jawaban" : "👁️ Intip Kunci Jawaban (Khusus Guru)"}
                                    </button>
                                    
                                    {showAnswerKey && (
                                        <div className="mt-2 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-left text-xs font-medium text-emerald-950 animate-fadeIn">
                                            <span className="font-bold text-emerald-800 block mb-0.5">🔑 Kunci Jawaban Acuan:</span>
                                            {activeQuestion.answerKey}
                                        </div>
                                    )}
                                </div>

                                {/* STUDENT ANSWER INPUT */}
                                <div className="mb-4 text-left">
                                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                                        ✍️ Ketik Jawaban / Hasil Diskusi Kelompok:
                                    </label>
                                    <textarea
                                        value={studentAnswer}
                                        onChange={(e) => setStudentAnswer(e.target.value)}
                                        placeholder="Ketik jawaban siswa di sini untuk dikoreksi AI..."
                                        rows={3}
                                        className="w-full p-3 rounded-xl border-2 border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-slate-800 font-medium text-sm resize-none"
                                    />
                                    
                                    <button
                                        type="button"
                                        onClick={handleEvaluateAnswerWithAI}
                                        disabled={isEvaluating || !studentAnswer.trim()}
                                        className="mt-2 w-full bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-700 hover:to-indigo-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50 text-sm"
                                    >
                                        <Bot className={isEvaluating ? "animate-spin text-amber-300" : "text-amber-300"} size={18} />
                                        {isEvaluating ? "AI Sedang Mengevaluasi Logika Jawaban..." : "🤖 Koreksi & Evaluasi Jawaban dengan AI"}
                                    </button>
                                </div>

                                {/* AI EVALUATION RESULT BANNER */}
                                {aiEvaluation && (
                                    <div className={`p-4 rounded-xl border-2 mb-4 text-left animate-fadeIn ${
                                        aiEvaluation.passed 
                                            ? 'bg-emerald-50 border-emerald-400 text-emerald-950' 
                                            : 'bg-amber-50 border-amber-400 text-amber-950'
                                    }`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2 font-black text-sm sm:text-base">
                                                {aiEvaluation.passed 
                                                    ? <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={20} />
                                                    : <XCircle className="text-amber-600 flex-shrink-0" size={20} />
                                                }
                                                <span>{aiEvaluation.passed ? "🎉 AI: LULUS! Logika Jawaban Benar" : "⚠️ AI: BELUM LULUS (Perlu Diperbaiki)"}</span>
                                            </div>
                                            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${aiEvaluation.passed ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'}`}>
                                                Skor: {aiEvaluation.score}/100
                                            </span>
                                        </div>
                                        <p className="text-xs font-medium leading-relaxed mt-1 opacity-95">{aiEvaluation.feedback}</p>
                                    </div>
                                )}
                            </>
                        )}
                        
                        {/* CHARACTER RATING SECTION */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-5 text-center">
                            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                Penilaian Karakter & Sikap Kelompok (Oleh Guru)
                            </h3>
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setCharacterStars(star)}
                                        className="transition-transform hover:scale-125 focus:outline-none"
                                    >
                                        <Star 
                                            size={28} 
                                            className={`${star <= characterStars ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'} transition-colors`} 
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">Pilih bintang (1-5) untuk memberikan nilai apresiasi karakter.</p>
                        </div>

                        {/* VALIDATION ACTION BUTTONS */}
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                type="button"
                                onClick={() => handleValidation(false)}
                                className="bg-red-100 text-red-700 font-bold py-3 px-2 rounded-xl hover:bg-red-200 transition-colors border-2 border-red-200 text-sm"
                            >
                                ❌ Belum Lulus
                                <span className="block text-[10px] font-normal opacity-80 mt-0.5">Tetap di Level {modalTask.level}</span>
                            </button>
                            <button 
                                type="button"
                                onClick={() => handleValidation(true)}
                                disabled={characterStars === 0}
                                className={`font-bold py-3 px-2 rounded-xl transition-all shadow-lg border-2 text-sm
                                    ${characterStars === 0 
                                        ? 'bg-slate-300 text-slate-500 border-slate-400 cursor-not-allowed' 
                                        : 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-500 hover:scale-[1.02]'
                                    }`}
                            >
                                {modalTask.level === 9 ? '🏆 JUARA!' : '✅ LULUS & NAIK LEVEL'}
                                <span className="block text-[10px] font-normal opacity-90 mt-0.5">
                                    {characterStars === 0 ? 'Beri Bintang Karakter Dulu' : `Dapat ${5 + characterStars} Bintang & Naik Level`}
                                </span>
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
                        className={`absolute transition-all duration-500`}
                        style={{ 
                            transform: `translate(${i * 14 - (playersHere.length-1)*7}px, -15px) scale(0.7)`,
                            width: '48px',
                            height: '60px'
                        }}
                    >
                        <PlayerPawn 
                            player={p}
                            position={{ x: 24, y: 30 }}
                            isActive={false}
                        />
                    </div>
                ))}
            </div>
            
             {!isBoss && (
                 <div className="absolute bottom-2 text-[10px] text-slate-700 font-bold bg-white/90 px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm z-30 border border-slate-300">
                     {levels[level]?.difficulty}
                 </div>
             )}
        </div>
    );
}
