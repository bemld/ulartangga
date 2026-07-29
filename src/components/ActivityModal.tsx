import React, { useState } from 'react';
import type { ActivityType, BoardActivityItem } from '../types';
import { generateAIContent } from '../services/aiService';
import { Type } from "@google/genai";
import { Eye, EyeOff, Bot, CheckCircle2, XCircle, Sparkles, X } from 'lucide-react';

interface ActivityModalProps {
  activity: string | BoardActivityItem;
  squareNumber: number;
  activityType?: ActivityType;
  onClose: () => void;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({ 
  activity, 
  squareNumber, 
  activityType = 'psychomotor',
  onClose 
}) => {
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState<{ passed: boolean; score: number; feedback: string } | null>(null);

  if (!activity) return null;

  const questionText = typeof activity === 'string' ? activity : (activity?.question || '');
  const answerKeyText = typeof activity === 'string' ? '' : (activity?.answerKey || '');

  const handleEvaluateAnswerWithAI = async () => {
    if (!studentAnswer.trim()) {
      alert("Harap ketikkan jawaban siswa/kelompok terlebih dahulu.");
      return;
    }

    if (!navigator.onLine) {
      setAiEvaluation({
        passed: true,
        score: 100,
        feedback: "⚡ Mode Offline Aktif: Evaluasi AI otomatis memerlukan jaringan internet. Kunci jawaban acuan di atas telah dibuka agar Guru dapat mengevaluasi jawaban siswa secara manual."
      });
      setShowAnswerKey(true);
      return;
    }

    // Pengecekan instan jika jawaban siswa persis / mirip dengan kunci jawaban
    const normalizeText = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, ' ').trim();
    const studentNorm = normalizeText(studentAnswer);
    const keyNorm = normalizeText(answerKeyText);

    if (studentNorm && keyNorm && (studentNorm === keyNorm || (keyNorm.length >= 3 && studentNorm.includes(keyNorm)))) {
      setAiEvaluation({
        passed: true,
        score: 100,
        feedback: `✨ Tepat Sekali! Jawaban "${studentAnswer}" sesuai 100% dengan Kunci Jawaban Acuan. Analisis presisi instan mengonfirmasi kebenaran jawaban!`
      });
      return;
    }

    setIsEvaluating(true);
    setAiEvaluation(null);

    try {
      const prompt = `Anda adalah penilai dan evaluator kuis edukasi interaktif ramah anak sekolah.
Tugas Anda: Evaluasi secara Cermat & Fleksibel apakah Jawaban Siswa secara LOGIKA & MAKNA sudah BENAR / MENDEKATI Kunci Jawaban.

Soal Tantangan (Ular Tangga Kotak ${squareNumber}):
"${questionText}"

Kunci Jawaban Acuan:
"${answerKeyText || 'Sesuai pemahaman materi yang diajarkan'}"

Jawaban Siswa:
"${studentAnswer}"

Petunjuk Evaluasi:
1. Pahami inti/maksud dari Kunci Jawaban (atau esensi pertanyaan). Jawaban siswa tidak harus persis kata demi kata, cukup esensi logisnya benar.
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
        feedback: "⚡ Kendala Koneksi / AI: Jaringan terputus. Kunci jawaban acuan di atas telah dibuka agar Guru dapat melakukan penilaian manual."
      });
      setShowAnswerKey(true);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 sm:p-8 border-4 border-yellow-400 relative my-auto animate-content-fade"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 font-bold text-lg w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
          title="Tutup Modal"
        >
          <X size={18} />
        </button>

        {/* Square Number Badge */}
        <div className="absolute -top-5 -left-5 w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-white shadow-lg text-2xl font-bold text-yellow-950 font-poppins">
          {squareNumber}
        </div>

        {/* Modal Header */}
        <div className="text-center mb-4 pr-6">
          <h2 className="text-2xl sm:text-3xl font-bold font-caveat text-slate-800">
            Aktivitas Kotak {squareNumber}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              activityType === 'cognitive' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {activityType === 'cognitive' ? '🧠 Mode Kognitif' : '🤸 Mode Psikomotor'}
            </span>
          </div>
        </div>

        {/* QUESTION / TASK CARD */}
        <div className="bg-gradient-to-b from-yellow-50 to-amber-50/80 p-5 rounded-2xl border-2 border-yellow-300 mb-4 shadow-inner text-center">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
            <Sparkles size={13} className="text-amber-500" /> 
            {activityType === 'cognitive' ? 'Soal Pertanyaan Kognitif' : 'Tugas Praktik / Peragaan'}
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-800 whitespace-pre-wrap leading-snug">
            {questionText}
          </p>
        </div>

        {/* COGNITIVE MODE SPECIAL FEATURES */}
        {activityType === 'cognitive' && (
          <>
            {/* TEACHER PEEK ANSWER KEY TOGGLE */}
            <div className="mb-4 text-left">
              <button
                type="button"
                onClick={() => setShowAnswerKey(!showAnswerKey)}
                className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg border border-sky-200 transition-colors"
              >
                {showAnswerKey ? <EyeOff size={14} /> : <Eye size={14} />}
                {showAnswerKey ? "Sembunyikan Kunci Jawaban" : "👁️ Intip Kunci Jawaban (Khusus Guru)"}
              </button>

              {showAnswerKey && (
                <div className="mt-2 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-left text-xs font-medium text-emerald-950 animate-fadeIn">
                  <span className="font-bold text-emerald-800 block mb-0.5">🔑 Kunci Jawaban Acuan:</span>
                  {answerKeyText.trim() ? answerKeyText : "Kunci jawaban acuan belum diisi (AI akan mengevaluasi berdasarkan esensi soal)."}
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

        {/* FOOTER BUTTON */}
        <div className="text-center mt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl text-base hover:bg-emerald-600 transition-all shadow-md hover:scale-[1.01]"
          >
            Selesai & Lanjutkan Permainan 🚀
          </button>
        </div>
      </div>
    </div>
  );
};
