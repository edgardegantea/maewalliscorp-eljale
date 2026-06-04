// src/components/InspectionChecklistModal.jsx — Checklist de inspección antes de completar
import { useState } from 'react';

const CHECKLIST_ITEMS = [
  { id: 'work_done',       label: 'El trabajo fue completado al 100%',             required: true },
  { id: 'area_clean',      label: 'Dejé el área limpia y ordenada',                required: true },
  { id: 'client_informed', label: 'Informé al cliente sobre lo que se hizo',       required: true },
  { id: 'materials_used',  label: 'Usé los materiales correctos y de calidad',     required: false },
  { id: 'no_damage',       label: 'No causé daños adicionales al inmueble',        required: true },
  { id: 'tools_collected', label: 'Recogí todas mis herramientas y materiales',    required: false },
  { id: 'warranty_noted',  label: 'Informé al cliente sobre la garantía del trabajo', required: false },
];

export default function InspectionChecklistModal({ jobTitle, onConfirm, onClose }) {
  const [checks, setChecks] = useState({});
  const [notes, setNotes] = useState('');

  const toggle = (id) => setChecks(prev => ({ ...prev, [id]: !prev[id] }));

  const requiredItems = CHECKLIST_ITEMS.filter(i => i.required);
  const allRequired   = requiredItems.every(i => checks[i.id]);
  const checkedCount  = Object.values(checks).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 shrink-0">
          <h3 className="font-bold text-white">Checklist de entrega</h3>
          <p className="text-blue-200 text-xs mt-0.5 truncate">{jobTitle}</p>
          <p className="text-blue-100 text-xs mt-1">
            Completa el checklist antes de subir tus fotos de evidencia
          </p>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {/* Progress */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>{checkedCount}/{CHECKLIST_ITEMS.length} completados</span>
              <span className="font-medium">{Math.round((checkedCount / CHECKLIST_ITEMS.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${(checkedCount / CHECKLIST_ITEMS.length) * 100}%` }} />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2.5">
            {CHECKLIST_ITEMS.map(item => (
              <label key={item.id}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  checks[item.id]
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-gray-50 border-gray-200 hover:border-blue-200'
                }`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  checks[item.id] ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                }`}>
                  {checks[item.id] && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/>
                    </svg>
                  )}
                </div>
                <input type="checkbox" checked={!!checks[item.id]} onChange={() => toggle(item.id)} className="sr-only" />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${checks[item.id] ? 'text-emerald-800 line-through' : 'text-gray-800'}`}>
                    {item.label}
                  </p>
                  {item.required && !checks[item.id] && (
                    <p className="text-[10px] text-red-400 mt-0.5">* Obligatorio</p>
                  )}
                </div>
              </label>
            ))}
          </div>

          {/* Notas adicionales */}
          <div className="mt-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
              Notas adicionales (opcional)
            </label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Ej. Recomendé cambiar la llave en 6 meses, el cliente quedó muy satisfecho..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 resize-none" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0 space-y-2">
          {!allRequired && (
            <p className="text-xs text-red-500 text-center font-medium">
              ⚠️ Debes confirmar todos los puntos obligatorios para continuar
            </p>
          )}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button
              onClick={() => allRequired && onConfirm({ checks, notes })}
              disabled={!allRequired}
              className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              ✅ Confirmar y subir fotos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
