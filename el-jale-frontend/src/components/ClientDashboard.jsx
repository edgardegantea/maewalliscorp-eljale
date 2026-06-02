// src/components/ClientDashboard.jsx
import { useState, useEffect } from 'react';
import api, { storageUrl } from '../api/axios';
import useNotifications from '../hooks/useNotifications';
import ReviewModal from './ReviewModal';
import ChatModal from './ChatModal';
import BidsModal from './BidsModal';
import DisputeModal from './DisputeModal';
import toast from 'react-hot-toast';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { SkeletonRow } from './Skeleton';
import StarRating from './StarRating';
import ClientStatsWidget from './ClientStatsWidget';
import NotificationCenter from './NotificationCenter';
import PaymentModal from './PaymentModal';

const STATUS_CONFIG = {
  buscando:   { label: 'Buscando Experto', cls: 'badge-buscando' },
  asignado:   { label: 'En Progreso',      cls: 'badge-asignado' },
  completado: { label: 'Completado',       cls: 'badge-completado' },
  cancelado:  { label: 'Cancelado',        cls: 'badge-cancelado' },
};

export default function ClientDashboard() {
  const [categories, setCategories] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [newJob, setNewJob] = useState({ category_id: '', title: '', description: '', budget: '', address: '', preferred_date: '', preferred_time: '', urgency: 'normal' });
  const [photos, setPhotos] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [releasingId, setReleasingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [reviewJob, setReviewJob] = useState(null);
  const [chatJob, setChatJob] = useState(null);
  const [bidsJob, setBidsJob] = useState(null);
  const [disputeJob, setDisputeJob] = useState(null);
  const [paymentJob, setPaymentJob] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('jobs');
  const [favorites, setFavorites] = useState([]);
  const [favLoading, setFavLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));
  const { pending, refresh: refreshNotifications } = useNotifications(30000);

  // Pre-llenar formulario al llegar desde "Contratar directo"
  const [hireNote, setHireNote] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const expertName  = params.get('name');
    const paymentStatus = params.get('payment');
    const jobId       = params.get('job_id');

    if (expertName) {
      setHireNote(`Quiero contratar a ${expertName}`);
      setNewJob(prev => ({ ...prev, description: `Solicitud directa para ${expertName}.\n` }));
      setTimeout(() => document.getElementById('job-form')?.scrollIntoView({ behavior: 'smooth' }), 300);
    }

    if (paymentStatus === 'success' && jobId) {
      toast.success('¡Pago recibido! Tu dinero está protegido en escrow.');
      // Verificar estado actualizado
      api.get(`/jobs/${jobId}/mp/status`).then(() => fetchMyJobs()).catch(() => {});
    } else if (paymentStatus === 'failure') {
      toast.error('El pago no pudo procesarse. Intenta de nuevo.');
    } else if (paymentStatus === 'pending') {
      toast('Tu pago está pendiente de confirmación.', { icon: '⏳' });
    }
  }, [location.search]);

  useEffect(() => {
    fetchCategories();
    fetchMyJobs();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
      if (res.data.length > 0) {
        setNewJob(prev => ({ ...prev, category_id: res.data[0].id }));
      }
    } catch (err) {
      console.error('Error cargando categorías', err);
    }
  };

  const fetchMyJobs = async () => {
    try {
      const res = await api.get('/jobs/my-jobs');
      setMyJobs(res.data);
      refreshNotifications();
    } catch (err) {
      console.error('Error cargando trabajos', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchFavorites = async () => {
    setFavLoading(true);
    try {
      const res = await api.get('/favorites');
      setFavorites(res.data);
    } catch { toast.error('Error al cargar favoritos.'); }
    finally { setFavLoading(false); }
  };

  const handleRemoveFavorite = async (expertId) => {
    try {
      await api.post(`/favorites/${expertId}`);
      setFavorites(favorites.filter(f => f.id !== expertId));
      toast.success('Eliminado de favoritos.');
    } catch { toast.error('Error al actualizar favoritos.'); }
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const handleChange = (e) => {
    setNewJob({ ...newJob, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      Object.entries(newJob).forEach(([k, v]) => v && formData.append(k, v));
      photos.forEach(photo => formData.append('photos[]', photo));

      const res = await api.post('/jobs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage({ type: 'success', text: '¡Tu Jale ha sido publicado! Los expertos serán notificados.' });
      setMyJobs([res.data, ...myJobs]);
      setNewJob(prev => ({ ...prev, title: '', description: '', budget: '', address: '', preferred_date: '', preferred_time: '', urgency: 'normal' }));
      setPhotos([]);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error al publicar el trabajo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelJob = async (jobId) => {
    if (!window.confirm('¿Seguro que quieres cancelar este trabajo? Si hay pago retenido será devuelto.')) return;
    setCancellingId(jobId);
    try {
      const res = await api.post(`/jobs/${jobId}/cancel`);
      setMyJobs(myJobs.map(j => j.id === jobId ? { ...j, status: 'cancelado' } : j));
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cancelar.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleReleasePayment = async (jobId) => {
    if (!window.confirm('¿Confirmas que el trabajo está terminado y quieres liberar el pago al experto?')) return;
    setReleasingId(jobId);
    try {
      // Usar endpoint MP si el pago fue por MP, sino el legacy
      const job = myJobs.find(j => j.id === jobId);
      const endpoint = job?.payment?.mp_payment_id
        ? `/jobs/${jobId}/mp/release`
        : `/jobs/${jobId}/release-payment`;
      const res = await api.post(endpoint);
      const updatedJobs = myJobs.map(j =>
        j.id === jobId ? { ...j, status: 'completado', payment: { ...j.payment, status: 'liberado_al_experto' } } : j
      );
      setMyJobs(updatedJobs);
      toast.success(res.data.message);
      setReviewJob(updatedJobs.find(j => j.id === jobId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al liberar el pago.');
    } finally {
      setReleasingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {paymentJob && (
        <PaymentModal
          job={paymentJob}
          onClose={() => setPaymentJob(null)}
          onPaid={() => { setPaymentJob(null); fetchMyJobs(); toast.success('Verificando tu pago...'); }}
        />
      )}

      {reviewJob && (
        <ReviewModal
          job={reviewJob}
          onClose={() => setReviewJob(null)}
          onDone={() => { setReviewJob(null); fetchMyJobs(); }}
        />
      )}

      {chatJob && (
        <ChatModal job={chatJob} currentUserId={user?.id} onClose={() => setChatJob(null)} />
      )}
      {bidsJob && (
        <BidsModal job={bidsJob} onClose={() => setBidsJob(null)} onAccepted={() => { setBidsJob(null); fetchMyJobs(); }} />
      )}
      {disputeJob && (
        <DisputeModal job={disputeJob} onClose={() => setDisputeJob(null)} onSubmitted={fetchMyJobs} />
      )}

      <nav className="bg-white shadow-nav sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center gap-4">
            <span className="font-black text-2xl text-brand-dark shrink-0">
              El <span className="text-brand-primary">Jale</span>
            </span>

            <div className="flex items-center gap-2">
              <Link to="/explorar" className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:text-brand-primary hover:bg-orange-50 rounded-xl transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Expertos
              </Link>

              {pending > 0 && (
                <button onClick={fetchMyJobs} className="relative inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-brand-primary bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                  {pending} asignado{pending > 1 ? 's' : ''}
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-brand-primary rounded-full animate-ping" />
                </button>
              )}

              <NotificationCenter />

              <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
                <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">{user?.name}</span>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all" title="Salir">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

          {/* Columna Izquierda: Publicar trabajo */}
          <div className="xl:col-span-3 space-y-6">
            <div id="job-form" className="card overflow-hidden">
              <div className="bg-gradient-to-r from-brand-dark to-slate-800 px-6 py-5">
                <h2 className="text-xl font-bold text-white">¿Qué necesitas arreglar hoy?</h2>
                <p className="text-brand-accent/80 text-sm mt-1">Especialistas verificados listos para ayudarte.</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {hireNote && (
                  <div className="flex items-center gap-2 p-3 rounded-xl text-sm border bg-orange-50 border-orange-200 text-orange-800">
                    🎯 {hireNote} — describe el trabajo que necesitas.
                    <button type="button" onClick={() => setHireNote('')} className="ml-auto text-orange-500 hover:text-orange-700">✕</button>
                  </div>
                )}
                {message.text && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl text-sm border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
                    {message.type === 'success' ? '✓' : '✕'} {message.text}
                  </div>
                )}

                {/* Templates rápidos */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Inicio rápido</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { icon: '🚰', label: 'Fuga de agua',    title: 'Fuga de agua en el hogar',     desc: 'Tengo una fuga de agua que necesita reparación urgente. Por favor traer herramientas para tuberías de PVC y cobre.' },
                      { icon: '⚡', label: 'Problema eléctrico', title: 'Problema eléctrico en casa', desc: 'Tengo un problema eléctrico que requiere atención. Puede ser cortocircuito, contacto dañado o instalación nueva.' },
                      { icon: '🎨', label: 'Pintar cuarto',   title: 'Pintar una habitación',        desc: 'Necesito pintar una habitación. El cuarto mide aproximadamente __ m². Tengo preferencia de color: ________.' },
                      { icon: '🔧', label: 'Mantenimiento',   title: 'Mantenimiento general del hogar', desc: 'Necesito servicio de mantenimiento general: revisar plomería, electricidad y pequeñas reparaciones.' },
                      { icon: '❄️', label: 'Aire acondicionado', title: 'Servicio de aire acondicionado', desc: 'Mi aire acondicionado necesita servicio. Marca: ___, modelo: ___. Problema: no enfría / hace ruido / no enciende.' },
                    ].map(t => (
                      <button key={t.label} type="button"
                        onClick={() => setNewJob(prev => ({ ...prev, title: t.title, description: t.desc }))}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-orange-50 hover:text-brand-primary rounded-xl border border-gray-200 hover:border-orange-200 transition-all">
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Tipo de especialista</label>
                    <select name="category_id" value={newJob.category_id} onChange={handleChange} required className="input">
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Título del problema</label>
                    <input type="text" name="title" value={newJob.title} onChange={handleChange} required
                      placeholder="Ej. Fuga de agua, Pintar recámara, Cortocircuito..." className="input" />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Descripción detallada</label>
                    <textarea name="description" value={newJob.description} onChange={handleChange} rows="3" required
                      placeholder="Explica el problema para que el experto lleve las herramientas adecuadas..." className="input" />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Dirección del trabajo</label>
                    <input type="text" name="address" value={newJob.address} onChange={handleChange}
                      placeholder="Ej. Calle Juárez 45, Col. Centro" className="input" />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Presupuesto (Opcional)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                      <input type="number" name="budget" value={newJob.budget} onChange={handleChange}
                        min="0" step="0.01" placeholder="0.00"
                        className="input pl-7" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Promesa sin regateos ✓</p>
                  </div>

                  {/* Fecha preferida */}
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">¿Cuándo lo necesitas?</label>
                    <input type="date" name="preferred_date" value={newJob.preferred_date} onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="input" />
                  </div>

                  {/* Hora preferida */}
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Hora preferida (Opcional)</label>
                    <input type="time" name="preferred_time" value={newJob.preferred_time} onChange={handleChange}
                      className="input" />
                  </div>

                  {/* Urgencia */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Nivel de urgencia</label>
                    <div className="flex gap-3">
                      {[
                        { value: 'normal',  label: '📅 Normal',  desc: 'Puedo esperar' },
                        { value: 'urgente', label: '🚨 Urgente', desc: 'Lo necesito pronto' },
                      ].map(opt => (
                        <label key={opt.value} className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          newJob.urgency === opt.value
                            ? opt.value === 'urgente' ? 'border-red-400 bg-red-50' : 'border-brand-primary bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <input type="radio" name="urgency" value={opt.value} checked={newJob.urgency === opt.value} onChange={handleChange} className="sr-only" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                            <p className="text-xs text-gray-500">{opt.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Fotos del problema (Opcional, máx. 5)</label>
                  <input type="file" accept="image/*" multiple
                    onChange={e => setPhotos(Array.from(e.target.files).slice(0, 5))}
                    className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-brand-primary hover:file:bg-orange-100 cursor-pointer"
                  />
                  {photos.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {photos.map((f, i) => (
                        <div key={i} className="relative group">
                          <img src={URL.createObjectURL(f)} className="w-16 h-16 object-cover rounded-xl border border-gray-100" alt="" />
                          <button type="button" onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button type="submit" disabled={isSubmitting} className="btn-primary px-8">
                    {isSubmitting ? (
                      <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Publicando...</>
                    ) : '🔧 Publicar Jale'}
                  </button>
                </div>
              </form>
            </div>

            <ClientStatsWidget />

            {/* Pestañas: Mis Solicitudes / Mis Favoritos */}
            <div className="flex bg-white rounded-2xl p-1 shadow-card gap-1 w-fit">
              <button
                onClick={() => setActiveTab('jobs')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${activeTab === 'jobs' ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                Mis Solicitudes
              </button>
              <button
                onClick={() => { setActiveTab('favorites'); fetchFavorites(); }}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${activeTab === 'favorites' ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                ❤️ Favoritos
              </button>
            </div>

            {/* Tab: Mis Favoritos */}
            {activeTab === 'favorites' && (
              <div className="space-y-4">
                {favLoading ? (
                  <div className="flex justify-center py-10"><svg className="animate-spin w-8 h-8 text-brand-primary" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>
                ) : favorites.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                    <p className="text-4xl mb-3">❤️</p>
                    <p className="text-gray-500 text-sm">Aún no tienes expertos favoritos.</p>
                    <Link to="/explorar" className="mt-4 inline-block text-sm text-brand-primary hover:underline font-medium">
                      Explorar expertos →
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {favorites.map(expert => (
                      <div key={expert.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center text-white text-xl font-extrabold flex-shrink-0">
                          {expert.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link to={`/expertos/${expert.id}`} className="font-bold text-gray-900 hover:text-brand-primary transition-colors">
                            {expert.name}
                          </Link>
                          <p className="text-xs text-brand-primary font-medium mt-0.5">{expert.category?.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <StarRating value={Math.round(expert.avg_rating ?? 0)} readonly size="sm" />
                            <span className="text-xs text-gray-400">{expert.avg_rating > 0 ? Number(expert.avg_rating).toFixed(1) : 'Sin reseñas'}</span>
                          </div>
                          <span className={`mt-1.5 inline-flex items-center gap-1 text-xs font-medium ${expert.is_available ? 'text-emerald-600' : 'text-gray-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${expert.is_available ? 'bg-emerald-500' : 'bg-gray-300'}`}/>
                            {expert.is_available ? 'Disponible' : 'No disponible'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveFavorite(expert.id)}
                          className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                          title="Quitar de favoritos"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Mis Solicitudes */}
            {activeTab === 'jobs' && <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 space-y-3">
                {/* Fila: título + filtros */}
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-bold text-gray-900 flex-1">Mis Solicitudes</h2>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: 'all', label: 'Todos' },
                      { value: 'buscando', label: 'Buscando' },
                      { value: 'asignado', label: 'En progreso' },
                      { value: 'completado', label: 'Completados' },
                      { value: 'cancelado', label: 'Cancelados' },
                    ].map(f => (
                      <button
                        key={f.value}
                        onClick={() => setFilterStatus(f.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          filterStatus === f.value
                            ? 'bg-brand-primary text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Buscador */}
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar en mis solicitudes..."
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
                  )}
                </div>
              </div>

              {loadingJobs ? (
                <div className="divide-y divide-gray-100">
                  {[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}
                </div>
              ) : myJobs.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-gray-500">Aún no has publicado ningún trabajo.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {myJobs
                    .filter(j => filterStatus === 'all' || j.status === filterStatus)
                    .filter(j => !searchQuery ||
                      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      j.description.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(job => {
                    const status = STATUS_CONFIG[job.status] || { label: job.status, cls: 'badge-cancelado' };
                    return (
                      <div key={job.id} className="p-5 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-gray-900">{job.title}</h3>
                              {job.urgency === 'urgente' && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">🚨 Urgente</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{job.category?.name}</p>
                          </div>
                          <span className={status.cls}>
                            {status.label}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{job.description}</p>

                        <div className="flex flex-wrap gap-4 text-sm mb-3">
                          {job.budget && (
                            <span className="text-gray-700">
                              Presupuesto: <strong className="text-green-600">${job.budget}</strong>
                            </span>
                          )}
                          {job.address && (
                            <span className="text-gray-700">
                              Dirección: <strong>{job.address}</strong>
                            </span>
                          )}
                          {job.preferred_date && (
                            <span className="text-gray-700">
                              📅 <strong>{new Date(job.preferred_date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
                              {job.preferred_time && ` a las ${job.preferred_time.slice(0, 5)}`}
                            </span>
                          )}
                          {job.expert && (
                            <span className="text-gray-700">
                              Experto:{' '}
                              <Link
                                to={`/expertos/${job.expert.id}`}
                                className="font-bold text-brand-primary hover:underline"
                              >
                                {job.expert.name}
                              </Link>
                            </span>
                          )}
                        </div>

                        {/* Fotos del problema subidas por el cliente */}
                        {job.client_photos?.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-gray-500 mb-1">Fotos del problema:</p>
                            <div className="flex gap-2 flex-wrap">
                              {job.client_photos.map((path, i) => (
                                <a key={i} href={`${storageUrl}/${path}`} target="_blank" rel="noreferrer">
                                  <img src={`${storageUrl}/${path}`} className="w-14 h-14 object-cover rounded border hover:opacity-80" alt="" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Fotos de evidencia del experto */}
                        {job.expert_photos?.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-gray-500 mb-1">Evidencia del experto:</p>
                            <div className="flex gap-2 flex-wrap">
                              {job.expert_photos.map((path, i) => (
                                <a key={i} href={`${storageUrl}/${path}`} target="_blank" rel="noreferrer">
                                  <img src={`${storageUrl}/${path}`} className="w-14 h-14 object-cover rounded border hover:opacity-80" alt="" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Acciones según estado */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {job.status === 'buscando' && (
                            <button onClick={() => setBidsJob(job)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl text-white bg-brand-primary hover:bg-orange-600 transition-all">
                              💬 Ver cotizaciones
                            </button>
                          )}

                          {(job.status === 'asignado' || job.status === 'completado') && (
                            <button onClick={() => setChatJob(job)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl text-brand-primary bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-all">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                              </svg>
                              Chat con experto
                            </button>
                          )}

                          {/* Botón pagar — trabajo asignado sin pago todavía */}
                          {job.status === 'asignado' && (!job.payment || job.payment?.status === 'pendiente') && job.budget > 0 && (
                            <button
                              onClick={() => setPaymentJob(job)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-white bg-[#009EE3] hover:bg-[#0082c0] transition-colors"
                            >
                              💳 Pagar con MercadoPago
                            </button>
                          )}

                          {/* Pago pendiente de confirmación */}
                          {job.status === 'asignado' && job.payment?.status === 'pendiente' && job.payment?.mp_preference_id && (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl text-yellow-700 bg-yellow-50 border border-yellow-200">
                              ⏳ Pago en proceso
                            </span>
                          )}

                          {/* Pago retenido — confirmar trabajo */}
                          {job.status === 'asignado' && job.payment?.status === 'retenido_en_app' && (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg text-emerald-700 bg-emerald-50 border border-emerald-200">
                                🔒 ${ Number(job.payment.amount).toLocaleString('es-MX') } en escrow
                              </span>
                              <button
                                onClick={() => handleReleasePayment(job.id)}
                                disabled={releasingId === job.id}
                                className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-xl text-white bg-green-600 hover:bg-green-700 transition-colors ${releasingId === job.id ? 'opacity-75 cursor-not-allowed' : ''}`}
                              >
                                {releasingId === job.id ? 'Liberando...' : '✅ Confirmar trabajo terminado'}
                              </button>
                            </div>
                          )}

                          {job.status === 'completado' && !job.review && (
                            <button
                              onClick={() => setReviewJob(job)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-white bg-brand-primary hover:bg-orange-600 transition-colors"
                            >
                              ⭐ Calificar experto
                            </button>
                          )}

                          {job.review && (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md text-green-700 bg-green-50">
                              ✓ Calificado ({job.review.rating}/5)
                            </span>
                          )}

                          {/* Volver a contratar */}
                          {job.status === 'completado' && job.expert && (
                            <button
                              onClick={() => {
                                setNewJob(prev => ({
                                  ...prev,
                                  category_id: job.category_id ?? prev.category_id,
                                  title: job.title,
                                  description: job.description,
                                  address: job.address ?? '',
                                }));
                                setHireNote(`Volver a contratar a ${job.expert.name}`);
                                document.getElementById('job-form')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl text-brand-primary bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-all">
                              🔁 Volver a contratar
                            </button>
                          )}

                          {/* Descargar factura */}
                          {job.status === 'completado' && job.payment?.status === 'liberado_al_experto' && (
                            <a href={`${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/api/jobs/${job.id}/invoice`}
                              target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors">
                              📄 Descargar recibo
                            </a>
                          )}

                          {job.status === 'asignado' && !job.dispute && (
                            <button onClick={() => setDisputeJob(job)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-all">
                              ⚠️ Reportar problema
                            </button>
                          )}
                          {job.dispute && (
                            <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-xl text-red-600 bg-red-50 border border-red-100">
                              🔴 Disputa {job.dispute.status}
                            </span>
                          )}

                          {['buscando', 'asignado'].includes(job.status) && (
                            <button onClick={() => handleCancelJob(job.id)} disabled={cancellingId === job.id}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-xl text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50">
                              {cancellingId === job.id ? 'Cancelando...' : 'Cancelar trabajo'}
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>}</div>

          {/* Columna Derecha */}
          <div className="xl:col-span-1 space-y-4">
            {/* Garantía */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-dark to-slate-800 p-6 text-white">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-brand-primary/10 rounded-full" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-brand-accent/10 rounded-full blur-xl" />
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-brand-primary/20 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>
                <h4 className="font-bold text-white mb-1">Pago Seguro</h4>
                <p className="text-xs text-gray-300 leading-relaxed">Tu dinero está protegido. Lo liberamos al experto solo cuando confirmes que el trabajo quedó perfecto.</p>
              </div>
            </div>

            {/* Cómo funciona */}
            <div className="card p-5">
              <h4 className="font-bold text-sm text-gray-900 mb-4">¿Cómo funciona?</h4>
              <ol className="space-y-3">
                {[
                  { icon: '📝', text: 'Publicas tu Jale con el problema y presupuesto.' },
                  { icon: '🔍', text: 'Un experto verificado lo acepta.' },
                  { icon: '🔧', text: 'El experto realiza el trabajo.' },
                  { icon: '✅', text: 'Confirmas y se libera el pago.' },
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-sm">
                      {step.icon}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mt-1">{step.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
