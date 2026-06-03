// src/components/InstantBookModal.jsx — Reserva instantánea sin esperar cotizaciones
import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function InstantBookModal({ expert, onClose, onBooked }) {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    category_id: expert?.profile?.category?.id ?? '',
    title: '',
    description: '',
    budget: expert?.profile?.hourly_rate ?? '',
    address: '',
    preferred_date: '',
    preferred_time: '',
    is_urgent: false,
    payment_method: 'mercadopago',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
    return () => { document.body.style.overflow = ''; };
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== null) formData.append(k, v); });
      // Indicar que es reserva directa para este experto
      formData.append('direct_expert_id', expert.id);
      const res = await api.post('/jobs', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`✅ ¡Jale publicado! ${expert.name} será notificado directamente.`);
      onBooked?.(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al publicar el trabajo.');
    } finally { setSubmitting(false); }
  };

  const TEMPLATES = [
    { label: '🔧 Reparación', title: `Reparación — ${expert?.profile?.category?.name}`, desc: 'Necesito una reparación. Por favor traer herramientas.' },
    { label: '🔍 Revisión', title: `Revisión y diagnóstico`, desc: 'Quiero una revisión completa para detectar problemas.' },
    { label: '🛠️ Instalación', title: `Instalación nueva`, desc: 'Requiero instalación nueva. Tengo los materiales.' },
    { label: '🧹 Mantenimiento', title: `Mantenimiento preventivo`, desc: 'Mantenimiento general para prevenir problemas futuros.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-slate-800 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-lg">
              {expert.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold truncate">Reservar con {expert.name}</p>
              <p className="text-gray-400 text-xs">{expert.profile?.category?.name} · ⭐ {expert.profile?.average_rating?.toFixed(1) ?? '—'}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          {expert.profile?.hourly_rate && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-orange-400 text-sm font-bold">💰 ${Number(expert.profile.hourly_rate).toLocaleString('es-MX')}/hora</span>
              <span className="text-gray-500 text-xs">· Pago protegido en escrow</span>
            </div>
          )}
        </div>

        {/* Disponibilidad del experto */}
        {expert.profile?.available_days?.length > 0 && (
          <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-emerald-700 font-medium">
              Disponible: {expert.profile.available_days.join(', ')}
              {expert.profile.available_from && ` · ${expert.profile.available_from}–${expert.profile.available_to}`}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* Templates rápidos */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Inicio rápido</p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map(t => (
                <button key={t.label} type="button"
                  onClick={() => setForm(f => ({ ...f, title: t.title, description: t.desc }))}
                  className="text-xs font-medium text-gray-600 bg-gray-100 hover:bg-orange-50 hover:text-orange-600 border border-gray-200 hover:border-orange-200 px-3 py-1.5 rounded-xl transition-all">
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">¿Qué necesitas? *</label>
            <input type="text" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ej. Reparar fuga de agua en cocina"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Descripción</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe el problema con más detalle..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">📅 Fecha *</label>
              <input type="date" required value={form.preferred_date} min={today}
                onChange={e => setForm(f => ({ ...f, preferred_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">⏰ Hora</label>
              <input type="time" value={form.preferred_time}
                onChange={e => setForm(f => ({ ...f, preferred_time: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">📍 Dirección</label>
            <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="Calle, número, colonia"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">💰 Presupuesto (MXN)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" min="0" step="0.01" value={form.budget}
                onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                placeholder={expert.profile?.hourly_rate ? String(expert.profile.hourly_rate) : '0.00'}
                className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30" />
            </div>
          </div>

          {/* Urgente */}
          <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.is_urgent ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <input type="checkbox" checked={form.is_urgent} onChange={e => setForm(f => ({ ...f, is_urgent: e.target.checked }))} className="sr-only" />
            <span className="text-xl">{form.is_urgent ? '⚡' : '📅'}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{form.is_urgent ? 'Urgente — respuesta en 2h (+50%)' : 'Normal — en 1-3 días'}</p>
              <p className="text-xs text-gray-500">Activa para obtener respuesta inmediata</p>
            </div>
            <div className={`w-10 h-5 rounded-full transition-colors ${form.is_urgent ? 'bg-red-500' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_urgent ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </label>

        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
          <button type="submit" form="instant-book-form" disabled={submitting || !form.title.trim() || !form.preferred_date}
            onClick={handleSubmit}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-60 active:scale-[0.98]">
            {submitting ? 'Publicando...' : `📅 Reservar con ${expert.name.split(' ')[0]}`}
          </button>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            Tu pago quedará protegido en escrow · Solo pagas cuando el trabajo termine
          </p>
        </div>
      </div>
    </div>
  );
}
