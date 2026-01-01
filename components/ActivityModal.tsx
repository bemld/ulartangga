
import React from 'react';

interface ActivityModalProps {
  activity: string;
  squareNumber: number;
  onClose: () => void;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({ activity, squareNumber, onClose }) => {
  if (!activity) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-yellow-100 rounded-lg shadow-2xl w-full max-w-2xl transform transition-all -rotate-2 p-8 border-2 border-yellow-200">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-slate-700 mb-2 font-caveat">Aktivitas Kotak {squareNumber}</h2>
          <div className="w-20 h-1.5 bg-yellow-400 mx-auto rounded-full"></div>
        </div>
        <p className="text-slate-800 text-2xl text-center my-8 min-h-[100px] font-caveat">
          {activity}
        </p>
        <div className="text-center">
          <button
            onClick={onClose}
            className="bg-emerald-500 text-white font-bold py-3 px-12 rounded-lg text-lg hover:bg-emerald-600 transition-transform transform hover:scale-105 shadow-lg"
          >
            Selesai & Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
};
