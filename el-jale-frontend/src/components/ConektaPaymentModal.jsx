// src/components/ConektaPaymentModal.jsx — Pago con Conekta (tarjeta)
import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const CONEKTA_KEY = import.meta.env.VITE_CONEKTA_PUBLIC_KEY;

export default function ConektaPaymentModal({ job, onClose, onPaid }) {
  const [form, setForm]     = useState({ number: '', name: '', expiry: '', cvc: '' });
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const formRef = useRef(null);

  // Cargar Conekta.js
  useEffect(() => {
    if (!CONEKTA_KEY) return;
    if (window.Conekta) { window.Conekta.setPublicKey(CONEKTA_KEY); setSdkReady(true); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.conekta.io/js/latest/conekta.js';
    s.onload = () => { window.Conekta.setPublicKey(CONEKTA_KEY); setSdkReady(true); };
    document.head.appendChild(s);
  }, []);

  const formatExpiry = (val) => {
    const v = val.replace(/\D/g, '').slice(0, 4);
    return v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v;
  };

  const formatCard = (val) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sdkReady || !window.Conekta) {
      toast.error('SDK de Conekta no disponible. Configura VITE_CONEKTA_PUBLIC_KEY.');
      return;
    }

    setLoading(true);
    try {
      const [expM, expY] = form.expiry.split('/');
      const tokenData = {
        card: {
          number:        form.number.replace(/\s/g, ''),
          name:          form.name,
          exp_year:      `20${expY}`,
          exp_month:     expM,
          cvc:           form.cvc,
        },
      };

      const token = await new Promise((resolve, reject) => {
        window.Conekta.Token.create(
          tokenData,
          (token) => resolve(token.id),
          (err)   => reject(new Error(err.message_to_purchaser ?? 'Error al tokenizar tarjeta'))
        );
      });

      const r = await api.post(`/jobs/${job.id}/conekta/order`, { token_id: token });
      toast.success(r.data.message);
      onPaid?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message ?? err.message ?? 'Error al procesar el pago');
    } finally { setLoading(false); }
  };

  const amount = Number(job?.budget ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            <h3 className="font-bold text-lg">Pagar con tarjeta</h3>
          </div>
          <p className="text-blue-200 text-sm">Procesado por Conekta · Pago seguro</p>
          <div className="mt-3 bg-white/10 rounded-xl px-4 py-2 flex items-center justify-between">
            <span className="text-sm text-blue-100">{job?.title}</span>
            <span className="text-xl font-black">${amount.toLocaleString('es-MX')} MXN</span>
          </div>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
          {!CONEKTA_KEY && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 font-medium">
              ⚠️ Conekta no está configurado. Agrega <code>VITE_CONEKTA_PUBLIC_KEY</code> en el .env.production.
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Número de tarjeta</label>
            <input type="text" required maxLength={19}
              value={form.number} onChange={e => setForm(f => ({ ...f, number: formatCard(e.target.value) }))}
              placeholder="4242 4242 4242 4242"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Nombre en la tarjeta</label>
            <input type="text" required
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value.toUpperCase() }))}
              placeholder="NOMBRE APELLIDO"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-blue-400/30" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Vencimiento</label>
              <input type="text" required maxLength={5}
                value={form.expiry} onChange={e => setForm(f => ({ ...f, expiry: formatExpiry(e.target.value) }))}
                placeholder="MM/AA"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">CVC</label>
              <input type="text" required maxLength={4}
                value={form.cvc} onChange={e => setForm(f => ({ ...f, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                placeholder="123"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/30" />
            </div>
          </div>

          {/* Escrow guarantee */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5">
            <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            <p className="text-xs text-emerald-700 font-medium">
              Tu pago queda protegido en escrow. Solo se libera al experto cuando tú confirmes que el trabajo está terminado.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading || !CONEKTA_KEY}
              className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-60 shadow-lg shadow-blue-600/20">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Procesando...
                </span>
              ) : `💳 Pagar $${amount.toLocaleString('es-MX')} MXN`}
            </button>
          </div>

          <p className="text-[10px] text-gray-400 text-center">
            Pago procesado con Conekta · Certificación PCI DSS · Tus datos están cifrados
          </p>
        </form>
      </div>
    </div>
  );
}
