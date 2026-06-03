// src/components/AdminDashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import StarRating from './StarRating';
import toast from 'react-hot-toast';

// ── Helpers ────────────────────────────────────────────────────────
const STATUS_BADGE = {
  buscando:            'badge-buscando',
  asignado:            'badge-asignado',
  completado:          'badge-completado',
  cancelado:           'badge-cancelado',
};
const PAYMENT_BADGE = {
  retenido_en_app:     'bg-amber-100 text-amber-700',
  liberado_al_experto: 'bg-emerald-100 text-emerald-700',
  reembolsado:         'bg-red-100 text-red-600',
  pendiente:           'bg-gray-100 text-gray-600',
};
const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n ?? 0);

// ── Stat Card ──────────────────────────────────────────────────────
function StatCard({ label, value, icon, color = 'bg-slate-100 text-slate-600', sub }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-2xl font-black text-gray-900 leading-none">{value ?? '—'}</p>
        <p className="text-xs text-gray-500 font-medium mt-1">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Mini chart de barras ───────────────────────────────────────────
function BarChart({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full bg-brand-primary rounded-t-sm transition-all hover:bg-orange-600"
            style={{ height: `${(d.total / max) * 100}%`, minHeight: 2 }}
          />
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {d.total} jales · {d.date}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Modal genérico ─────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full animate-slide-up flex flex-col max-h-[90vh] ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── Paginación ─────────────────────────────────────────────────────
function Pagination({ meta, onPage }) {
  if (!meta || meta.last_page <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
      <span>Mostrando {meta.from}–{meta.to} de {meta.total}</span>
      <div className="flex gap-1">
        <button disabled={meta.current_page === 1} onClick={() => onPage(meta.current_page - 1)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">← Ant</button>
        {Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => {
          const p = meta.current_page <= 3 ? i + 1 : meta.current_page - 2 + i;
          if (p < 1 || p > meta.last_page) return null;
          return (
            <button key={p} onClick={() => onPage(p)}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${p === meta.current_page ? 'bg-brand-primary text-white border-brand-primary' : 'border-gray-200 hover:bg-gray-50'}`}>
              {p}
            </button>
          );
        })}
        <button disabled={meta.current_page === meta.last_page} onClick={() => onPage(meta.current_page + 1)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Sig →</button>
      </div>
    </div>
  );
}

// ── Búsqueda con debounce ──────────────────────────────────────────
function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all w-full sm:w-64" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]); const [usersMeta, setUsersMeta] = useState(null);
  const [jobs, setJobs] = useState([]);   const [jobsMeta, setJobsMeta]   = useState(null);
  const [payments, setPayments] = useState([]); const [paymentsMeta, setPaymentsMeta] = useState(null);
  const [paymentTotals, setPaymentTotals] = useState(null);
  const [categories, setCategories] = useState([]);
  const [catForm, setCatForm] = useState({ id: null, name: '' });
  const [catSaving, setCatSaving] = useState(false);
  const [kycUsers, setKycUsers] = useState([]);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycDocs, setKycDocs] = useState(null);
  const [kycUserId, setKycUserId] = useState(null);
  const [kycRejecting, setKycRejecting] = useState(false);
  const [kycRejectReason, setKycRejectReason] = useState('');

  const [activeTab, setActiveTab] = useState('stats');

  // Filtros
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatus, setJobStatus] = useState('');
  const [jobPage, setJobPage] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentPage, setPaymentPage] = useState(1);

  // Modales
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // ── Carga de datos ──────────────────────────────────────────────
  useEffect(() => { fetchStats(); }, []);

  useEffect(() => {
    if (activeTab === 'users')      fetchUsers();
    if (activeTab === 'jobs')       fetchJobs();
    if (activeTab === 'payments')   fetchPayments();
    if (activeTab === 'categories') fetchCategories();
    if (activeTab === 'kyc')        fetchKycUsers();
  }, [activeTab, userSearch, userRole, userPage, jobSearch, jobStatus, jobPage, paymentStatus, paymentPage]);

  const fetchStats = async () => {
    try { const r = await api.get('/admin/stats'); setStats(r.data); } catch {}
  };

  const fetchUsers = useCallback(async () => {
    try {
      const r = await api.get('/admin/users', { params: { search: userSearch, role: userRole, page: userPage } });
      setUsers(r.data.data); setUsersMeta(r.data.meta ?? r.data);
    } catch {}
  }, [userSearch, userRole, userPage]);

  const fetchJobs = useCallback(async () => {
    try {
      const r = await api.get('/admin/jobs', { params: { search: jobSearch, status: jobStatus, page: jobPage } });
      setJobs(r.data.data); setJobsMeta(r.data.meta ?? r.data);
    } catch {}
  }, [jobSearch, jobStatus, jobPage]);

  const fetchPayments = useCallback(async () => {
    try {
      const r = await api.get('/admin/payments', { params: { status: paymentStatus, page: paymentPage } });
      setPayments(r.data.payments.data); setPaymentsMeta(r.data.payments.meta ?? r.data.payments);
      setPaymentTotals(r.data.totals);
    } catch {}
  }, [paymentStatus, paymentPage]);

  const fetchCategories = async () => {
    try { const r = await api.get('/categories'); setCategories(r.data); } catch {}
  };

  const fetchKycUsers = async () => {
    setKycLoading(true);
    try {
      // Reutilizamos el endpoint de usuarios filtrando por expertos con documentos enviados
      const r = await api.get('/admin/users?role=expert&per_page=50');
      setKycUsers(r.data.data?.filter(u => u.expert_profile?.verification_status === 'documentos_enviados') ?? []);
    } catch {} finally { setKycLoading(false); }
  };

  const openKycDocs = async (userId) => {
    setKycUserId(userId);
    try {
      const r = await api.get(`/admin/kyc/${userId}`);
      const data = r.data;

      // Convertir URLs de documentos a blob URLs (requieren token Bearer)
      const docsWithBlobs = await Promise.all(
        (data.documents ?? []).map(async (doc) => {
          try {
            const res = await api.get(doc.path, { responseType: 'blob' });
            return { ...doc, blobUrl: URL.createObjectURL(res.data) };
          } catch {
            return { ...doc, blobUrl: null };
          }
        })
      );

      setKycDocs({ ...data, documents: docsWithBlobs });
    } catch { toast.error('Error al cargar documentos.'); }
  };

  const handleKycApprove = async (userId) => {
    try {
      await api.post(`/admin/kyc/${userId}/approve`);
      toast.success('Experto verificado.');
      setKycDocs(null);
      fetchKycUsers();
    } catch (e) { toast.error(e.response?.data?.message ?? 'Error'); }
  };

  const handleKycReject = async (userId) => {
    if (!kycRejectReason.trim()) { toast.error('Escribe el motivo del rechazo.'); return; }
    setKycRejecting(true);
    try {
      await api.post(`/admin/kyc/${userId}/reject`, { reason: kycRejectReason });
      toast.success('Verificación rechazada.');
      setKycDocs(null);
      setKycRejectReason('');
      fetchKycUsers();
    } catch (e) { toast.error(e.response?.data?.message ?? 'Error'); }
    finally { setKycRejecting(false); }
  };

  // ── Detalle usuario ─────────────────────────────────────────────
  const openUserDetail = async (userId) => {
    setLoadingDetail(true);
    try {
      const r = await api.get(`/admin/users/${userId}`);
      setSelectedUser(r.data);
    } catch { toast.error('No se pudo cargar el usuario.'); }
    finally { setLoadingDetail(false); }
  };

  // ── Detalle trabajo ─────────────────────────────────────────────
  const openJobDetail = async (jobId) => {
    setLoadingDetail(true);
    try {
      const r = await api.get(`/admin/jobs/${jobId}`);
      setSelectedJob(r.data);
    } catch { toast.error('No se pudo cargar el trabajo.'); }
    finally { setLoadingDetail(false); }
  };

  // ── Acciones ────────────────────────────────────────────────────
  const handleVerify = async (userId, verify) => {
    try {
      const r = await api.post(`/admin/experts/${userId}/${verify ? 'verify' : 'reject'}`);
      toast.success(r.data.message);
      fetchUsers();
      if (selectedUser) openUserDetail(userId);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleToggleUser = async (userId) => {
    try {
      const r = await api.post(`/admin/users/${userId}/toggle`);
      toast.success(r.data.message);
      fetchUsers();
      setSelectedUser(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;
    setCatSaving(true);
    try {
      if (catForm.id) {
        await api.put(`/categories/${catForm.id}`, { name: catForm.name });
        toast.success('Categoría actualizada.');
      } else {
        await api.post('/categories', { name: catForm.name });
        toast.success('Categoría creada.');
      }
      setCatForm({ id: null, name: '' });
      fetchCategories();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setCatSaving(false); }
  };

  const handleDeleteCat = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Categoría eliminada.');
      fetchCategories();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleExport = (type) => {
    const token = localStorage.getItem('token');
    const base = import.meta.env.VITE_API_URL.replace('/api', '');
    window.open(`${base}/api/admin/export/${type}?token=${token}`, '_blank');
  };

  const handleLogout = async () => {
    try { await api.post('/logout'); } finally {
      localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login');
    }
  };

  const TABS = [
    { id: 'stats',      label: 'Resumen',    icon: '📊' },
    { id: 'users',      label: 'Usuarios',   icon: '👥' },
    { id: 'jobs',       label: 'Trabajos',   icon: '🔧' },
    { id: 'payments',   label: 'Pagos',      icon: '💳' },
    { id: 'kyc',        label: 'Verificación', icon: '🪪' },
    { id: 'categories', label: 'Oficios',    icon: '🏷️' },
  ];

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Modal detalle usuario */}
      {selectedUser && (
        <Modal title="Detalle del usuario" onClose={() => setSelectedUser(null)}>
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-primary flex items-center justify-center text-white text-2xl font-black">
                {selectedUser.user.name[0].toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-lg text-gray-900">{selectedUser.user.name}</h4>
                <p className="text-gray-500 text-sm">{selectedUser.user.email}</p>
                <div className="flex gap-2 mt-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedUser.user.role === 'expert' ? 'bg-blue-100 text-blue-700' : selectedUser.user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                    {selectedUser.user.role}
                  </span>
                  {selectedUser.user.email_verified_at
                    ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Activo</span>
                    : <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Desactivado</span>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Trabajos', value: selectedUser.job_count },
                { label: 'Completados', value: selectedUser.completed_jobs },
                { label: 'Ganado', value: selectedUser.user.role === 'expert' ? fmt(selectedUser.total_earned) : '—' },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="font-black text-xl text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {selectedUser.user.expert_profile && (
              <div className="bg-blue-50 rounded-xl p-4 space-y-2 text-sm">
                <p className="font-semibold text-blue-900">Perfil de experto</p>
                <div className="grid grid-cols-2 gap-2 text-gray-700">
                  <span>Oficio: <strong>{selectedUser.user.expert_profile?.category?.name}</strong></span>
                  <span>Experiencia: <strong>{selectedUser.user.expert_profile?.experience_years} años</strong></span>
                  <span>Calificación: <strong>{selectedUser.user.expert_profile?.average_rating ?? 0} ⭐</strong></span>
                  <span>Reseñas: <strong>{selectedUser.user.expert_profile?.total_reviews}</strong></span>
                </div>
                {selectedUser.reviews?.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Últimas reseñas</p>
                    {selectedUser.reviews.map(r => (
                      <div key={r.id} className="flex items-start gap-2 bg-white rounded-lg p-2.5">
                        <StarRating value={r.rating} readonly size="sm" />
                        {r.comment && <p className="text-xs text-gray-600 italic flex-1">"{r.comment}"</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              {selectedUser.user.role === 'expert' && (
                selectedUser.user.expert_profile?.is_verified
                  ? <button onClick={() => handleVerify(selectedUser.user.id, false)} className="btn-danger flex-1">Revocar verificación</button>
                  : <button onClick={() => handleVerify(selectedUser.user.id, true)} className="btn-primary flex-1">✓ Verificar experto</button>
              )}
              <button onClick={() => handleToggleUser(selectedUser.user.id)}
                className={`flex-1 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${selectedUser.user.email_verified_at ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100'}`}>
                {selectedUser.user.email_verified_at ? 'Desactivar cuenta' : 'Reactivar cuenta'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal detalle trabajo */}
      {selectedJob && (
        <Modal title="Detalle del trabajo" onClose={() => setSelectedJob(null)} wide>
          <div className="space-y-5">
            <div>
              <div className="flex items-start justify-between gap-3">
                <h4 className="font-bold text-xl text-gray-900">{selectedJob.title}</h4>
                <span className={STATUS_BADGE[selectedJob.status] || 'badge-cancelado'}>{selectedJob.status}</span>
              </div>
              <p className="text-gray-600 text-sm mt-2">{selectedJob.description}</p>
              {selectedJob.address && <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">📍 {selectedJob.address}</p>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Cliente', value: selectedJob.client?.name ?? '—' },
                { label: 'Experto', value: selectedJob.expert?.name ?? 'Sin asignar' },
                { label: 'Oficio', value: selectedJob.category?.name ?? '—' },
                { label: 'Presupuesto', value: selectedJob.budget ? fmt(selectedJob.budget) : '—' },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                  <p className="font-bold text-gray-900 text-sm mt-0.5 truncate">{s.value}</p>
                </div>
              ))}
            </div>

            {selectedJob.payment && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${PAYMENT_BADGE[selectedJob.payment.status] || 'bg-gray-100 text-gray-600'}`}>
                💳 Pago: {selectedJob.payment.status.replace(/_/g, ' ')} — {fmt(selectedJob.payment.amount)}
              </div>
            )}

            {selectedJob.review && (
              <div className="bg-amber-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-700 mb-2">Calificación del cliente</p>
                <div className="flex items-center gap-2">
                  <StarRating value={selectedJob.review.rating} readonly size="sm" />
                  <span className="text-sm font-bold text-gray-700">{selectedJob.review.rating}/5</span>
                </div>
                {selectedJob.review.comment && <p className="text-sm text-gray-600 italic mt-1.5">"{selectedJob.review.comment}"</p>}
              </div>
            )}

            {selectedJob.messages?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Chat ({selectedJob.messages.length} mensajes)</p>
                <div className="bg-slate-50 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
                  {selectedJob.messages.map(m => (
                    <div key={m.id} className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {m.sender?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{m.sender?.name} <span className="font-normal text-gray-400 ml-1">{new Date(m.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</span></p>
                        <p className="text-sm text-gray-700 mt-0.5">{m.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Navbar */}
      <nav className="bg-brand-dark shadow-lg sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <span className="font-black text-xl text-white">El <span className="text-brand-primary">Jale</span></span>
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-lg">ADMIN</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</div>
              <span className="hidden sm:block text-sm text-gray-300">{user?.name}</span>
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="Salir">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-card mb-6 w-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === t.id ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: RESUMEN ── */}
        {activeTab === 'stats' && (
          <div className="space-y-6 animate-fade-in">
            {!stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
              </div>
            ) : (
              <>
                {/* KPIs principales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Usuarios totales" value={stats.total_users} icon="👤" color="bg-blue-100 text-blue-600" />
                  <StatCard label="Clientes" value={stats.total_clients} icon="🏠" color="bg-purple-100 text-purple-600" />
                  <StatCard label="Expertos" value={stats.total_experts} icon="🔧" color="bg-orange-100 text-orange-600"
                    sub={stats.experts_pending > 0 ? `${stats.experts_pending} pendientes de verificar` : undefined} />
                  <StatCard label="Jales totales" value={stats.total_jobs} icon="📋" color="bg-slate-100 text-slate-600" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Buscando experto" value={stats.jobs_buscando} icon="🔍" color="bg-amber-100 text-amber-600" />
                  <StatCard label="En progreso" value={stats.jobs_asignado} icon="⚙️" color="bg-blue-100 text-blue-600" />
                  <StatCard label="Completados" value={stats.jobs_completado} icon="✅" color="bg-emerald-100 text-emerald-600" />
                  <StatCard label="Calificación prom." value={stats.avg_rating ? `${stats.avg_rating} ⭐` : 'N/A'} icon="⭐" color="bg-yellow-100 text-yellow-600"
                    sub={`${stats.total_reviews} reseñas`} />
                </div>

                {/* Revenue */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StatCard label="Revenue total liberado" value={fmt(stats.revenue_total)} icon="💰" color="bg-emerald-100 text-emerald-600" />
                  <StatCard label="En escrow ahora" value={fmt(stats.revenue_escrow)} icon="🔒" color="bg-amber-100 text-amber-600" />
                </div>

                {/* KPIs de conversión y Premium */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Tasa de conversión" value={`${stats.conversion_rate}%`} icon="📈" color="bg-blue-100 text-blue-600" sub="últimos 30 días" />
                  <StatCard label="Expertos Premium" value={stats.experts_premium ?? 0} icon="⭐" color="bg-yellow-100 text-yellow-700" />
                  <StatCard label="Reseñas totales" value={stats.total_reviews} icon="💬" color="bg-purple-100 text-purple-600" sub={`Prom. ${stats.avg_rating ?? '—'} ⭐`} />
                  <StatCard label="Cancelados" value={stats.jobs_cancelado} icon="❌" color="bg-red-100 text-red-600" />
                </div>

                {/* Revenue por mes */}
                {stats.revenue_by_month?.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-100">
                    <h3 className="font-bold text-gray-900 text-sm mb-4">Revenue mensual — últimos 6 meses</h3>
                    <div className="flex items-end gap-2 h-24">
                      {stats.revenue_by_month.map((m, i) => {
                        const max = Math.max(...stats.revenue_by_month.map(x => parseFloat(x.revenue)), 1);
                        const h = (parseFloat(m.revenue) / max) * 100;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                            <div className="w-full bg-emerald-500 rounded-t-md transition-all hover:bg-emerald-600" style={{ height: `${Math.max(h, 4)}%` }} />
                            <span className="text-[10px] text-gray-400">{m.month?.slice(5)}</span>
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              ${parseFloat(m.revenue).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Top expertos + Nuevos usuarios */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Top expertos */}
                  {stats.top_experts?.length > 0 && (
                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                      <h3 className="font-bold text-gray-900 text-sm mb-4">🏆 Top expertos por ingresos</h3>
                      <div className="space-y-3">
                        {stats.top_experts.map((e, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center text-white text-xs font-black flex-shrink-0">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{e.name}</p>
                              <p className="text-xs text-gray-400">{e.jobs} trabajos</p>
                            </div>
                            <span className="text-sm font-bold text-emerald-600 flex-shrink-0">${e.earned.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nuevos usuarios por mes */}
                  {stats.users_by_month?.length > 0 && (
                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                      <h3 className="font-bold text-gray-900 text-sm mb-4">👥 Nuevos usuarios por mes</h3>
                      <div className="space-y-2">
                        {stats.users_by_month.slice(-4).map((m, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 w-12 flex-shrink-0">{m.month?.slice(5)}</span>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-1">
                                <div className="bg-blue-400 rounded-sm h-3" style={{ width: `${Math.min((m.clients / 20) * 100, 100)}%`, minWidth: 4 }} />
                                <span className="text-xs text-gray-500">{m.clients} clientes</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="bg-brand-primary rounded-sm h-3" style={{ width: `${Math.min((m.experts / 10) * 100, 100)}%`, minWidth: 4 }} />
                                <span className="text-xs text-gray-500">{m.experts} expertos</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Gráfica + Actividad */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                  {/* Gráfica */}
                  <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900 text-sm">Jales publicados — últimos 14 días</h3>
                    </div>
                    <BarChart data={stats.jobs_by_day} />
                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                      <span>{stats.jobs_by_day?.[0]?.date}</span>
                      <span>{stats.jobs_by_day?.[stats.jobs_by_day.length - 1]?.date}</span>
                    </div>
                  </div>

                  {/* Actividad reciente */}
                  <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100">
                    <h3 className="font-bold text-gray-900 text-sm mb-4">Actividad reciente</h3>
                    <div className="space-y-3">
                      {stats.activity?.length === 0 && <p className="text-sm text-gray-400">Sin actividad reciente.</p>}
                      {stats.activity?.map((a, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="text-base shrink-0">{a.icon}</span>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-700 leading-relaxed">{a.text}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Expertos pendientes de verificar */}
                {stats.experts_pending > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="font-bold text-amber-800">{stats.experts_pending} experto{stats.experts_pending > 1 ? 's' : ''} pendiente{stats.experts_pending > 1 ? 's' : ''} de verificar</p>
                      <p className="text-xs text-amber-700 mt-0.5">Revisa la pestaña de Usuarios y verifica sus perfiles para que puedan recibir trabajos.</p>
                    </div>
                    <button onClick={() => setActiveTab('users')} className="ml-auto btn-primary shrink-0">Ver usuarios</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── TAB: USUARIOS ── */}
        {activeTab === 'users' && (
          <div className="animate-fade-in space-y-4">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex flex-wrap gap-2">
                <SearchInput value={userSearch} onChange={v => { setUserSearch(v); setUserPage(1); }} placeholder="Buscar por nombre o email..." />
                <select value={userRole} onChange={e => { setUserRole(e.target.value); setUserPage(1); }}
                  className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/30">
                  <option value="">Todos los roles</option>
                  <option value="client">Clientes</option>
                  <option value="expert">Expertos</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
              <button onClick={() => handleExport('users')} className="btn-secondary text-xs gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Exportar CSV
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-slate-50">
                    <tr>{['#', 'Usuario', 'Rol', 'Oficio', 'Estado', 'Registro', 'Acciones'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">Sin resultados</td></tr>
                    )}
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 py-3 text-xs text-gray-400">#{u.id}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-xs font-bold shrink-0">{u.name[0].toUpperCase()}</div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.role === 'expert' ? 'bg-blue-100 text-blue-700' : u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{u.expert_profile?.category?.name ?? '—'}</td>
                        <td className="px-4 py-3">
                          {u.role === 'expert' ? (
                            u.expert_profile?.is_verified
                              ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">✓ Verificado</span>
                              : <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pendiente</span>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString('es-MX')}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openUserDetail(u.id)} className="px-2 py-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium">Ver</button>
                            {u.role === 'expert' && !u.expert_profile?.is_verified && (
                              <button onClick={() => handleVerify(u.id, true)} className="px-2 py-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors font-medium">Verificar</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination meta={usersMeta} onPage={setUserPage} />
            </div>
          </div>
        )}

        {/* ── TAB: TRABAJOS ── */}
        {activeTab === 'jobs' && (
          <div className="animate-fade-in space-y-4">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex flex-wrap gap-2">
                <SearchInput value={jobSearch} onChange={v => { setJobSearch(v); setJobPage(1); }} placeholder="Buscar por título..." />
                <select value={jobStatus} onChange={e => { setJobStatus(e.target.value); setJobPage(1); }}
                  className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/30">
                  <option value="">Todos los estados</option>
                  {['buscando','asignado','completado','cancelado'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={() => handleExport('jobs')} className="btn-secondary text-xs gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Exportar CSV
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-slate-50">
                    <tr>{['#', 'Trabajo', 'Oficio', 'Cliente', 'Experto', 'Presupuesto', 'Estado', 'Fecha', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {jobs.length === 0 && (
                      <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">Sin resultados</td></tr>
                    )}
                    {jobs.map(j => (
                      <tr key={j.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 py-3 text-xs text-gray-400">#{j.id}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[200px] truncate">{j.title}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{j.category?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{j.client?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{j.expert?.name ?? <span className="text-gray-400 text-xs">Sin asignar</span>}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{j.budget ? fmt(j.budget) : '—'}</td>
                        <td className="px-4 py-3"><span className={STATUS_BADGE[j.status] || 'badge-cancelado'}>{j.status}</span></td>
                        <td className="px-4 py-3 text-xs text-gray-400">{new Date(j.created_at).toLocaleDateString('es-MX')}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => openJobDetail(j.id)} className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all font-medium">Ver</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination meta={jobsMeta} onPage={setJobPage} />
            </div>
          </div>
        )}

        {/* ── TAB: PAGOS ── */}
        {activeTab === 'payments' && (
          <div className="animate-fade-in space-y-4">
            {paymentTotals && (
              <div className="grid grid-cols-3 gap-4">
                <StatCard label="En escrow" value={fmt(paymentTotals.retenido)} icon="🔒" color="bg-amber-100 text-amber-600" />
                <StatCard label="Liberado a expertos" value={fmt(paymentTotals.liberado)} icon="✅" color="bg-emerald-100 text-emerald-600" />
                <StatCard label="Reembolsado" value={fmt(paymentTotals.reembolsado)} icon="↩️" color="bg-red-100 text-red-500" />
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <select value={paymentStatus} onChange={e => { setPaymentStatus(e.target.value); setPaymentPage(1); }}
                className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/30">
                <option value="">Todos los estados</option>
                <option value="retenido_en_app">Retenido</option>
                <option value="liberado_al_experto">Liberado</option>
                <option value="reembolsado">Reembolsado</option>
              </select>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-slate-50">
                    <tr>{['#', 'Trabajo', 'Cliente', 'Experto', 'Monto', 'Estado', 'Fecha'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {payments.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">Sin pagos registrados</td></tr>
                    )}
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-400">#{p.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-[180px] truncate">{p.service_job?.title ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{p.service_job?.client?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{p.service_job?.expert?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">{fmt(p.amount)}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PAYMENT_BADGE[p.status] || 'bg-gray-100 text-gray-600'}`}>{p.status.replace(/_/g, ' ')}</span></td>
                        <td className="px-4 py-3 text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString('es-MX')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination meta={paymentsMeta} onPage={setPaymentPage} />
            </div>
          </div>
        )}

        {/* ── TAB: KYC / VERIFICACIÓN ── */}
        {activeTab === 'kyc' && (
          <div className="space-y-4 animate-fade-in">
            {/* Modal documentos */}
            {kycDocs && kycUserId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Documentos de verificación</h3>
                    <button onClick={() => setKycDocs(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                  <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                    {kycDocs.user && (
                      <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm mb-2">
                        <p className="font-semibold text-gray-800">{kycDocs.user.name}</p>
                        <p className="text-gray-500 text-xs">{kycDocs.user.email}</p>
                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                          kycDocs.verification_status === 'documentos_enviados' ? 'bg-yellow-100 text-yellow-700' :
                          kycDocs.verification_status === 'verificado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>{kycDocs.verification_status}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      {kycDocs.documents?.map(doc => (
                        <div key={doc.label} className="text-center">
                          {doc.blobUrl ? (
                            <a href={doc.blobUrl} target="_blank" rel="noreferrer">
                              <img src={doc.blobUrl} alt={doc.label} className="w-full aspect-video object-cover rounded-lg border hover:opacity-80 transition-opacity" />
                            </a>
                          ) : (
                            <div className="w-full aspect-video bg-gray-100 rounded-lg border flex items-center justify-center text-gray-400 text-xs">
                              Sin imagen
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-1">{doc.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleKycApprove(kycUserId)}
                        className="flex-1 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors">
                        ✅ Aprobar
                      </button>
                    </div>
                    <div className="space-y-2">
                      <textarea
                        value={kycRejectReason}
                        onChange={e => setKycRejectReason(e.target.value)}
                        placeholder="Motivo del rechazo (requerido para rechazar)..."
                        rows={2}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-red-400 focus:border-red-400"
                      />
                      <button onClick={() => handleKycReject(kycUserId)} disabled={kycRejecting}
                        className="w-full py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-60">
                        {kycRejecting ? 'Rechazando...' : '❌ Rechazar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Verificaciones pendientes</h2>
              <button onClick={fetchKycUsers} className="text-xs text-brand-primary hover:underline">↺ Actualizar</button>
            </div>

            {kycLoading ? (
              <div className="flex justify-center py-10">
                <svg className="animate-spin w-8 h-8 text-brand-primary" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              </div>
            ) : kycUsers.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-gray-500 text-sm">No hay documentos pendientes de revisión.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {kycUsers.map(u => (
                  <div key={u.id} className="bg-white rounded-xl border border-yellow-200 p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                        <p className="text-xs text-yellow-700 font-medium mt-0.5">⏳ Documentos enviados</p>
                      </div>
                    </div>
                    <button onClick={() => openKycDocs(u.id)}
                      className="px-4 py-2 text-sm font-semibold text-white bg-brand-primary hover:bg-orange-600 rounded-xl transition-colors flex-shrink-0">
                      Revisar documentos
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: OFICIOS ── */}
        {activeTab === 'categories' && (
          <div className="grid md:grid-cols-5 gap-6 animate-fade-in">
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-slate-50">
                  <h3 className="font-bold text-gray-900 text-sm">{catForm.id ? '✏️ Editar oficio' : '➕ Nuevo oficio'}</h3>
                </div>
                <form onSubmit={handleCatSubmit} className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nombre *</label>
                    <input type="text" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                      placeholder="Ej. Plomería" required className="input" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={catSaving} className="btn-primary flex-1">
                      {catSaving ? 'Guardando...' : catForm.id ? 'Guardar cambios' : 'Crear oficio'}
                    </button>
                    {catForm.id && (
                      <button type="button" onClick={() => setCatForm({ id: null, name: '' })} className="btn-secondary px-3">✕</button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            <div className="md:col-span-3">
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {categories.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Sin categorías registradas.</p>}
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 group transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🏷️</span>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{cat.name}</p>
                          <p className="text-xs text-gray-400">ID: {cat.id}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setCatForm({ id: cat.id, name: cat.name })}
                          className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">Editar</button>
                        <button onClick={() => handleDeleteCat(cat.id)}
                          className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
