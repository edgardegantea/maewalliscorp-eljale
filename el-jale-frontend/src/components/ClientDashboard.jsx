// src/components/ClientDashboard.jsx
import { useState, useEffect } from 'react';
import api, { storageUrl } from '../api/axios';
import useNotifications from '../hooks/useNotifications';
import ReviewModal from './ReviewModal';
import JobChat from './JobChat';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { SkeletonRow } from './Skeleton';

const STATUS_CONFIG = {
  buscando:   { label: 'Buscando Experto', color: 'bg-yellow-100 text-yellow-800' },
  asignado:   { label: 'En Progreso',      color: 'bg-blue-100 text-blue-800' },
  completado: { label: 'Completado',        color: 'bg-green-100 text-green-800' },
  cancelado:  { label: 'Cancelado',         color: 'bg-red-100 text-red-700' },
};

export default function ClientDashboard() {
  const [categories, setCategories] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [newJob, setNewJob] = useState({ category_id: '', title: '', description: '', budget: '', address: '' });
  const [photos, setPhotos] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [releasingId, setReleasingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [reviewJob, setReviewJob] = useState(null);
  const [openChatId, setOpenChatId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const { pending, refresh: refreshNotifications } = useNotifications(30000);

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
      setNewJob(prev => ({ ...prev, title: '', description: '', budget: '', address: '' }));
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
      const res = await api.post(`/jobs/${jobId}/release-payment`);
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
    <div className="min-h-screen bg-brand-light">

      {reviewJob && (
        <ReviewModal
          job={reviewJob}
          onClose={() => setReviewJob(null)}
          onDone={() => {
            setReviewJob(null);
            fetchMyJobs();
          }}
        />
      )}

      <nav className="bg-white border-b-4 border-brand-primary shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <span className="font-extrabold text-2xl tracking-tight text-brand-dark">
              El <span className="text-brand-primary">Jale</span>
            </span>
            <div className="flex items-center space-x-4">
              <Link
                to="/explorar"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-gray-600 hover:text-brand-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Explorar Expertos
              </Link>

              {pending > 0 && (
                <button
                  onClick={fetchMyJobs}
                  className="relative flex items-center gap-2 bg-orange-50 border border-brand-primary text-brand-primary px-3 py-1 rounded-md text-sm font-medium hover:bg-orange-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {pending} trabajo{pending > 1 ? 's' : ''} asignado{pending > 1 ? 's' : ''}
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand-primary rounded-full animate-ping" />
                </button>
              )}
              <span className="text-sm font-medium text-gray-700">Hola, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-md text-sm font-medium transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Columna Izquierda: Publicar trabajo */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-brand-dark px-6 py-4">
                <h2 className="text-xl font-bold text-white">¿Qué necesitas arreglar hoy?</h2>
                <p className="text-brand-accent text-sm mt-1">Nuestros Especialistas Verificados están listos.</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {message.text && (
                  <div className={`p-4 rounded-md text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué tipo de especialista buscas?</label>
                    <select
                      name="category_id" value={newJob.category_id} onChange={handleChange} required
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título corto del problema</label>
                    <input
                      type="text" name="title" value={newJob.title} onChange={handleChange} required
                      placeholder="Ej. Fuga de agua, Pintar recámara, Cortocircuito..."
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Describe los detalles</label>
                    <textarea
                      name="description" value={newJob.description} onChange={handleChange} rows="3" required
                      placeholder="Explica el problema para que el experto lleve la herramienta adecuada..."
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección del trabajo</label>
                    <input
                      type="text" name="address" value={newJob.address} onChange={handleChange}
                      placeholder="Ej. Calle Juárez 45, Col. Centro"
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Presupuesto estimado (Opcional)</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number" name="budget" value={newJob.budget} onChange={handleChange}
                        min="0" step="0.01" placeholder="0.00"
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 pl-7 pr-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Promesa "Sin Regateos"</p>
                  </div>
                </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fotos del problema (Opcional, máx. 5)</label>
                    <input
                      type="file" accept="image/*" multiple
                      onChange={e => setPhotos(Array.from(e.target.files).slice(0, 5))}
                      className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-brand-primary hover:file:bg-orange-100"
                    />
                    {photos.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {photos.map((f, i) => (
                          <div key={i} className="relative">
                            <img src={URL.createObjectURL(f)} className="w-16 h-16 object-cover rounded border" alt="" />
                            <button
                              type="button"
                              onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                            >×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit" disabled={isSubmitting}
                    className={`inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-orange-600 transition-colors ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? 'Publicando...' : 'Publicar Jale'}
                  </button>
                </div>
              </form>
            </div>

            {/* Mis Solicitudes (datos reales) */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                    const status = STATUS_CONFIG[job.status] || { label: job.status, color: 'bg-gray-100 text-gray-700' };
                    return (
                      <div key={job.id} className="p-5 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-gray-900">{job.title}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{job.category?.name}</p>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${status.color}`}>
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
                          {(job.status === 'asignado' || job.status === 'completado') && (
                            <button
                              onClick={() => setOpenChatId(openChatId === job.id ? null : job.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-brand-primary bg-orange-50 hover:bg-orange-100 border border-brand-primary transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              {openChatId === job.id ? 'Cerrar chat' : 'Abrir chat'}
                            </button>
                          )}

                          {job.status === 'asignado' && job.payment?.status === 'retenido_en_app' && (
                            <button
                              onClick={() => handleReleasePayment(job.id)}
                              disabled={releasingId === job.id}
                              className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors ${releasingId === job.id ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                              {releasingId === job.id ? 'Liberando...' : 'Confirmar trabajo terminado'}
                            </button>
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

                          {['buscando', 'asignado'].includes(job.status) && (
                            <button
                              onClick={() => handleCancelJob(job.id)}
                              disabled={cancellingId === job.id}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              {cancellingId === job.id ? 'Cancelando...' : 'Cancelar trabajo'}
                            </button>
                          )}
                        </div>

                        {openChatId === job.id && (
                          <div className="mt-3">
                            <JobChat job={job} currentUserId={user?.id} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Garantía */}
          <div className="lg:col-span-1">
            <div className="bg-brand-dark rounded-lg p-6 text-white text-center">
              <svg className="mx-auto h-8 w-8 text-brand-accent mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h4 className="font-bold text-sm mb-1">Seguridad de Pago</h4>
              <p className="text-xs text-gray-300">Tu pago está asegurado en la plataforma hasta que el trabajo esté terminado y confirmado por ti.</p>
            </div>

            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h4 className="font-bold text-sm text-gray-900 mb-3">¿Cómo funciona?</h4>
              <ol className="space-y-3">
                {[
                  'Publicas tu Jale con el problema y el presupuesto.',
                  'Un experto verificado en tu zona lo acepta.',
                  'El experto realiza el trabajo.',
                  'Confirmas que quedó bien y se libera el pago.',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    {step}
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
