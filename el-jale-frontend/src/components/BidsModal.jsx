// src/components/BidsModal.jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';
import StarRating from './StarRating';
import toast from 'react-hot-toast';

const fmt = (n) => n ? `$${Number(n).toLocaleString('es-MX')}` : 'A convenir';

export default function BidsModal({ job, onClose, onAccepted }) {
  const [bids, setBids]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // list | compare
  const [compared, setCompared] = useState([]);     // hasta 3 bids para comparar

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const esc = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    api.get(`/jobs/${job.id}/bids`)
      .then(r => setBids(r.data))
      .catch(() => toast.error('No se pudieron cargar las cotizaciones'))
      .finally(() => setLoading(false));
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc); };
  }, [job.id]);

  const handleAccept = async (bidId) => {
    if (!window.confirm('¿Confirmas que quieres contratar a este experto?')) return;
    setAccepting(bidId);
    try {
      const r = await api.post(`/jobs/${job.id}/bids/${bidId}/accept`);
      toast.success(r.data.message);
      onAccepted();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al aceptar cotización');
    } finally {
      setAccepting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-slide-up">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-bold text-gray-900">Cotizaciones recibidas</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{job.title}</p>
          </div>
          <div className="flex items-center gap-3">
            {bids.length > 1 && (
              <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5">
                <button onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                  Lista
                </button>
                <button onClick={() => { setViewMode('compare'); setCompared(bids.slice(0,3).map(b=>b.id)); }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewMode === 'compare' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                  Comparar
                </button>
              </div>
            )}
            {bids.length > 0 && (
              <span className="px-2.5 py-1 bg-brand-primary text-white text-xs font-bold rounded-full">
                {bids.length} {bids.length === 1 ? 'oferta' : 'ofertas'}
              </span>
            )}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* ── Vista Comparador ── */}
        {viewMode === 'compare' && bids.length > 1 && (
          <div className="overflow-x-auto flex-1 p-4">
            <table className="w-full text-sm border-separate border-spacing-x-2">
              <thead>
                <tr>
                  <td className="text-xs text-gray-400 font-semibold uppercase py-2 w-28">Criterio</td>
                  {bids.filter(b => compared.includes(b.id)).slice(0,3).map(bid => (
                    <th key={bid.id} className="bg-gray-50 rounded-xl px-4 py-3 text-center min-w-[160px]">
                      <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm mx-auto mb-1">
                        {bid.expert.name?.[0]}
                      </div>
                      <p className="font-bold text-gray-900 text-sm truncate">{bid.expert.name}</p>
                      {bid.expert.is_verified && <span className="text-[10px] text-emerald-600 font-bold">✓ Verificado</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="space-y-1">
                {[
                  { label: 'Precio',        render: b => <span className="text-lg font-black text-orange-600">{fmt(b.amount)}</span> },
                  { label: 'Rating',        render: b => b.expert.avg_rating > 0 ? <div className="flex items-center justify-center gap-1"><StarRating value={Math.round(b.expert.avg_rating)} readonly size="sm" /><span className="text-xs">({b.expert.total_reviews})</span></div> : <span className="text-gray-400 text-xs">Sin reseñas</span> },
                  { label: 'Experiencia',   render: b => <span>{b.expert.experience_years} años</span> },
                  { label: 'Mensaje',       render: b => <p className="text-xs text-gray-600 text-left leading-relaxed italic">"{b.message}"</p> },
                  { label: 'Tarifa/hora',   render: b => b.expert.hourly_rate ? <span>${b.expert.hourly_rate}/hr</span> : <span className="text-gray-400">—</span> },
                  { label: 'Acción',        render: b => (
                    <button onClick={() => handleAccept(b.id)} disabled={accepting === b.id}
                      className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-60 w-full">
                      {accepting === b.id ? '...' : 'Contratar'}
                    </button>
                  )},
                ].map(row => (
                  <tr key={row.label}>
                    <td className="text-xs text-gray-400 font-medium py-3 pr-2">{row.label}</td>
                    {bids.filter(b => compared.includes(b.id)).slice(0,3).map(bid => (
                      <td key={bid.id} className="bg-gray-50 rounded-xl px-4 py-3 text-center align-middle">
                        {row.render(bid)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Vista Lista ── */}
        {viewMode === 'list' && <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {loading && (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          )}

          {!loading && bids.length === 0 && (
            <div className="text-center py-12">
              <span className="text-5xl block mb-3">📭</span>
              <p className="font-medium text-gray-700">Aún no hay cotizaciones</p>
              <p className="text-sm text-gray-400 mt-1">Los expertos de tu área verán tu solicitud y enviarán sus propuestas.</p>
            </div>
          )}

          {bids.map(bid => (
            <div key={bid.id} className="card p-5 hover:shadow-card-hover transition-all">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-brand-primary flex items-center justify-center text-white font-black text-lg shrink-0">
                  {bid.expert.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900">{bid.expert.name}</p>
                    {bid.expert.is_verified && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">✓ Verificado</span>
                    )}
                    <span className="text-xs text-gray-500">{bid.expert.category}</span>
                  </div>

                  <div className="flex items-center gap-3 mt-1">
                    {bid.expert.avg_rating > 0 && (
                      <div className="flex items-center gap-1">
                        <StarRating value={Math.round(bid.expert.avg_rating)} readonly size="sm" />
                        <span className="text-xs text-gray-500">({bid.expert.total_reviews})</span>
                      </div>
                    )}
                    <span className="text-xs text-gray-400">{bid.expert.experience_years} años de exp.</span>
                  </div>

                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{bid.message}</p>

                  <div className="flex items-center justify-between mt-3">
                    {bid.amount ? (
                      <span className="text-lg font-black text-brand-primary">
                        ${Number(bid.amount).toLocaleString('es-MX')}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Precio a convenir</span>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(`/expertos/${bid.expert.id}`, '_blank')}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                      >
                        Ver perfil
                      </button>
                      <button
                        onClick={() => handleAccept(bid.id)}
                        disabled={accepting === bid.id}
                        className="btn-primary text-xs px-4 py-1.5"
                      >
                        {accepting === bid.id ? 'Aceptando...' : 'Contratar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                {new Date(bid.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          ))}
        </div>
        }

      </div>
    </div>
  );
}
