// src/components/DisputeModal.jsx
import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const REASONS = [
  'El trabajo no quedó como se acordó',
  'El experto no se presentó',
  'El trabajo está incompleto',
  'El experto fue irrespetuoso',
  'Se cobró más de lo acordado',
  'Daños causados durante el trabajo',
  'Otro motivo',
];

export default function DisputeModal({ job, onClose, onSubmitted }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) { toast.error('Selecciona el motivo de la disputa'); return; }
    setSubmitting(true);
    try {
      const r = await api.post(`/jobs/${job.id}/dispute`, { reason, description });
      toast.success(r.data.message);
      onSubmitted?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrar la disputa');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-slide-up">

        <div className="bg-red-600 px-6 py-4 rounded-t-2xl">
          <h3 className="font-bold text-white">Reportar un problema</h3>
          <p className="text-red-200 text-xs mt-0.5 truncate">{job.title}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            ⚠️ El equipo de El Jale revisará tu caso y se comunicará contigo en un plazo de 24 horas.
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Motivo *</label>
            <div className="space-y-2">
              {REASONS.map(r => (
                <label key={r} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${reason === r ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="text-red-500" />
                  <span className="text-sm text-gray-700">{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Descripción detallada *</label>
            <textarea
              rows={3} value={description} onChange={e => setDescription(e.target.value)}
              required maxLength={1000}
              placeholder="Describe con detalle qué pasó, fechas, montos involucrados..."
              className="input resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/1000</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={submitting || !reason}
              className="flex-1 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all active:scale-95 disabled:opacity-50">
              {submitting ? 'Enviando...' : 'Reportar problema'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
