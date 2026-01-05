import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, doc, addDoc, onSnapshot, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { ClassData, Student } from '../types';
import * as XLSX from 'xlsx';
import { Users, Upload, Plus, Trash2, X, Download } from 'lucide-react';

interface ClassManagerProps {
  onClose: () => void;
}

export const ClassManager: React.FC<ClassManagerProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);
  
  // Student Form
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'L' | 'P'>('L');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'classes'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const classList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassData));
      setClasses(classList);
    });
    return unsubscribe;
  }, [user]);

  const handleAddClass = async () => {
    if (!newClassName.trim() || !user) return;
    await addDoc(collection(db, 'users', user.uid, 'classes'), {
      name: newClassName,
      students: [],
      createdAt: new Date()
    });
    setNewClassName('');
    setIsAddingClass(false);
  };

  const handleDeleteClass = async (classId: string) => {
    if (!user || !window.confirm('Hapus kelas ini? Data siswa akan hilang.')) return;
    await deleteDoc(doc(db, 'users', user.uid, 'classes', classId));
    if (selectedClass?.id === classId) setSelectedClass(null);
  };

  const handleAddStudent = async () => {
    if (!selectedClass || !user || !newStudentName.trim()) return;
    const newStudent: Student = {
      id: crypto.randomUUID(),
      name: newStudentName,
      gender: newStudentGender
    };
    const updatedStudents = [...selectedClass.students, newStudent];
    
    await updateDoc(doc(db, 'users', user.uid, 'classes', selectedClass.id), {
      students: updatedStudents
    });
    
    // Optimistic update for UI responsiveness
    setSelectedClass({ ...selectedClass, students: updatedStudents });
    setNewStudentName('');
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!selectedClass || !user) return;
    const updatedStudents = selectedClass.students.filter(s => s.id !== studentId);
    await updateDoc(doc(db, 'users', user.uid, 'classes', selectedClass.id), {
      students: updatedStudents
    });
    setSelectedClass({ ...selectedClass, students: updatedStudents });
  };

  const handleDownloadTemplate = () => {
    // Data contoh untuk template
    const templateData = [
      { "Nama": "Budi Santoso", "Jenis Kelamin": "L" },
      { "Nama": "Siti Aminah", "Jenis Kelamin": "P" },
      { "Nama": "Andi Pratama", "Jenis Kelamin": "L" },
      { "Nama": "Dewi Sartika", "Jenis Kelamin": "P" },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Siswa");
    
    // Auto width columns (optional tweak)
    const wscols = [
        {wch: 30}, // Width for Name
        {wch: 15}, // Width for Gender
    ];
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
        // Try to guess column names
        const name = row['Nama'] || row['nama'] || row['Name'] || row['Student Name'];
        let gender = row['Gender'] || row['L/P'] || row['Jenis Kelamin'] || row['Sex'];
        
        if (name) {
            // Normalize Gender
            if (typeof gender === 'string') {
                const g = gender.toUpperCase().trim();
                if (g.startsWith('L') || g === 'MALE' || g === 'PRIA') gender = 'L';
                else if (g.startsWith('P') || g === 'FEMALE' || g === 'WANITA') gender = 'P';
                else gender = 'L'; // Default fallback
            } else {
                gender = 'L';
            }

            newStudents.push({
                id: crypto.randomUUID(),
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
          setSelectedClass({ ...selectedClass, students: updatedStudents });
          alert(`Berhasil mengimpor ${newStudents.length} siswa!`);
      } else {
          alert("Tidak ditemukan data yang valid. Pastikan file Excel memiliki kolom 'Nama' dan 'Jenis Kelamin' (L/P).");
      }
      // Reset input file agar bisa upload file yang sama lagi jika perlu
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
                <div className="p-2 bg-white border border-orange-300 rounded-lg shadow-sm">
                    <input 
                        autoFocus
                        placeholder="Nama Kelas (e.g., 4A)" 
                        className="w-full p-2 border rounded mb-2 text-sm"
                        value={newClassName}
                        onChange={e => setNewClassName(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button onClick={handleAddClass} className="bg-orange-500 text-white px-3 py-1 rounded text-xs font-bold">Simpan</button>
                        <button onClick={() => setIsAddingClass(false)} className="bg-slate-200 text-slate-600 px-3 py-1 rounded text-xs">Batal</button>
                    </div>
                </div>
            )}
            
            {classes.map(cls => (
                <div 
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className={`p-3 rounded-lg cursor-pointer flex justify-between items-center group transition-all ${selectedClass?.id === cls.id ? 'bg-orange-500 text-white shadow-md' : 'bg-white hover:bg-slate-100 text-slate-700'}`}
                >
                    <div>
                        <div className="font-bold">{cls.name}</div>
                        <div className={`text-xs ${selectedClass?.id === cls.id ? 'text-orange-100' : 'text-slate-400'}`}>{cls.students.length} Siswa</div>
                    </div>
                    {selectedClass?.id !== cls.id && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id); }} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            ))}
            {classes.length === 0 && !isAddingClass && (
                <p className="text-center text-slate-400 text-sm mt-10">Belum ada kelas. Buat baru!</p>
            )}
          </div>
        </div>

        {/* Main Content: Student List */}
        <div className="w-2/3 flex flex-col bg-white">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="font-bold text-xl text-slate-800">
                    {selectedClass ? `Siswa Kelas ${selectedClass.name}` : 'Pilih Kelas'}
                </h2>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                </button>
            </div>

            {selectedClass ? (
                <>
                    {/* Toolbar */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Manual Add */}
                        <div className="flex gap-2">
                            <input 
                                placeholder="Nama Siswa" 
                                className="flex-grow p-2 border rounded-lg text-sm"
                                value={newStudentName}
                                onChange={e => setNewStudentName(e.target.value)}
                            />
                            <select 
                                className="p-2 border rounded-lg text-sm bg-white"
                                value={newStudentGender}
                                onChange={(e) => setNewStudentGender(e.target.value as 'L' | 'P')}
                            >
                                <option value="L">L</option>
                                <option value="P">P</option>
                            </select>
                            <button onClick={handleAddStudent} disabled={!newStudentName} className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg disabled:opacity-50">
                                <Plus size={20} />
                            </button>
                        </div>
                        
                        {/* Import Excel */}
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 bg-white border border-slate-300 text-slate-600 px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm">
                                    <Upload size={16} />
                                    Import Excel
                                    <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                                </label>
                            </div>
                            <button 
                                onClick={handleDownloadTemplate} 
                                className="text-xs text-sky-500 hover:text-sky-700 hover:underline flex items-center gap-1"
                            >
                                <Download size={12} />
                                Download Template
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-grow overflow-y-auto p-4">
                        {selectedClass.students.length > 0 ? (
                             <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3">Nama</th>
                                        <th className="px-4 py-3 text-center">L/P</th>
                                        <th className="px-4 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedClass.students.map((student) => (
                                        <tr key={student.id} className="border-b hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-900">{student.name}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${student.gender === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                                    {student.gender}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => handleDeleteStudent(student.id)} className="text-red-400 hover:text-red-600">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Users size={48} className="mb-2 opacity-20" />
                                <p>Belum ada siswa di kelas ini.</p>
                                <p className="text-xs">Tambahkan manual atau import dari Excel.</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                 <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50">
                    <p>Pilih kelas di sebelah kiri untuk mengelola siswa.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};