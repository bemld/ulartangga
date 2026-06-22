import React, { useState, useEffect } from 'react';
import type { Player, SnakeOrLadder, BoardActivities, ActivityType, VisualSettings, ClassData, SavedActivity } from '../types';
import { BOARD_SIZE, PLAYER_COLORS } from '../constants';
import { generateAIContent } from '../services/aiService';
import { Type } from "@google/genai";
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { generateSmartGroups } from '../utils/grouping';
import { Users, Shuffle, FolderOpen, Save, Trash2, Award, Plus, Trophy } from 'lucide-react';

interface SetupScreenProps {
  onStartGame: (
    players: Player[],
    activities: BoardActivities,
    snakes: SnakeOrLadder[],
    ladders: SnakeOrLadder[],
    activityType: ActivityType,
    customAwards: string[]
  ) => void;
  visualSettings: VisualSettings;
  onBack: () => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartGame, visualSettings, onBack }) => {
  const { user } = useAuth();
  
  // Players State
  const [inputMode, setInputMode] = useState<'manual' | 'class'>('manual');
  const [playerNames, setPlayerNames] = useState<string[]>(['Kelompok 1', 'Kelompok 2']);
  const [pawnStyles, setPawnStyles] = useState<Record<number, 'car' | 'kid' | 'classic'>>({});
  
  // Class Mode State
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

  // Game Config State
  const [activities, setActivities] = useState<BoardActivities>({});
  const [snakes, setSnakes] = useState<SnakeOrLadder[]>([
    { start: 23, end: 5 }, 
    { start: 16, end: 8 }
  ]);
  const [ladders, setLadders] = useState<SnakeOrLadder[]>([{ start: 4, end: 14 }, { start: 11, end: 21 }]);
  
  // AI State
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('cognitive');
  const [isGeneratingActivities, setIsGeneratingActivities] = useState(false);

  // Saved Presets State
  const [savedActivities, setSavedActivities] = useState<SavedActivity[]>([]);
  const [presetTitle, setPresetTitle] = useState('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  // Load Classes
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'classes'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassData)));
    }, (error) => {
      console.error("Firestore loading classes error:", error);
    });
    return unsubscribe;
  }, [user]);

  // Load Saved Presets (Offline Capable)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'savedActivities'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedActivity));
      setSavedActivities(list.filter(item => item.type === 'snake-ladder'));
    }, (error) => {
      console.error("Firestore loading presets error:", error);
    });
    return unsubscribe;
  }, [user]);

  // Save Activities Preset Action (Durable & Offline)
  const handleSavePreset = async () => {
    if (!user) {
      alert("Harap masuk/login terlebih dahulu untuk menyimpan aktivitas.");
      return;
    }
    if (!presetTitle.trim()) {
      alert("Masukkan Judul/Nama aktivitas terlebih dahulu.");
      return;
    }
    if (Object.keys(activities).length === 0) {
      alert("Aktivitas masih kosong. Buat aktivitas dengan AI atau isi manual sebelum menyimpan.");
      return;
    }

    setIsSavingPreset(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'savedActivities'), {
        title: presetTitle.trim(),
        subject,
        topic,
        grade,
        type: 'snake-ladder',
        activityType,
        boardActivities: activities,
        customAwards,
        createdAt: serverTimestamp()
      });
      setPresetTitle('');
      alert("Aktivitas berhasil disimpan ke local cache & cloud!");
    } catch (error) {
      console.error("Gagal menyimpan preset:", error);
      alert("Gagal menyimpan preset.");
    } finally {
      setIsSavingPreset(false);
    }
  };

  // Load Preset Action
  const handleLoadPreset = (presetId: string) => {
    const found = savedActivities.find(p => p.id === presetId);
    if (!found) return;

    setSubject(found.subject || '');
    setTopic(found.topic || '');
    setGrade(found.grade || '');
    setActivityType(found.activityType || 'cognitive');
    if (found.boardActivities) {
      setActivities(found.boardActivities);
    }
    if (found.customAwards && found.customAwards.length > 0) {
      setCustomAwards(found.customAwards);
    }
    alert(`Berhasil memuat preset "${found.title}" secara offline!`);
  };

  // Delete Preset Action
  const handleDeletePreset = async (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (!window.confirm("Apakah Anda yakin ingin menghapus preset aktivitas ini?")) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'savedActivities', presetId));
    } catch (error) {
      console.error("Gagal menghapus preset:", error);
      alert("Gagal menghapus preset.");
    }
  };

  // Generate Groups Logic
  const handleAutoGroup = () => {
      const cls = classes.find(c => c.id === selectedClassId);
      if (!cls || cls.students.length === 0) {
          alert("Pilih kelas yang memiliki siswa.");
          return;
      }
      
      const groups = generateSmartGroups(cls.students, groupCount);
      // We only use the names for the game state, but we can store members in a separate way if needed
      // For now, SnakeLadder uses 'name' string.
      // We can format name as "Kelompok X" and maybe show details in tooltip?
      // Re-map to simple strings for this specific component state
      const names = groups.map(g => g.name); 
      setPlayerNames(names);
      alert(`Berhasil membagi ${cls.students.length} siswa menjadi ${groups.length} kelompok.`);
  };

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
        
        const jsonText = await generateAIContent({
            prompt,
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
        });
        
        const generatedItems: { square: number; activity: string }[] = JSON.parse(jsonText.trim());
        
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
      stars: 0,
      pawnStyle: pawnStyles[index] || (index % 3 === 0 ? 'car' : index % 3 === 1 ? 'kid' : 'classic')
    }));
    onStartGame(finalPlayers, activities, snakes, ladders, activityType, customAwards);
  };

  const containerStyle: React.CSSProperties = visualSettings.containerBackground
    ? {
        backgroundImage: `url(${visualSettings.containerBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white',
      }
    : {};

  const defaultClasses = "bg-stone-50";
  const hasCustomBg = !!visualSettings.containerBackground;
  const inputClass = `w-full p-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${hasCustomBg ? 'bg-slate-800/50 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-slate-300'}`;


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 pb-20">
      <div 
        className={`w-full max-w-5xl rounded-2xl shadow-2xl shadow-black/30 p-6 sm:p-8 space-y-8 border-2 ${hasCustomBg ? 'border-white/20' : 'border-stone-200'} ${!hasCustomBg ? defaultClasses : ''}`}
        style={containerStyle}
      >
        <div className="text-center relative">
          <button
            onClick={onBack}
            className={`absolute top-0 left-0 flex items-center gap-1 text-sm font-semibold transition-colors ${hasCustomBg ? 'text-sky-300 hover:text-sky-100' : 'text-sky-600 hover:text-sky-800'}`}
          >
            ← Kembali
          </button>
          <h1 className={`text-4xl sm:text-5xl font-bold font-poppins ${hasCustomBg ? 'text-white' : 'text-slate-800'}`}>Smart Play</h1>
          <p className={`mt-2 text-lg ${hasCustomBg ? 'text-slate-200' : 'text-slate-500'}`}>Atur Permainan Edukatif Anda</p>
        </div>

        {/* AI Activity Generation Section */}
        <div className={`p-6 rounded-xl border ${hasCustomBg ? 'bg-black/30 border-white/20' : 'bg-stone-100 border-stone-300'}`}>
            <h2 className={`text-2xl font-semibold mb-4 font-poppins ${hasCustomBg ? 'text-white' : 'text-slate-700'}`}>1. Tentukan Konteks Pembelajaran</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input type="text" placeholder="Mata Pelajaran (e.g., Sejarah)" value={subject} onChange={e => setSubject(e.target.value)} className={inputClass}/>
                <input type="text" placeholder="Materi Spesifik (e.g., Proklamasi)" value={topic} onChange={e => setTopic(e.target.value)} className={inputClass}/>
                <input type="text" placeholder="Tingkat Kelas (e.g., Kelas 5 SD)" value={grade} onChange={e => setGrade(e.target.value)} className={inputClass}/>
            </div>
             <div className="flex justify-center gap-6 my-4">
                <label className={`flex items-center gap-2 cursor-pointer p-2 rounded-md ${hasCustomBg ? 'hover:bg-black/20' : 'hover:bg-stone-200'}`}>
                    <input type="radio" name="activityType" value="cognitive" checked={activityType === 'cognitive'} onChange={() => setActivityType('cognitive')} className="w-5 h-5 text-orange-600 focus:ring-orange-500 border-slate-400" />
                    <span className={`font-semibold ${hasCustomBg ? 'text-slate-200' : 'text-slate-700'}`}>Kognitif (Tanya Jawab)</span>
                </label>
                <label className={`flex items-center gap-2 cursor-pointer p-2 rounded-md ${hasCustomBg ? 'hover:bg-black/20' : 'hover:bg-stone-200'}`}>
                    <input type="radio" name="activityType" value="psychomotor" checked={activityType === 'psychomotor'} onChange={() => setActivityType('psychomotor')} className="w-5 h-5 text-orange-600 focus:ring-orange-500 border-slate-400" />
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

            {/* Offline-ready activity presets */}
            {savedActivities.length > 0 && (
              <div className={`mt-4 pt-4 border-t ${hasCustomBg ? 'border-white/15' : 'border-stone-200'} space-y-2`}>
                <label className={`text-sm font-bold flex items-center gap-2 ${hasCustomBg ? 'text-sky-300' : 'text-sky-700'}`}>
                  <FolderOpen size={16} /> Gunakan Preset Tersimpan (Bisa Diakses Offline)
                </label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {savedActivities.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => handleLoadPreset(p.id)}
                      className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all hover:scale-105 ${hasCustomBg ? 'bg-slate-800/45 border-slate-600 text-white hover:bg-slate-700/50' : 'bg-white border-stone-200 text-slate-700 hover:bg-stone-50 hover:border-orange-300'}`}
                    >
                      <span className="truncate max-w-[180px]">{p.title} <span className="text-[10px] opacity-60">({p.subject})</span></span>
                      <button 
                        onClick={(e) => handleDeletePreset(p.id, e)}
                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 ml-1"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Column 1: Activities Review */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2 mb-4">
              <h2 className={`text-2xl font-semibold font-poppins ${hasCustomBg ? 'text-white border-white/20' : 'text-slate-700 border-stone-200'}`}>2. Tinjau Aktivitas Kotak</h2>
              
              {/* Save Preset Feature */}
              {Object.keys(activities).length > 0 && (
                <div className="flex items-center gap-1.5 self-end">
                  <input
                    type="text"
                    placeholder="Nama preset... (e.g., Kuis IPA)"
                    value={presetTitle}
                    onChange={e => setPresetTitle(e.target.value)}
                    className={`px-2 py-1 text-xs rounded border w-36 ${hasCustomBg ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-800'}`}
                  />
                  <button
                    onClick={handleSavePreset}
                    disabled={isSavingPreset}
                    className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white px-2.5 py-1 rounded text-xs font-bold transition-all hover:scale-105 shadow-sm disabled:opacity-50"
                  >
                    <Save size={12} />
                    {isSavingPreset ? 'Saving...' : 'Simpan'}
                  </button>
                </div>
              )}
            </div>
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
                      className={inputClass}
                      rows={2}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Players & Special Squares */}
          <div className="space-y-6">
            <h2 className={`text-2xl font-semibold -mb-2 font-poppins ${hasCustomBg ? 'text-white' : 'text-slate-700'}`}>3. Atur Pemain & Papan</h2>
            
            {/* Players Setup */}
            <div>
              <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-lg w-fit">
                <button 
                    onClick={() => setInputMode('manual')}
                    className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${inputMode === 'manual' ? 'bg-white shadow text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Manual
                </button>
                <button 
                    onClick={() => setInputMode('class')}
                    className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${inputMode === 'class' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Dari Kelas
                </button>
              </div>

              {inputMode === 'class' ? (
                  <div className={`p-4 rounded-lg border-2 border-emerald-400/50 ${hasCustomBg ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
                      <label className="block text-sm font-bold mb-1">Pilih Kelas</label>
                      <select 
                        value={selectedClassId} 
                        onChange={e => setSelectedClassId(e.target.value)}
                        className={`w-full p-2 rounded mb-3 ${hasCustomBg ? 'bg-slate-800 text-white' : 'bg-white border-slate-300 border'}`}
                      >
                          <option value="">-- Pilih Kelas --</option>
                          {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.students.length} Siswa)</option>)}
                      </select>

                      <label className="block text-sm font-bold mb-1">Jumlah Kelompok</label>
                      <input 
                        type="number" 
                        min={2} 
                        max={8} 
                        value={groupCount}
                        onChange={e => setGroupCount(parseInt(e.target.value))}
                        className={`w-full p-2 rounded mb-3 ${hasCustomBg ? 'bg-slate-800 text-white' : 'bg-white border-slate-300 border'}`}
                      />
                      
                      <button onClick={handleAutoGroup} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded flex items-center justify-center gap-2 text-sm">
                          <Shuffle size={18} />
                          Buat Kelompok Otomatis
                      </button>
                  </div>
              ) : (
                <>
                  <h3 className={`text-xl font-medium mb-3 ${hasCustomBg ? 'text-slate-200' : 'text-slate-600'}`}>Atur Kelompok & Karakter 3D</h3>
                  {playerNames.map((name, index) => {
                    const currentStyle = pawnStyles[index] || (index % 3 === 0 ? 'car' : index % 3 === 1 ? 'kid' : 'classic');
                    return (
                      <div key={index} className={`p-3 rounded-xl border mb-3 transition-colors ${hasCustomBg ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-stone-200 shadow-sm'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`w-4 h-4 rounded-full flex-shrink-0 ${PLAYER_COLORS[index % PLAYER_COLORS.length]}`}></span>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                            className={`flex-grow p-1.5 py-1 text-sm rounded font-medium focus:ring-1 focus:ring-orange-500 border ${hasCustomBg ? 'bg-slate-800 border-slate-600 text-white' : 'bg-stone-50 border-stone-200 text-slate-800'}`}
                            placeholder="Nama Kelompok"
                          />
                          <button onClick={() => handleRemovePlayer(index)} className="text-red-400 hover:text-red-600 p-1 font-bold text-xs" title="Hapus">✕</button>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-400/20">
                          <span className={`text-[11px] font-bold ${hasCustomBg ? 'text-slate-300' : 'text-slate-500'}`}>Model Pion 3D:</span>
                          <div className="flex gap-1.5">
                            {[
                              { label: '👦 Anak', value: 'kid' },
                              { label: '🚗 Mobil', value: 'car' },
                              { label: '♟️ Klasik', value: 'classic' }
                            ].map(item => (
                              <button
                                key={item.value}
                                type="button"
                                onClick={() => setPawnStyles({ ...pawnStyles, [index]: item.value as any })}
                                className={`text-[10px] px-2 py-1 rounded-md transition-all font-bold ${
                                  currentStyle === item.value 
                                    ? 'bg-orange-600 text-white scale-105 shadow' 
                                    : (hasCustomBg ? 'bg-white/10 text-slate-300 hover:bg-white/20' : 'bg-stone-100 text-slate-600 hover:bg-stone-200')
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
                  {playerNames.length < PLAYER_COLORS.length && (
                    <button onClick={handleAddPlayer} className={`mt-2 w-full font-semibold border-2 rounded-md py-2 transition-colors ${hasCustomBg ? 'text-orange-300 border-orange-400 hover:bg-black/20' : 'text-orange-600 border-orange-500 hover:bg-orange-50'}`}>
                      + Tambah Kelompok Baru
                    </button>
                  )}
                </>
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
                  hasCustomBg={hasCustomBg}
              />
            </div>

            {/* Kategori Apresiasi Guru */}
            <div className={`p-4 rounded-xl border mt-6 ${hasCustomBg ? 'bg-black/30 border-white/20' : 'bg-orange-50/50 border-orange-200 shadow-sm'}`}>
              <h3 className={`text-base font-bold mb-1 font-poppins flex items-center gap-2 ${hasCustomBg ? 'text-white' : 'text-slate-850'}`}>
                <Award className="text-orange-500" size={18} />
                4. Kategori Apresiasi & Karakter Kelompok
              </h3>
              <p className={`text-xs mb-3 ${hasCustomBg ? 'text-slate-300' : 'text-slate-500'}`}>
                Guru dapat merancang kategori apresiasi yang akan dianugerahkan ke kelompok di akhir permainan.
              </p>
              
              <div className="space-y-2 max-h-48 overflow-y-auto mb-3 pr-1">
                {customAwards.map((award, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Award size={13} className="text-amber-500 flex-shrink-0" />
                    <input
                      type="text"
                      value={award}
                      onChange={(e) => {
                        const updated = [...customAwards];
                        updated[idx] = e.target.value;
                        setCustomAwards(updated);
                      }}
                      className={`flex-grow p-1.5 text-xs rounded border ${hasCustomBg ? 'bg-slate-800 text-white border-slate-600' : 'bg-white border-slate-300 text-slate-800'}`}
                    />
                    <button
                      onClick={() => setCustomAwards(customAwards.filter((_, i) => i !== idx))}
                      className="text-red-500 hover:text-red-700 p-1 text-sm font-semibold"
                      title="Hapus Kategori"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Kategori baru... (e.g. Kelompok Ter-jujur)"
                  value={newAwardInput}
                  onChange={(e) => setNewAwardInput(e.target.value)}
                  className={`flex-grow p-1.5 text-xs rounded border ${hasCustomBg ? 'bg-slate-800 text-white border-slate-600' : 'bg-white border-slate-300 border-orange-200'}`}
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
                  className="bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-orange-700 flex items-center justify-center gap-1 flex-shrink-0"
                >
                  <Plus size={13} /> Tambah
                </button>
              </div>

              {/* Suggestions */}
              <div className="mt-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${hasCustomBg ? 'text-slate-400' : 'text-slate-500'}`}>Rekomendasi Cepat:</span>
                <div className="flex flex-wrap gap-1.5">
                  {["Kelompok Paling Sportif", "Kelompok Paling Kompak", "Kelompok Paling Kreatif", "Kelompok Paling Aktif", "Kelompok Ter-Tertib", "Kelompok Ter-Jujur"].map(sug => {
                    const isAlreadyIncluded = customAwards.includes(sug);
                    if (isAlreadyIncluded) return null;
                    return (
                      <button
                        type="button"
                        key={sug}
                        onClick={() => setCustomAwards([...customAwards, sug])}
                        className={`text-[10px] px-2 py-1 rounded-full border transition-all ${hasCustomBg ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:scale-105'}`}
                      >
                        + {sug}
                      </button>
                    )
                  })}
                </div>
              </div>
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
    hasCustomBg: boolean;
}

const SpecialSquareSetup: React.FC<SpecialSquareSetupProps> = ({ title, items, onChange, onAdd, onRemove, hasCustomBg }) => {
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
                </div>
            ))}
            <button onClick={onAdd} className={`mt-1 w-full text-sm font-semibold border-2 border-dashed rounded-md py-1 transition-colors ${hasCustomBg ? 'text-slate-400 border-slate-500 hover:bg-black/20' : 'text-slate-600 border-slate-400 hover:bg-stone-200'}`}>
              + Tambah {baseTitle}
            </button>
        </div>
    );
};