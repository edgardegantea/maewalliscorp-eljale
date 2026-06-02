// src/components/ExpertDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { storageUrl } from '../api/axios';
import useNotifications from '../hooks/useNotifications';
import JobChat from './JobChat';
import StarRating from './StarRating';
import toast from 'react-hot-toast';
import { SkeletonCard } from './Skeleton';
import ExpertStatsWidget from './ExpertStatsWidget';

const STATUS_CONFIG = {
  asignado:   { label: 'En Progreso',  color: 'bg-blue-100 text-blue-800' },
  completado: { label: 'Completado',   color: 'bg-green-100 text-green-800' },
  cancelado:  { label: 'Cancelado',    color: 'bg-red-100 text-red-700' },
};

export default function ExpertDashboard() {
  const [availableJobs, setAvailableJobs] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('available');
  const [openChatId, setOpenChatId] = useState(null);
  const [uploadingFor, setUploadingFor] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bio, setBio] = useState(user?.expert_profile?.bio ?? '');
  const [savingBio, setSavingBio] = useState(false);
  const [evidencePhotos, setEvidencePhotos] = useState([]);
  const [uploadMsg, setUploadMsg] = useState({ id: null, text: '', type: '' });
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const isVerified = user?.expert_profile?.is_verified ?? false;
  const { pending, refresh: refreshNotifications } = useNotifications(30000);

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

  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      await api.put('/expert-profile', { bio });
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
      <div className="min-h-screen flex items-center justify-center bg-brand-light text-brand-dark font-bold text-xl">
        Cargando oportunidades...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light">
      <nav className="bg-brand-dark text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-2xl tracking-tight text-white">
                El <span className="text-brand-primary">Jale</span>
              </span>
              <span className="px-3 py-1 bg-brand-accent text-brand-dark text-xs font-bold rounded-full hidden sm:block">
                Socio Fundador
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {pending > 0 && (
                <button
                  onClick={() => { fetchAvailableJobs(); setActiveTab('available'); }}
                  className="relative flex items-center gap-2 bg-orange-500 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {pending} nuevo{pending > 1 ? 's' : ''}
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
                </button>
              )}
              <span className="text-sm font-medium">Hola, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Mi Panel</h1>
          <p className="mt-1 text-sm text-gray-600">Administra tus oportunidades y trabajos en curso.</p>
        </div>

        <ExpertStatsWidget />

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6 font-medium">{error}</div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'available'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
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
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'active'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
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
            onClick={() => setActiveTab('profile')}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
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
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {availableJobs.filter(j =>
                  !searchQuery ||
                  j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  j.description.toLowerCase().includes(searchQuery.toLowerCase())
                ).map(job => (
                  <div key={job.id} className="flex flex-col bg-white rounded-lg shadow-md border-l-4 border-brand-primary overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-5 flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                        <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-brand-dark bg-brand-accent rounded">
                          Nuevo
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{job.description}</p>

                      <div className="text-sm space-y-1">
                        <div>
                          <span className="font-medium text-gray-900">Cliente:</span>{' '}
                          <span className="text-gray-600">{job.client?.name}</span>
                        </div>
                        {job.budget && (
                          <div>
                            <span className="font-medium text-gray-900">Presupuesto:</span>{' '}
                            <span className="text-green-600 font-bold">${job.budget}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                      <button
                        onClick={() => handleAcceptJob(job.id)}
                        className="w-full text-center text-sm font-medium text-white bg-brand-dark hover:bg-gray-800 py-2 rounded transition-colors"
                      >
                        Aceptar Trabajo
                      </button>
                    </div>
                  </div>
                ))}
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
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                        <div className="px-5 pt-3 flex flex-wrap gap-2">
                          <button
                            onClick={() => setOpenChatId(openChatId === job.id ? null : job.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-brand-primary bg-orange-50 hover:bg-orange-100 border border-brand-primary transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {openChatId === job.id ? 'Cerrar chat' : 'Chat con cliente'}
                          </button>
                          {job.status === 'asignado' && (
                            <button
                              onClick={() => handleCancelJob(job.id)}
                              disabled={cancellingId === job.id}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              {cancellingId === job.id ? 'Cancelando...' : 'Liberar trabajo'}
                            </button>
                          )}
                        </div>
                      )}
                      {openChatId === job.id && (
                        <div className="px-5 py-3">
                          <JobChat job={job} currentUserId={user?.id} />
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

        {/* Tab: Mi Perfil */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl space-y-6">
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
                      {savingBio ? 'Guardando...' : 'Guardar bio'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

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
