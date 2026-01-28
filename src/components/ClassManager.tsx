import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, doc, addDoc, onSnapshot, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ClassData, Student } from '../types';
import * as XLSX from 'xlsx';
import { Users, Upload, Plus, Trash2, X, Download, Edit2, Check, Save } from 'lucide-react';

interface ClassManagerProps {
  onClose: () => void;
}

export const ClassManager: React.FC<ClassManagerProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  
  // Create Class State
  const [newClassName, setNewClassName] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);
  
  // Edit Class State
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editClassName, setEditClassName] = useState('');

  // Student Form State
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'L' | 'P'>('L');

  // Edit Student State
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentGender, setEditStudentGender] = useState<'L' | 'P'>('L');

  // --- FIRESTORE SUBSCRIPTION ---
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'classes'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const classList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassData));
      setClasses(classList);
      
      // Update selected class data in real-time
      if (selectedClass) {
        const updatedSelected = classList.find(c => c.id === selectedClass.id);
        if (updatedSelected) setSelectedClass(updatedSelected);
      }
    });
    return unsubscribe;
  }, [user, selectedClass?.id]);

  // --- CLASS ACTIONS ---

  const handleAddClass = async () => {
    if (!newClassName.trim() || !user) return;
    try {
        await addDoc(collection(db, 'users', user.uid, 'classes'), {
            name: newClassName,
            students: [],
            createdAt: serverTimestamp()
        });
        setNewClassName('');
        setIsAddingClass(false);
    } catch (error) {
        console.error("Error adding class:", error);
        alert("Gagal membuat kelas.");
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!user || !window.confirm('Hapus kelas ini? Data siswa akan hilang permanen.')) return;
    try {
        await deleteDoc(doc(db, 'users', user.uid, 'classes', classId));
        if (selectedClass?.id === classId) setSelectedClass(null);
    } catch (error) {
        console.error("Error deleting class:", error);
    }
  };

  const startEditingClass = (cls: ClassData) => {
      setEditingClassId(cls.id);
      setEditClassName(cls.name);
  };

  const saveEditClass = async () => {
      if (!user || !editingClassId || !editClassName.trim()) return;
      try {
          await updateDoc(doc(db, 'users', user.uid, 'classes', editingClassId), {
              name: editClassName
          });
          setEditingClassId(null);
      } catch (error) {
          console.error("Error updating class:", error);
      }
  };

  // --- STUDENT ACTIONS ---

  const handleAddStudent = async () => {
    if (!selectedClass || !user || !newStudentName.trim()) return;
    
    const simpleId = Date.now().toString(36) + Math.random().toString(36).substr(2);

    const newStudent: Student = {
      id: simpleId,
      name: newStudentName,
      gender: newStudentGender
    };
    
    const updatedStudents = [...selectedClass.students, newStudent];
    
    try {
        await updateDoc(doc(db, 'users', user.uid, 'classes', selectedClass.id), {
            students: updatedStudents
        });
        setNewStudentName('');
    } catch (error) {
        console.error("Error adding student:", error);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!selectedClass || !user) return;
    if(!window.confirm("Hapus siswa ini?")) return;

    const updatedStudents = selectedClass.students.filter(s => s.id !== studentId);
    try {
        await updateDoc(doc(db, 'users', user.uid, 'classes', selectedClass.id), {
            students: updatedStudents
        });
    } catch (error) {
        console.error("Error deleting student:", error);
    }
  };

  const startEditingStudent = (student: Student) => {
      setEditingStudentId(student.id);
      setEditStudentName(student.name);
      setEditStudentGender(student.gender);
  };

  const saveEditStudent = async () => {
      if (!selectedClass || !user || !editingStudentId || !editStudentName.trim()) return;

      const updatedStudents = selectedClass.students.map(s => {
          if (s.id === editingStudentId) {
              return { ...s, name: editStudentName, gender: editStudentGender };
          }
          return s;
      });

      try {
          await updateDoc(doc(db, 'users', user.uid, 'classes', selectedClass.id), {
              students: updatedStudents
          });
          setEditingStudentId(null);
      } catch (error) {
          console.error("Error updating student:", error);
      }
  };

  // --- FILE HANDLING ---

  const handleDownloadTemplate = () => {
    const templateData = [
      { "Nama": "Budi Santoso", "Jenis Kelamin": "L" },
      { "Nama": "Siti Aminah", "Jenis Kelamin": "P" },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Siswa");
    const wscols = [{wch: 30}, {wch: 15}];
    ws['!cols'] = wscols;
    XLSX.writeFile(wb, "template_siswa_smartplay.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedClass || !user) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      const newStudents: Student[] = [];
      data.forEach((row: any) => {
        const name = row['Nama'] || row['nama'] || row['Name'];
        let gender = row['Gender'] || row['L/P'] || row['Jenis Kelamin'];
        
        if (name) {
            if (typeof gender === 'string') {
                const g = gender.toUpperCase().trim();
                if (g.startsWith('L') || g === 'MALE') gender = 'L';
                else if (g.startsWith('P') || g === 'FEMALE') gender = 'P';
                else gender = 'L'; 
            } else {
                gender = 'L';
            }

            const simpleId = Date.now().toString(36) + Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);

            newStudents.push({
                id: simpleId,
                name: String(name),
                gender: gender as 'L' | 'P'
            });
        }
      });

      if (newStudents.length > 0) {
          const updatedStudents = [...selectedClass.students, ...newStudents];
          await updateDoc(doc(db, 'users', user.uid, 'classes', selectedClass.id), {
              students: updatedStudents
          });
          alert(`Berhasil mengimpor ${newStudents.length} siswa!`);
      } else {
          alert("Format file tidak sesuai. Gunakan template.");
      }
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex overflow-hidden border border-slate-200">
        
        {/* Sidebar: Class List */}
        <div className="w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
            <h2 className="font-bold text-lg text-slate-700">Daftar Kelas</h2>
            <button onClick={() => setIsAddingClass(true)} className="bg-orange-100 text-orange-600 p-2 rounded-lg hover:bg-orange-200 transition-colors">
                <Plus size={20} />
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto p-2 space-y-2">
            {isAddingClass && (
                <div className="p-2 bg-white border border-orange-300 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2">
                    <input 
                        autoFocus
                        placeholder="Nama Kelas (e.g., 4A)" 
                        className="w-full p-2 border rounded mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        value={newClassName}
                        onChange={e => setNewClassName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddClass()}
                    />
                    <div className="flex gap-2">
                        <button onClick={handleAddClass} className="bg-orange-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-orange-600">Simpan</button>
                        <button onClick={() => setIsAddingClass(false)} className="bg-slate-200 text-slate-600 px-3 py-1 rounded text-xs hover:bg-slate-300">Batal</button>
                    </div>
                </div>
            )}
            
            {classes.map(cls => (
                <div 
                    key={cls.id}
                    onClick={() => { setSelectedClass(cls); setEditingClassId(null); }}
                    className={`p-3 rounded-lg cursor-pointer flex justify-between items-center group transition-all ${selectedClass?.id === cls.id ? 'bg-orange-500 text-white shadow-md' : 'bg-white hover:bg-slate-100 text-slate-700'}`}
                >
                    {editingClassId === cls.id ? (
                         <div className="flex items-center gap-2 w-full" onClick={e => e.stopPropagation()}>
                            <input 
                                value={editClassName}
                                onChange={e => setEditClassName(e.target.value)}
                                className="w-full p-1 text-sm rounded text-slate-800"
                                autoFocus
                            />
                            <button onClick={saveEditClass} className="text-emerald-500 bg-white rounded-full p-1 hover:bg-emerald-100"><Check size={14}/></button>
                            <button onClick={() => setEditingClassId(null)} className="text-red-500 bg-white rounded-full p-1 hover:bg-red-100"><X size={14}/></button>
                         </div>
                    ) : (
                        <>
                            <div>
                                <div className="font-bold truncate max-w-[120px]">{cls.name}</div>
                                <div className={`text-xs ${selectedClass?.id === cls.id ? 'text-orange-100' : 'text-slate-400'}`}>{cls.students.length} Siswa</div>
                            </div>
                            {selectedClass?.id !== cls.id && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); startEditingClass(cls); }} className="text-slate-400 hover:text-blue-500 p-1">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id); }} className="text-slate-400 hover:text-red-500 p-1">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            ))}
            {classes.length === 0 && !isAddingClass && (
                <div className="text-center text-slate-400 text-sm mt-10">
                    <p>Belum ada database kelas.</p>
                    <p className="text-xs mt-1">Buat kelas baru untuk memulai.</p>
                </div>
            )}
          </div>
        </div>

        {/* Main Content: Student List */}
        <div className="w-2/3 flex flex-col bg-white">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="font-bold text-xl text-slate-800">
                    {selectedClass ? `Siswa Kelas ${selectedClass.name}` : 'Database Siswa'}
                </h2>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={24} />
                </button>
            </div>

            {selectedClass ? (
                <>
                    {/* Toolbar */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Manual Add */}
                        <div className="flex gap-2 items-start">
                            <div className="flex-grow flex flex-col gap-1">
                                <div className="flex gap-2">
                                    <input 
                                        placeholder="Nama Siswa Baru" 
                                        className="flex-grow p-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        value={newStudentName}
                                        onChange={e => setNewStudentName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && newStudentName && handleAddStudent()}
                                    />
                                    <select 
                                        className="p-2 border rounded-lg text-sm bg-white"
                                        value={newStudentGender}
                                        onChange={(e) => setNewStudentGender(e.target.value as 'L' | 'P')}
                                    >
                                        <option value="L">L</option>
                                        <option value="P">P</option>
                                    </select>
                                </div>
                            </div>
                            <button onClick={handleAddStudent} disabled={!newStudentName} className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg disabled:opacity-50 transition-colors h-[38px]">
                                <Plus size={20} />
                            </button>
                        </div>
                        
                        {/* Import Excel */}
                        <div className="flex flex-col items-end gap-1">
                            <label className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm w-fit">
                                <Upload size={16} />
                                Import Excel
                                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                            </label>
                            <button 
                                onClick={handleDownloadTemplate} 
                                className="text-xs text-sky-600 hover:text-sky-800 hover:underline flex items-center gap-1 mr-1"
                            >
                                <Download size={12} />
                                Template Excel
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-grow overflow-y-auto p-4 bg-white">
                        {selectedClass.students.length > 0 ? (
                             <table className="w-full text-sm text-left border-collapse">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 border-b">Nama Siswa</th>
                                        <th className="px-4 py-3 text-center border-b w-24">L/P</th>
                                        <th className="px-4 py-3 text-right border-b w-24">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedClass.students.map((student) => (
                                        <tr key={student.id} className="border-b hover:bg-slate-50 group">
                                            {editingStudentId === student.id ? (
                                                <>
                                                    <td className="px-4 py-2">
                                                        <input 
                                                            value={editStudentName}
                                                            onChange={e => setEditStudentName(e.target.value)}
                                                            className="w-full p-1 border rounded"
                                                            autoFocus
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <select 
                                                            value={editStudentGender}
                                                            onChange={e => setEditStudentGender(e.target.value as 'L'|'P')}
                                                            className="p-1 border rounded"
                                                        >
                                                            <option value="L">L</option>
                                                            <option value="P">P</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <button onClick={saveEditStudent} className="p-1 text-emerald-600 hover:bg-emerald-100 rounded"><Save size={16}/></button>
                                                            <button onClick={() => setEditingStudentId(null)} className="p-1 text-slate-500 hover:bg-slate-200 rounded"><X size={16}/></button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-4 py-3 font-medium text-slate-900">{student.name}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${student.gender === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                                            {student.gender}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => startEditingStudent(student)} className="text-slate-400 hover:text-blue-500 transition-colors">
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button onClick={() => handleDeleteStudent(student.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 mt-10">
                                <Users size={64} className="mb-4 opacity-10" />
                                <p className="font-medium">Kelas ini masih kosong.</p>
                                <p className="text-xs mt-1">Tambahkan siswa secara manual atau gunakan fitur Import Excel.</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                 <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50/50">
                    <div className="bg-white p-8 rounded-full shadow-sm mb-4">
                        <Users size={40} className="text-orange-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-600">Pilih Kelas</h3>
                    <p className="text-sm max-w-xs text-center mt-2">
                        Pilih kelas dari daftar di sebelah kiri untuk melihat, menambah, atau mengedit data siswa.
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};