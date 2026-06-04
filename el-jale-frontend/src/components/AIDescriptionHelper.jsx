// src/components/AIDescriptionHelper.jsx — IA para mejorar descripciones de trabajos
import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function AIDescriptionHelper({ categoryId, categoryName, description, urgency, onImprove, onTitle }) {
  const [improving, setImproving] = useState(false);
  const [titling, setTitling]     = useState(false);

  const improve = async () => {
    if (!description?.trim()) { toast.error('Escribe algo primero para mejorar.'); return; }
    setImproving(true);
    try {
      const r = await api.post('/ai/describe', {
        category:    categoryName ?? 'servicios del hogar',
        description: description.trim(),
        urgency:     urgency ?? 'normal',
      });
      onImprove?.(r.data.description);
      toast.success('✨ Descripción mejorada con IA');
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Error al mejorar con IA');
    } finally { setImproving(false); }
  };

  const suggestTitle = async () => {
    if (!description?.trim()) { toast.error('Escribe la descripción primero.'); return; }
    setTitling(true);
    try {
      const r = await api.post('/ai/title', {
        category:    categoryName ?? 'servicios del hogar',
        description: description.trim(),
      });
      if (r.data.title) { onTitle?.(r.data.title); toast.success('✨ Título sugerido'); }
    } catch {} finally { setTitling(false); }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={improve} disabled={improving}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-xl transition-all disabled:opacity-60 active:scale-95">
        {improving ? (
          <><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Mejorando...</>
        ) : <>✨ Mejorar descripción con IA</>}
      </button>

      {onTitle && (
        <button type="button" onClick={suggestTitle} disabled={titling}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl transition-all disabled:opacity-60 active:scale-95">
          {titling ? '...' : '💡 Sugerir título'}
        </button>
      )}
    </div>
  );
}
