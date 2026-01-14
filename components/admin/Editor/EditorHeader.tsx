import React from 'react';
import { ArrowLeft, FileText, Check } from 'lucide-react';

interface EditorHeaderProps {
  productName: string;
  editingMode: 'landing' | 'thankyou';
  setEditingMode: (mode: 'landing' | 'thankyou') => void;
  setPreviewMode: (mode: 'landing' | 'thankyou') => void;
  onDiscard: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  productName, editingMode, setEditingMode, setPreviewMode, onDiscard
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="flex items-center gap-2 mb-4 group/header">
          <button 
              onClick={onDiscard} 
              className="p-2.5 bg-gray-100 hover:bg-emerald-100 text-slate-500 hover:text-emerald-700 rounded-xl transition-all shadow-sm flex items-center gap-2"
              title="Annulla modifiche e torna alla lista"
          >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-xs font-bold pr-1">Annulla</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 mb-0.5">Modifica Pagina</h1>
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-tight">{productName}</p>
          </div>
      </div>
      <div className="flex items-center gap-2 mb-4 p-1 bg-gray-200 rounded-lg border border-gray-300">
          <button 
            onClick={() => { setEditingMode('landing'); setPreviewMode('landing'); }} 
            className={`flex-1 text-center py-2 px-3 rounded-md text-sm font-bold transition flex items-center justify-center gap-2 ${editingMode === 'landing' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-gray-100'}`}
          >
            <FileText className="w-4 h-4"/> Landing Page
          </button>
          <button 
            onClick={() => { setEditingMode('thankyou'); setPreviewMode('thankyou'); }} 
            className={`flex-1 text-center py-2 px-3 rounded-md text-sm font-bold transition flex items-center justify-center gap-2 ${editingMode === 'thankyou' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:bg-gray-100'}`}
          >
            <Check className="w-4 h-4"/> Thank You Page
          </button>
      </div>
    </div>
  );
};