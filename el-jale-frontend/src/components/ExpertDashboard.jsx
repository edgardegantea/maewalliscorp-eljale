// src/components/ExpertDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { storageUrl } from '../api/axios';
import useNotifications from '../hooks/useNotifications';
import ChatModal from './ChatModal';
import StarRating from './StarRating';
import toast from 'react-hot-toast';
import { SkeletonCard } from './Skeleton';
import ExpertStatsWidget from './ExpertStatsWidget';
import NotificationCenter from './NotificationCenter';
import IdentityVerification from './IdentityVerification';
import LocationPicker from './LocationPicker';
import ExpertOnboarding from './ExpertOnboarding';
import PremiumCard from './PremiumCard';
import PhoneVerification from './PhoneVerification';
import ReferralWidget from './ReferralWidget';

const STATUS_CONFIG = {
  asignado:   { label: 'En Progreso',  color: 'bg-blue-100 text-blue-800' },
  completado: { label: 'Completado',   color: 'bg-green-100 text-green-800' },
  cancelado:  { label: 'Cancelado',    color: 'bg-red-100 text-red-700' },
};

export default function ExpertDashboard() {
  // user debe declararse ANTES de usarse en los useState
  const user = JSON.parse(localStorage.getItem('user'));
  const isVerified = user?.expert_profile?.is_verified ?? false;

  const [availableJobs, setAvailableJobs] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('available');
  const [chatJob, setChatJob] = useState(null);
  const [uploadingFor, setUploadingFor] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bio, setBio] = useState(user?.expert_profile?.bio ?? '');
  const [hourlyRate, setHourlyRate] = useState(user?.expert_profile?.hourly_rate ?? '');
  const [location, setLocation] = useState({
    city: user?.expert_profile?.city ?? '',
    state: user?.expert_profile?.state ?? '',
    latitude: user?.expert_profile?.latitude ?? null,
    longitude: user?.expert_profile?.longitude ?? null,
    coverage_radius_km: user?.expert_profile?.coverage_radius_km ?? 15,
  });
  const [savingBio, setSavingBio] = useState(false);
  const [evidencePhotos, setEvidencePhotos] = useState([]);
  const [uploadMsg, setUploadMsg] = useState({ id: null, text: '', type: '' });
  const [isAvailable, setIsAvailable] = useState(user?.expert_profile?.is_available ?? true);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    !user?.expert_profile?.onboarding_completed
  );
  const [bidJob, setBidJob] = useState(null);
  const [bidForm, setBidForm] = useState({ message: '', amount: '' });
  const [submittingBid, setSubmittingBid] = useState(false);
  const [availableDays, setAvailableDays] = useState(
    user?.expert_profile?.available_days ?? []
  );
  const [availableFrom, setAvailableFrom] = useState(user?.expert_profile?.available_from ?? '09:00');
  const [availableTo, setAvailableTo]     = useState(user?.expert_profile?.available_to   ?? '18:00');
  // Portfolio
  const [portfolio, setPortfolio] = useState([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioFiles, setPortfolioFiles] = useState([]);
  const [portfolioCaptions, setPortfolioCaptions] = useState([]);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);
  // Mis cotizaciones
  const [myBids, setMyBids] = useState([]);
  const [myBidsLoading, setMyBidsLoading] = useState(false);
  const navigate  = useNavigate();
  const { pending, refresh: refreshNotifications } = useNotifications(30000);

  // Detectar retorno de pago premium
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('premium') === 'success') {
      toast.success('¡Membresía Premium activada! Ahora apareces primero en las búsquedas.');
      window.history.replaceState({}, '', '/expert-dashboard');
    } else if (params.get('premium') === 'failure') {
      toast.error('El pago no pudo procesarse. Intenta de nuevo.');
      window.history.replaceState({}, '', '/expert-dashboard');
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchAvailableJobs(), fetchActiveJobs()]).finally(() => setLoading(false));
  }, []);

  const fetchAvailableJobs = async () => {
    try {
      const res = await api.get('/jobs/available');
      setAvailableJobs(res.data);
      refreshNotifications();
    } catch (err) {
      setError('No se pudieron cargar los trabajos disponibles.');
    }
  };

  const handleToggleAvailability = async () => {
    setTogglingAvail(true);
    try {
      const r = await api.post('/expert-profile/availability');
      setIsAvailable(r.data.is_available);
      toast.success(r.data.message);
    } catch { toast.error('Error al cambiar disponibilidad'); }
    finally { setTogglingAvail(false); }
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    if (!bidForm.message.trim()) return;
    setSubmittingBid(true);
    try {
      await api.post(`/jobs/${bidJob.id}/bids`, { message: bidForm.message, amount: bidForm.amount || null });
      toast.success('¡Cotización enviada! El cliente la revisará pronto.');
      setBidJob(null);
      setBidForm({ message: '', amount: '' });
      setAvailableJobs(availableJobs.filter(j => j.id !== bidJob.id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al enviar cotización');
    } finally { setSubmittingBid(false); }
  };

  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      await api.put('/expert-profile', {
        bio,
        hourly_rate: hourlyRate || null,
        available_days: availableDays,
        available_from: availableFrom,
        available_to: availableTo,
        ...location,
      });
      toast.success('Perfil actualizado.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar.');
    } finally {
      setSavingBio(false);
    }
  };

  const handleCancelJob = async (jobId) => {
    if (!window.confirm('¿Seguro que quieres liberar este trabajo? El cliente deberá buscar otro experto.')) return;
    setCancellingId(jobId);
    try {
      const res = await api.post(`/jobs/${jobId}/cancel`);
      setActiveJobs(activeJobs.map(j => j.id === jobId ? { ...j, status: 'cancelado' } : j));
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cancelar.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleUploadEvidence = async (jobId) => {
    if (evidencePhotos.length === 0) return;
    setUploadingFor(jobId);
    const formData = new FormData();
    evidencePhotos.forEach(p => formData.append('photos[]', p));
    try {
      await api.post(`/jobs/${jobId}/expert-photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Fotos subidas. El cliente podrá verlas antes de liberar el pago.');
      setUploadMsg({ id: jobId, text: '', type: '' });
      setEvidencePhotos([]);
      fetchActiveJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al subir fotos.');
      setUploadMsg({ id: jobId, text: err.response?.data?.message || 'Error al subir fotos.', type: 'error' });
    } finally {
      setUploadingFor(null);
    }
  };

  const fetchActiveJobs = async () => {
    try {
      const res = await api.get('/jobs/my-active-jobs');
      setActiveJobs(res.data);
    } catch (err) {
      console.error('Error cargando trabajos activos', err);
    }
  };

  const handleAcceptJob = async (jobId) => {
    try {
      const res = await api.post(`/jobs/${jobId}/accept`);
      const accepted = availableJobs.find(j => j.id === jobId);
      setAvailableJobs(availableJobs.filter(j => j.id !== jobId));
      if (accepted) {
        setActiveJobs([{ ...accepted, status: 'asignado', expert_id: user?.id }, ...activeJobs]);
      }
      toast.success(res.data.message);
      setActiveTab('active');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al aceptar el trabajo');
    }
  };

  const fetchPortfolio = async () => {
    setPortfolioLoading(true);
    try {
      const res = await api.get('/portfolio');
      setPortfolio(res.data);
    } catch { toast.error('Error al cargar portfolio'); }
    finally { setPortfolioLoading(false); }
  };

  const handlePortfolioUpload = async () => {
    if (portfolioFiles.length === 0) return;
    setUploadingPortfolio(true);
    const formData = new FormData();
    portfolioFiles.forEach(f => formData.append('photos[]', f));
    portfolioCaptions.forEach((c, i) => formData.append(`captions[${i}]`, c));
    try {
      await api.post('/portfolio', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Fotos agregadas al portfolio.');
      setPortfolioFiles([]);
      setPortfolioCaptions([]);
      fetchPortfolio();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al subir fotos.');
    } finally { setUploadingPortfolio(false); }
  };

  const handleDeletePortfolioPhoto = async (id) => {
    if (!window.confirm('¿Eliminar esta foto del portfolio?')) return;
    setDeletingPhotoId(id);
    try {
      await api.delete(`/portfolio/${id}`);
      setPortfolio(portfolio.filter(p => p.id !== id));
      toast.success('Foto eliminada.');
    } catch { toast.error('Error al eliminar foto.'); }
    finally { setDeletingPhotoId(null); }
  };

  const fetchMyBids = async () => {
    setMyBidsLoading(true);
    try {
      const res = await api.get('/my-bids');
      setMyBids(res.data);
    } catch { toast.error('Error al cargar cotizaciones.'); }
    finally { setMyBidsLoading(false); }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <svg className="animate-spin w-10 h-10 text-brand-primary mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          <p className="text-gray-500 text-sm font-medium">Cargando oportunidades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {chatJob && (
        <ChatModal job={chatJob} currentUserId={user?.id} onClose={() => setChatJob(null)} />
      )}

      {/* Modal de cotización */}
      {bidJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setBidJob(null); }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-brand-dark to-slate-800 px-6 py-4 rounded-t-2xl sticky top-0 z-10">
              <h3 className="font-bold text-white">Enviar cotización</h3>
              <p className="text-gray-300 text-xs mt-0.5 truncate">{bidJob.title}</p>
              {bidJob.budget && (
                <p className="text-brand-accent text-xs font-semibold mt-1">
                  💰 Presupuesto del cliente: ${Number(bidJob.budget).toLocaleString('es-MX')}
                </p>
              )}
            </div>
            <form onSubmit={handleSubmitBid} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Respuestas rápidas</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    { label: '👋 Presentación', text: `Hola, soy ${user?.name}. Tengo experiencia con este tipo de trabajo y puedo resolverlo de forma rápida y profesional. ¿Cuándo le queda bien que pase a revisar?` },
                    { label: '⚡ Disponible hoy', text: `Hola, tengo disponibilidad hoy mismo para atenderle. Cuento con todo el equipo necesario. ¿A qué hora le conviene?` },
                    { label: '🔍 Diagnóstico gratis', text: `Hola, ofrezco diagnóstico sin costo. Una vez que revise el problema le doy la cotización exacta. ¿Cuándo puedo pasar?` },
                    { label: '✅ Trabajo garantizado', text: `Hola, mi trabajo tiene garantía. Si algo no queda bien, regreso sin costo extra. Con gusto le ayudo.` },
                  ].map(t => (
                    <button key={t.label} type="button"
                      onClick={() => setBidForm(f => ({ ...f, message: t.text }))}
                      className="text-xs font-medium text-gray-600 bg-gray-100 hover:bg-orange-50 hover:text-brand-primary border border-gray-200 hover:border-orange-200 px-2.5 py-1.5 rounded-xl transition-all">
                      {t.label}
                    </button>
                  ))}
                </div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tu mensaje *</label>
                <textarea rows={4} required value={bidForm.message} onChange={e => setBidForm({...bidForm, message: e.target.value})}
                  maxLength={500} placeholder="Preséntate, describe tu experiencia y cómo resolverías el problema..."
                  className="input resize-none" />
                <p className="text-xs text-gray-400 text-right mt-0.5">{bidForm.message.length}/500</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tu precio (opcional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
                  <input type="number" min="0" step="0.01" value={bidForm.amount} onChange={e => setBidForm({...bidForm, amount: e.target.value})}
                    placeholder="0.00" className="input pl-7" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Deja vacío para cotizar al ver el trabajo en persona.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setBidJob(null)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={submittingBid || !bidForm.message.trim()} className="btn-primary flex-1">
                  {submittingBid ? 'Enviando...' : '📤 Enviar cotización'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showOnboarding && (
        <ExpertOnboarding
          user={user}
          onComplete={() => {
            setShowOnboarding(false);
            // Actualizar localStorage
            const stored = JSON.parse(localStorage.getItem('user') || '{}');
            if (stored.expert_profile) stored.expert_profile.onboarding_completed = true;
            localStorage.setItem('user', JSON.stringify(stored));
          }}
        />
      )}

      <nav className="bg-brand-dark shadow-lg sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="font-black text-2xl text-white">El <span className="text-brand-primary">Jale</span></span>
              {user?.expert_profile?.is_founding_member && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-brand-accent/20 text-brand-accent text-xs font-bold rounded-full">
                  ⭐ Fundador
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {pending > 0 && (
                <button onClick={() => { fetchAvailableJobs(); setActiveTab('available'); }}
                  className="relative inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-brand-primary rounded-xl hover:bg-orange-600 transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                  {pending} nuevo{pending > 1 ? 's' : ''}
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-brand-accent rounded-full animate-ping" />
                </button>
              )}
              {/* Toggle disponibilidad */}
              <button onClick={handleToggleAvailability} disabled={togglingAvail}
                className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${isAvailable ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30'}`}>
                <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
                {togglingAvail ? '...' : isAvailable ? 'Disponible' : 'No disponible'}
              </button>

              <div className="[&_button]:text-gray-300 [&_button:hover]:text-white [&_button:hover]:bg-white/10">
                <NotificationCenter />
              </div>

              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-300 max-w-[120px] truncate">{user?.name}</span>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="Salir">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Mi Panel</h1>
          <p className="mt-1 text-sm text-gray-600">Administra tus oportunidades y trabajos en curso.</p>
        </div>

        <ExpertStatsWidget />

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6 font-medium">{error}</div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-100 mb-6 bg-white rounded-2xl p-1 shadow-card gap-1 w-fit">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'available'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Disponibles
            {availableJobs.length > 0 && (
              <span className="ml-2 bg-brand-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {availableJobs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'active'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Mis Jales
            {activeJobs.length > 0 && (
              <span className="ml-2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {activeJobs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('bids'); fetchMyBids(); }}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'bids'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Mis Cotizaciones
          </button>
          <button
            onClick={() => { setActiveTab('portfolio'); fetchPortfolio(); }}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'portfolio'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Portfolio
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'profile'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Mi Perfil
          </button>
        </div>

        {/* Banner de verificación pendiente */}
        {!isVerified && activeTab !== 'profile' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-yellow-800">Tu cuenta está pendiente de verificación</p>
              <p className="text-xs text-yellow-700 mt-0.5">
                El equipo de El Jale revisará tu perfil en las próximas horas. Una vez verificado podrás ver y aceptar trabajos.
                Mientras tanto, completa tu bio en la pestaña <button onClick={() => setActiveTab('profile')} className="underline font-medium">Mi Perfil</button>.
              </p>
            </div>
          </div>
        )}

        {/* Tab: Trabajos Disponibles */}
        {activeTab === 'available' && !isVerified && (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
            <svg className="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h3 className="mt-3 text-sm font-bold text-gray-900">Verificación en proceso</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-xs mx-auto">
              Los trabajos disponibles aparecerán aquí una vez que el equipo de El Jale verifique tu cuenta.
            </p>
          </div>
        )}

        {activeTab === 'available' && isVerified && (
          <>
            {/* Buscador */}
            <div className="mb-5 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por título o descripción..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-white"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
              )}
            </div>
            {loading ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : availableJobs.filter(j =>
                !searchQuery ||
                j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                j.description.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay trabajos nuevos</h3>
                <p className="mt-1 text-sm text-gray-500">Te avisaremos cuando alguien de tu zona necesite tus servicios.</p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {availableJobs.filter(j =>
                  !searchQuery ||
                  j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  j.description.toLowerCase().includes(searchQuery.toLowerCase())
                ).map(job => {
                    // Score de matching IA: urgencia + presupuesto + novedad
                    const urgencyScore  = job.urgency === 'urgente' ? 35 : 10;
                    const budgetScore   = job.budget ? Math.min(35, Math.round((Number(job.budget) / 1500) * 35)) : 15;
                    const minsPassed    = Math.floor((Date.now() - new Date(job.created_at)) / 60000);
                    const freshScore    = Math.max(0, 30 - Math.floor(minsPassed / 2));
                    const matchScore    = Math.min(99, urgencyScore + budgetScore + freshScore);
                    const scoreColor    = matchScore >= 75 ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                                        : matchScore >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200'
                                        : 'text-gray-500 bg-gray-50 border-gray-200';
                    return (
                  <div key={job.id} className={`flex flex-col bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-all ${job.urgency === 'urgente' ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-100'}`}>
                    <div className="p-5 flex-grow">
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h3 className="text-base font-bold text-gray-900 leading-tight">{job.title}</h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`px-2 py-0.5 text-[10px] font-black rounded-full border ${scoreColor}`}>
                            🤖 {matchScore}%
                          </span>
                          {job.urgency === 'urgente'
                            ? <span className="px-2 py-1 text-[10px] font-black text-red-700 bg-red-100 rounded-full">🚨 URGENTE</span>
                            : <span className="px-2 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">● Nuevo</span>
                          }
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 mb-2">
                        🕒 {(() => {
                          const mins = Math.floor((Date.now() - new Date(job.created_at)) / 60000);
                          return mins < 60 ? `Hace ${mins} min` : mins < 1440 ? `Hace ${Math.floor(mins/60)}h` : `Hace ${Math.floor(mins/1440)}d`;
                        })()}
                        {job.address && ` · 📍 ${job.address}`}
                      </p>

                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{job.description}</p>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {job.budget && (
                          <div className="bg-emerald-50 rounded-xl px-3 py-2">
                            <p className="text-[10px] text-gray-400 font-medium">Presupuesto</p>
                            <p className="text-sm font-black text-emerald-600">${Number(job.budget).toLocaleString('es-MX')}</p>
                          </div>
                        )}
                        {job.preferred_date && (
                          <div className="bg-blue-50 rounded-xl px-3 py-2">
                            <p className="text-[10px] text-gray-400 font-medium">Fecha</p>
                            <p className="text-xs font-bold text-blue-700">
                              {new Date(job.preferred_date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-bold text-orange-600">
                          {job.client?.name?.[0]?.toUpperCase()}
                        </div>
                        <span>{job.client?.name}</span>
                        {job.client?.avg_rating > 0 && (
                          <span className="text-amber-500 font-semibold">⭐ {Number(job.client.avg_rating).toFixed(1)}</span>
                        )}
                        {job.payment_method && (
                          <span className="ml-auto text-[10px] bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                            {job.payment_method === 'mercadopago' ? '💳 MP' : job.payment_method === 'efectivo' ? '💵 Efectivo' : job.payment_method}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex gap-2">
                      <button onClick={() => setBidJob(job)}
                        className="flex-1 text-sm font-semibold text-white bg-brand-primary hover:bg-orange-600 py-2 rounded-xl transition-all active:scale-95">
                        💬 Cotizar
                      </button>
                      <button onClick={() => handleAcceptJob(job.id)}
                        className="px-4 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 py-2 rounded-xl border border-gray-200 transition-all">
                        ✓ Acepto
                      </button>
                    </div>
                  </div>
                  );
                  })}
              </div>
            )}
          </>
        )}

        {/* Tab: Mis Jales Activos */}
        {activeTab === 'active' && (
          <>
            {activeJobs.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-5">
                {[
                  { value: 'all', label: 'Todos' },
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
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
            {activeJobs.filter(j => filterStatus === 'all' || j.status === filterStatus).length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Sin trabajos activos</h3>
                <p className="mt-1 text-sm text-gray-500">Los trabajos que aceptes aparecerán aquí.</p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {activeJobs.filter(j => filterStatus === 'all' || j.status === filterStatus).map(job => {
                  const status = STATUS_CONFIG[job.status] || { label: job.status, color: 'bg-gray-100 text-gray-700' };
                  return (
                    <div key={job.id} className="flex flex-col bg-white rounded-lg shadow-md border-l-4 border-blue-500 overflow-hidden">
                      <div className="p-5 flex-grow">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{job.description}</p>

                        <div className="text-sm space-y-1">
                          <div>
                            <span className="font-medium text-gray-900">Cliente:</span>{' '}
                            <span className="text-gray-600">{job.client?.name}</span>
                          </div>
                          {job.category && (
                            <div>
                              <span className="font-medium text-gray-900">Oficio:</span>{' '}
                              <span className="text-gray-600">{job.category.name}</span>
                            </div>
                          )}
                          {job.budget && (
                            <div>
                              <span className="font-medium text-gray-900">Pago:</span>{' '}
                              <span className={`font-bold ${job.payment?.status === 'liberado_al_experto' ? 'text-green-600' : 'text-yellow-600'}`}>
                                ${job.budget} — {job.payment?.status === 'liberado_al_experto' ? 'Liberado' : 'Retenido (se libera al completar)'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Botones de acción */}
                      {(job.status === 'asignado' || job.status === 'completado') && (
                        <div className="px-5 pt-3 pb-1 flex flex-wrap gap-2">
                          <button
                            onClick={() => setChatJob(job)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl text-brand-primary bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                            </svg>
                            Chat
                          </button>

                          {/* 🚗 Estoy en camino con GPS */}
                          {job.status === 'asignado' && (
                            <button
                              onClick={() => {
                                if (!navigator.geolocation) { toast.error('Tu dispositivo no soporta GPS'); return; }
                                navigator.geolocation.getCurrentPosition(
                                  (pos) => {
                                    const { latitude, longitude } = pos.coords;
                                    const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                                    api.post(`/jobs/${job.id}/messages`, {
                                      body: `🚗 Estoy en camino. Mi ubicación actual: ${mapsUrl}`
                                    }).then(() => {
                                      toast.success('📍 Ubicación compartida con el cliente');
                                      setChatJob(job);
                                    }).catch(() => toast.error('No se pudo enviar la ubicación'));
                                  },
                                  () => toast.error('No se pudo obtener tu ubicación. Activa el GPS.')
                                );
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all">
                              🚗 Estoy en camino
                            </button>
                          )}

                          {job.status === 'asignado' && (
                            <button onClick={() => handleCancelJob(job.id)} disabled={cancellingId === job.id}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-xl text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50">
                              {cancellingId === job.id ? 'Cancelando...' : 'Liberar trabajo'}
                            </button>
                          )}
                          {job.status === 'completado' && job.payment?.status === 'liberado_al_experto' && (
                            <button
                              onClick={async () => {
                                try {
                                  const res = await api.get(`/jobs/${job.id}/invoice`, { responseType: 'blob' });
                                  const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                                  const a   = document.createElement('a');
                                  a.href     = url;
                                  a.download = `recibo-eljale-${job.id}.pdf`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                } catch { toast.error('No se pudo descargar el recibo.'); }
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors">
                              📄 Descargar recibo
                            </button>
                          )}
                        </div>
                      )}

                      {/* Calificación recibida */}
                      {job.review && (
                        <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-3">
                          <StarRating value={job.review.rating} readonly size="sm" />
                          {job.review.comment && (
                            <p className="text-xs text-gray-500 italic">"{job.review.comment}"</p>
                          )}
                        </div>
                      )}

                      {/* Fotos del cliente */}
                      {job.client_photos?.length > 0 && (
                        <div className="px-5 py-3 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-2">Fotos del problema:</p>
                          <div className="flex gap-2 flex-wrap">
                            {job.client_photos.map((path, i) => (
                              <a key={i} href={`${storageUrl}/${path}`} target="_blank" rel="noreferrer">
                                <img src={`${storageUrl}/${path}`} className="w-14 h-14 object-cover rounded border hover:opacity-80" alt="" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Upload de fotos de evidencia (solo en trabajos asignados) */}
                      {job.status === 'asignado' && (
                        <div className="px-5 py-3 border-t border-blue-100 bg-blue-50">
                          <p className="text-xs font-medium text-blue-800 mb-2">Sube fotos del trabajo terminado para que el cliente libere el pago:</p>

                          {job.expert_photos?.length > 0 && (
                            <div className="flex gap-2 flex-wrap mb-2">
                              {job.expert_photos.map((path, i) => (
                                <img key={i} src={`${storageUrl}/${path}`} className="w-12 h-12 object-cover rounded border" alt="" />
                              ))}
                            </div>
                          )}

                          {uploadMsg.id === job.id && (
                            <p className={`text-xs mb-2 font-medium ${uploadMsg.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                              {uploadMsg.text}
                            </p>
                          )}

                          <div className="flex items-center gap-2">
                            <input
                              type="file" accept="image/*" multiple
                              onChange={e => setEvidencePhotos(Array.from(e.target.files).slice(0, 5))}
                              className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-white file:text-blue-700"
                            />
                            <button
                              onClick={() => handleUploadEvidence(job.id)}
                              disabled={uploadingFor === job.id || evidencePhotos.length === 0}
                              className="flex-shrink-0 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                            >
                              {uploadingFor === job.id ? 'Subiendo...' : 'Subir'}
                            </button>
                          </div>
                        </div>
                      )}

                      {job.status === 'completado' && (
                        <div className="bg-green-50 px-5 py-3 border-t border-green-100 text-xs text-green-700 font-medium">
                          Trabajo completado y pago liberado.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Tab: Mis Cotizaciones */}
        {activeTab === 'bids' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Mis Cotizaciones Enviadas</h2>
            {myBidsLoading ? (
              <div className="flex justify-center py-10"><svg className="animate-spin w-8 h-8 text-brand-primary" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>
            ) : myBids.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-gray-500 text-sm">Aún no has enviado cotizaciones.</p>
                <button onClick={() => setActiveTab('available')} className="mt-4 text-sm text-brand-primary hover:underline font-medium">
                  Ver trabajos disponibles →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myBids.map(bid => {
                  const statusConfig = {
                    pendiente: { label: 'Pendiente', cls: 'bg-yellow-100 text-yellow-800' },
                    aceptada:  { label: 'Aceptada',  cls: 'bg-green-100 text-green-800' },
                    rechazada: { label: 'Rechazada', cls: 'bg-red-100 text-red-700' },
                  };
                  const sc = statusConfig[bid.status] || { label: bid.status, cls: 'bg-gray-100 text-gray-700' };
                  return (
                    <div key={bid.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{bid.job?.title ?? 'Trabajo'}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{bid.job?.category?.name ?? ''}</p>
                        </div>
                        <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${sc.cls}`}>{sc.label}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 italic">"{bid.message}"</p>
                      {bid.amount && (
                        <p className="mt-1 text-sm font-semibold text-brand-primary">${Number(bid.amount).toLocaleString('es-MX')}</p>
                      )}
                      <p className="mt-2 text-xs text-gray-400">
                        Enviada el {new Date(bid.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Portfolio */}
        {activeTab === 'portfolio' && (
          <div className="max-w-3xl space-y-6">
            {/* Subir fotos */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-brand-dark px-6 py-4">
                <h2 className="text-lg font-bold text-white">Agregar fotos al portfolio</h2>
                <p className="text-brand-accent text-sm mt-0.5">Muestra tus mejores trabajos. Máximo 12 fotos en total.</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Seleccionar fotos (máx. 6 a la vez)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => {
                      const files = Array.from(e.target.files).slice(0, 6);
                      setPortfolioFiles(files);
                      setPortfolioCaptions(files.map(() => ''));
                    }}
                    className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-primary file:text-white file:text-sm file:font-medium hover:file:bg-orange-600 cursor-pointer"
                  />
                </div>

                {portfolioFiles.length > 0 && (
                  <div className="space-y-2">
                    {portfolioFiles.map((file, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <img src={URL.createObjectURL(file)} className="w-12 h-12 object-cover rounded-lg border" alt="" />
                        <input
                          type="text"
                          placeholder={`Descripción (opcional)`}
                          value={portfolioCaptions[i] || ''}
                          onChange={e => {
                            const caps = [...portfolioCaptions];
                            caps[i] = e.target.value;
                            setPortfolioCaptions(caps);
                          }}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                        />
                      </div>
                    ))}
                    <button
                      onClick={handlePortfolioUpload}
                      disabled={uploadingPortfolio}
                      className="mt-2 px-5 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-75"
                    >
                      {uploadingPortfolio ? 'Subiendo...' : `📤 Subir ${portfolioFiles.length} foto${portfolioFiles.length > 1 ? 's' : ''}`}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Galería actual */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-900 mb-4">Mis fotos ({portfolio.length}/12)</h3>
              {portfolioLoading ? (
                <div className="flex justify-center py-8"><svg className="animate-spin w-7 h-7 text-brand-primary" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>
              ) : portfolio.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Aún no tienes fotos. ¡Sube tus mejores trabajos!</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {portfolio.map(photo => (
                    <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl">
                      <img
                        src={`${storageUrl}/${photo.photo_path}`}
                        alt={photo.caption || ''}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {photo.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2">
                          <p className="text-white text-xs">{photo.caption}</p>
                        </div>
                      )}
                      <button
                        onClick={() => handleDeletePortfolioPhoto(photo.id)}
                        disabled={deletingPhotoId === photo.id}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                        title="Eliminar"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Mi Perfil */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl space-y-6">

            {/* Completeness indicator */}
            {(() => {
              const profile = user?.expert_profile;
              const checks = [
                { label: 'Bio escrita',            done: bio?.trim().length > 30 },
                { label: 'Tarifa por hora',         done: !!hourlyRate },
                { label: 'Zona de cobertura',       done: !!(location.city && location.state) },
                { label: 'Identidad verificada',    done: !!profile?.is_verified },
                { label: 'Foto en portfolio',       done: portfolio.length > 0 },
                { label: 'Teléfono verificado',     done: !!user?.phone_verified },
              ];
              const pct = Math.round((checks.filter(c => c.done).length / checks.length) * 100);
              if (pct === 100) return null;
              return (
                <div className="bg-white rounded-2xl border border-orange-100 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-gray-900">Completa tu perfil para recibir más trabajos</p>
                    <span className="text-lg font-black text-orange-500">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                    <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {checks.map(c => (
                      <div key={c.label} className={`flex items-center gap-2 text-xs ${c.done ? 'text-emerald-600' : 'text-gray-500'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${c.done ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                          {c.done ? '✓' : '○'}
                        </span>
                        {c.label}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">Los perfiles completos reciben hasta 3× más cotizaciones aceptadas.</p>
                </div>
              );
            })()}

            {/* Info del perfil */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-brand-dark px-6 py-4">
                <h2 className="text-lg font-bold text-white">Mi Perfil Público</h2>
                <p className="text-brand-accent text-sm mt-0.5">Los clientes verán esta información antes de contactarte.</p>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase mb-1">Oficio</p>
                    <p className="font-bold text-gray-900">{user?.expert_profile?.category?.name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase mb-1">Experiencia</p>
                    <p className="font-bold text-gray-900">{user?.expert_profile?.experience_years ?? '—'} años</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase mb-1">Estado</p>
                    {isVerified
                      ? <span className="inline-flex items-center gap-1 text-green-700 font-bold"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>Verificado</span>
                      : <span className="text-yellow-600 font-bold">Pendiente de verificación</span>
                    }
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase mb-1">Membresía</p>
                    <p className="font-bold text-gray-900">{user?.expert_profile?.is_founding_member ? '⭐ Socio Fundador' : 'Estándar'}</p>
                  </div>
                </div>

                {/* Zona de cobertura */}
                <LocationPicker
                  city={location.city}
                  state={location.state}
                  radius={location.coverage_radius_km}
                  onChange={updates => setLocation(prev => ({ ...prev, ...updates }))}
                />

                {/* Tarifa por hora */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tarifa por hora <span className="text-gray-400 font-normal">(opcional, se muestra en tu perfil)</span>
                  </label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={hourlyRate}
                      onChange={e => setHourlyRate(e.target.value)}
                      placeholder="Ej. 250.00"
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 pl-7 pr-3 text-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Los clientes verán "desde $X/hora" en tu perfil.</p>
                </div>

                {/* Disponibilidad semanal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📅 Días disponibles <span className="text-gray-400 font-normal">(los clientes lo verán en tu perfil)</span>
                  </label>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => {
                      const active = availableDays.includes(d);
                      return (
                        <button key={d} type="button"
                          onClick={() => setAvailableDays(prev => active ? prev.filter(x => x !== d) : [...prev, d])}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${active ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300'}`}>
                          {d}
                        </button>
                      );
                    })}
                  </div>
                  {availableDays.length > 0 && (
                    <div className="flex items-center gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Desde</label>
                        <input type="time" value={availableFrom} onChange={e => setAvailableFrom(e.target.value)}
                          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30" />
                      </div>
                      <span className="text-gray-400 mt-4">–</span>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                        <input type="time" value={availableTo} onChange={e => setAvailableTo(e.target.value)}
                          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30" />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tu bio <span className="text-gray-400 font-normal">(máx. 600 caracteres)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    maxLength={600}
                    placeholder="Cuéntale a los clientes tu experiencia, especialidades y por qué deberían elegirte..."
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-400">{bio.length}/600</span>
                    <button
                      onClick={handleSaveBio}
                      disabled={savingBio}
                      className="px-4 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-orange-600 rounded-md transition-colors disabled:opacity-75"
                    >
                      {savingBio ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Membresía Premium */}
            <PremiumCard />

            {/* Verificación de teléfono */}
            <PhoneVerification user={user} onVerified={() => {
              const u = JSON.parse(localStorage.getItem('user') || '{}');
              u.phone_verified = true;
              localStorage.setItem('user', JSON.stringify(u));
            }} />

            {/* Referidos */}
            <ReferralWidget />

            {/* Verificación de identidad */}
            <IdentityVerification />

            {/* Vista previa del perfil */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Vista previa pública</p>
              <Link to={`/expertos/${user?.id}`} className="text-brand-primary text-sm font-medium hover:underline flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Ver cómo me ven los clientes
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
