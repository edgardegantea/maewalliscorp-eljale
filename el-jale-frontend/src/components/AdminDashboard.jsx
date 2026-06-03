// src/components/AdminDashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import StarRating from './StarRating';
import toast from 'react-hot-toast';

// ── Helpers ────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n ?? 0);
const STATUS_COLOR = {
  buscando:   'bg-amber-100  text-amber-700',
  asignado:   'bg-blue-100   text-blue-700',
  completado: 'bg-emerald-100 text-emerald-700',
  cancelado:  'bg-red-100    text-red-600',
};
const PAYMENT_COLOR = {
  retenido_en_app:     'bg-amber-100 text-amber-700',
  liberado_al_experto: 'bg-emerald-100 text-emerald-700',
  reembolsado:         'bg-red-100 text-red-600',
  pendiente:           'bg-gray-100 text-gray-600',
};

// ── Badge ──────────────────────────────────────────────────────────
const Badge = ({ label, color = 'bg-gray-100 text-gray-600' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{label}</span>
);

// ── Stat Card ──────────────────────────────────────────────────────
function StatCard({ label, value, icon, color = 'bg-slate-100 text-slate-600', sub, trend }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${color}`}>{icon}</div>
        {trend !== undefined && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-gray-900 leading-none">{value ?? '—'}</p>
      <p className="text-xs text-gray-500 font-medium mt-1.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Bar Chart ──────────────────────────────────────────────────────
function BarChart({ data, color = 'bg-orange-500', valueKey = 'total' }) {
  if (!data?.length) return <div className="h-20 flex items-center justify-center text-sm text-gray-400">Sin datos</div>;
  const max = Math.max(...data.map(d => parseFloat(d[valueKey] ?? 0)), 1);
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
          <div className={`w-full ${color} rounded-t-sm transition-all hover:opacity-80`}
            style={{ height: `${Math.max((parseFloat(d[valueKey] ?? 0) / max) * 100, 2)}%` }} />
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
            {d.label ?? d.date ?? d.month}: {d[valueKey]}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────
function Modal({ title, onClose, children, size = 'md' }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc); };
  }, [onClose]);
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${widths[size]} flex flex-col max-h-[90vh] animate-slide-up`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-bold text-gray-900 text-base">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
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
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
      <span>{meta.from}–{meta.to} de {meta.total} registros</span>
      <div className="flex gap-1">
        <button disabled={meta.current_page === 1} onClick={() => onPage(meta.current_page - 1)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors">‹ Ant</button>
        {Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => {
          const p = meta.current_page <= 3 ? i + 1 : meta.current_page - 2 + i;
          if (p < 1 || p > meta.last_page) return null;
          return <button key={p} onClick={() => onPage(p)}
            className={`w-8 py-1.5 rounded-lg border transition-colors ${p === meta.current_page ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 hover:bg-gray-50'}`}>{p}</button>;
        })}
        <button disabled={meta.current_page === meta.last_page} onClick={() => onPage(meta.current_page + 1)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors">Sig ›</button>
      </div>
    </div>
  );
}

// ── Search ─────────────────────────────────────────────────────────
function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all w-56" />
    </div>
  );
}

// ── Nav Item ───────────────────────────────────────────────────────
function NavItem({ id, label, icon, active, badge, onClick }) {
  return (
    <button onClick={() => onClick(id)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/10'
      }`}>
      <span className="text-base">{icon}</span>
      <span>{label}</span>
      {badge > 0 && <span className="ml-auto bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{badge}</span>}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const [stats, setStats]           = useState(null);
  const [users, setUsers]           = useState([]); const [usersMeta, setUsersMeta] = useState(null);
  const [jobs, setJobs]             = useState([]); const [jobsMeta, setJobsMeta]   = useState(null);
  const [payments, setPayments]     = useState([]); const [paymentsMeta, setPaymentsMeta] = useState(null);
  const [paymentTotals, setPaymentTotals] = useState(null);
  const [categories, setCategories] = useState([]);
  const [catForm, setCatForm]       = useState({ id: null, name: '' });
  const [catSaving, setCatSaving]   = useState(false);
  const [kycUsers, setKycUsers]     = useState([]);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycDocs, setKycDocs]       = useState(null);
  const [kycUserId, setKycUserId]   = useState(null);
  const [kycRejecting, setKycRejecting] = useState(false);
  const [kycRejectReason, setKycRejectReason] = useState('');
  const [disputes, setDisputes]     = useState([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [reviews, setReviews]       = useState([]); const [reviewsMeta, setReviewsMeta] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [notifs, setNotifs]         = useState([]); const [notifsMeta, setNotifsMeta] = useState(null);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ target: 'all', title: '', body: '', user_id: '' });
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [activeTab, setActiveTab]   = useState('stats');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filtros
  const [userSearch, setUserSearch] = useState(''); const [userRole, setUserRole] = useState(''); const [userPage, setUserPage] = useState(1);
  const [jobSearch, setJobSearch]   = useState(''); const [jobStatus, setJobStatus] = useState(''); const [jobPage, setJobPage] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState(''); const [paymentPage, setPaymentPage] = useState(1);
  const [reviewFilter, setReviewFilter] = useState(''); const [reviewPage, setReviewPage] = useState(1);
  const [notifPage, setNotifPage]   = useState(1);

  // Modales
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedJob, setSelectedJob]   = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    if (activeTab === 'users')         fetchUsers();
    if (activeTab === 'jobs')          fetchJobs();
    if (activeTab === 'payments')      fetchPayments();
    if (activeTab === 'categories')    fetchCategories();
    if (activeTab === 'kyc')           fetchKycUsers();
    if (activeTab === 'disputes')      fetchDisputes();
    if (activeTab === 'reviews')       fetchReviews();
    if (activeTab === 'notifications') fetchNotifs();
  }, [activeTab, userSearch, userRole, userPage, jobSearch, jobStatus, jobPage, paymentStatus, paymentPage, reviewFilter, reviewPage, notifPage]);

  const fetchStats      = async () => { try { const r = await api.get('/admin/stats'); setStats(r.data); } catch {} };
  const fetchUsers      = useCallback(async () => { try { const r = await api.get('/admin/users', { params: { search: userSearch, role: userRole, page: userPage } }); setUsers(r.data.data); setUsersMeta(r.data.meta ?? r.data); } catch {} }, [userSearch, userRole, userPage]);
  const fetchJobs       = useCallback(async () => { try { const r = await api.get('/admin/jobs', { params: { search: jobSearch, status: jobStatus, page: jobPage } }); setJobs(r.data.data); setJobsMeta(r.data.meta ?? r.data); } catch {} }, [jobSearch, jobStatus, jobPage]);
  const fetchPayments   = useCallback(async () => { try { const r = await api.get('/admin/payments', { params: { status: paymentStatus, page: paymentPage } }); setPayments(r.data.payments.data); setPaymentsMeta(r.data.payments.meta); setPaymentTotals(r.data.totals); } catch {} }, [paymentStatus, paymentPage]);
  const fetchCategories = async () => { try { const r = await api.get('/categories'); setCategories(r.data); } catch {} };
  const fetchDisputes   = async () => { setDisputesLoading(true); try { const r = await api.get('/admin/disputes'); setDisputes(r.data.data ?? r.data); } catch {} finally { setDisputesLoading(false); } };
  const fetchKycUsers   = async () => { setKycLoading(true); try { const r = await api.get('/admin/users?role=expert&per_page=50'); setKycUsers(r.data.data?.filter(u => u.expert_profile?.verification_status === 'documentos_enviados') ?? []); } catch {} finally { setKycLoading(false); } };
  const fetchReviews    = async () => { setReviewsLoading(true); try { const r = await api.get('/admin/reviews', { params: { min_rating: reviewFilter || undefined, page: reviewPage } }); setReviews(r.data.data); setReviewsMeta(r.data.meta); } catch {} finally { setReviewsLoading(false); } };
  const fetchNotifs     = async () => { setNotifsLoading(true); try { const r = await api.get('/admin/notifications', { params: { page: notifPage } }); setNotifs(r.data.data); setNotifsMeta(r.data.meta); } catch {} finally { setNotifsLoading(false); } };

  const openKycDocs = async (userId) => {
    setKycUserId(userId);
    try {
      const r = await api.get(`/admin/kyc/${userId}`);
      const docsWithBlobs = await Promise.all((r.data.documents ?? []).map(async (doc) => {
        try { const res = await api.get(doc.path, { responseType: 'blob' }); return { ...doc, blobUrl: URL.createObjectURL(res.data) }; }
        catch { return { ...doc, blobUrl: null }; }
      }));
      setKycDocs({ ...r.data, documents: docsWithBlobs });
    } catch { toast.error('Error al cargar documentos.'); }
  };

  const handleKycApprove = async (userId) => {
    try { await api.post(`/admin/kyc/${userId}/approve`); toast.success('Experto verificado ✅'); setKycDocs(null); fetchKycUsers(); }
    catch (e) { toast.error(e.response?.data?.message ?? 'Error'); }
  };

  const handleKycReject = async (userId) => {
    if (!kycRejectReason.trim()) { toast.error('Escribe el motivo.'); return; }
    setKycRejecting(true);
    try { await api.post(`/admin/kyc/${userId}/reject`, { reason: kycRejectReason }); toast.success('Rechazado.'); setKycDocs(null); setKycRejectReason(''); fetchKycUsers(); }
    catch (e) { toast.error(e.response?.data?.message ?? 'Error'); }
    finally { setKycRejecting(false); }
  };

  const openUserDetail = async (userId) => { setLoadingDetail(true); try { const r = await api.get(`/admin/users/${userId}`); setSelectedUser(r.data); } catch { toast.error('Error'); } finally { setLoadingDetail(false); } };
  const openJobDetail  = async (jobId)  => { setLoadingDetail(true); try { const r = await api.get(`/admin/jobs/${jobId}`); setSelectedJob(r.data); } catch { toast.error('Error'); } finally { setLoadingDetail(false); } };

  const handleVerify     = async (userId, verify) => { try { const r = await api.post(`/admin/experts/${userId}/${verify ? 'verify' : 'reject'}`); toast.success(r.data.message); fetchUsers(); if (selectedUser) openUserDetail(userId); } catch (e) { toast.error(e.response?.data?.message || 'Error'); } };
  const handleToggleUser = async (userId) => { try { const r = await api.post(`/admin/users/${userId}/toggle`); toast.success(r.data.message); fetchUsers(); setSelectedUser(null); } catch (e) { toast.error(e.response?.data?.message || 'Error'); } };
  const handleResolveDispute = async (id, resolution) => {
    try { await api.put(`/admin/disputes/${id}`, { resolution, status: 'resuelto' }); toast.success('Disputa resuelta.'); fetchDisputes(); }
    catch (e) { toast.error(e.response?.data?.message || 'Error'); }
  };
  const handleCatSubmit = async (e) => {
    e.preventDefault(); if (!catForm.name.trim()) return; setCatSaving(true);
    try { catForm.id ? await api.put(`/categories/${catForm.id}`, { name: catForm.name }) : await api.post('/categories', { name: catForm.name }); toast.success(catForm.id ? 'Actualizado.' : 'Creado.'); setCatForm({ id: null, name: '' }); fetchCategories(); }
    catch (e) { toast.error(e.response?.data?.message || 'Error'); } finally { setCatSaving(false); }
  };
  const handleDeleteCat = async (id) => { if (!window.confirm('¿Eliminar?')) return; try { await api.delete(`/categories/${id}`); toast.success('Eliminado.'); fetchCategories(); } catch (e) { toast.error(e.response?.data?.message || 'Error'); } };
  const handleExport = async (type) => {
    try { const r = await api.get(`/admin/export/${type}`, { responseType: 'blob' }); const url = URL.createObjectURL(r.data); const a = document.createElement('a'); a.href = url; a.download = `eljale-${type}-${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url); }
    catch { toast.error('Error al exportar.'); }
  };
  const handleLogout = async () => { try { await api.post('/logout'); } finally { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); } };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('¿Eliminar esta reseña?')) return;
    try { await api.delete(`/admin/reviews/${id}`); toast.success('Reseña eliminada.'); fetchReviews(); }
    catch (e) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.body.trim()) return;
    setBroadcastSending(true);
    try {
      const r = await api.post('/admin/notifications/send', broadcastForm);
      toast.success(r.data.message);
      setBroadcastForm({ target: 'all', title: '', body: '', user_id: '' });
      fetchNotifs();
    } catch (e) { toast.error(e.response?.data?.message || 'Error'); }
    finally { setBroadcastSending(false); }
  };

  const TABS = [
    { id: 'stats',         label: 'Resumen',        icon: '📊' },
    { id: 'users',         label: 'Usuarios',       icon: '👥' },
    { id: 'jobs',          label: 'Trabajos',       icon: '🔧' },
    { id: 'payments',      label: 'Pagos',          icon: '💳' },
    { id: 'reviews',       label: 'Reseñas',        icon: '⭐' },
    { id: 'kyc',           label: 'Verificación',   icon: '🪪', badge: kycUsers.length },
    { id: 'disputes',      label: 'Disputas',       icon: '⚠️', badge: disputes.filter(d => !['resuelto','resuelta','cerrada'].includes(d.status)).length },
    { id: 'notifications', label: 'Notificaciones', icon: '🔔' },
    { id: 'categories',    label: 'Oficios',        icon: '🏷️' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* ══ SIDEBAR ══════════════════════════════════════════════════ */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-gray-950 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-black text-white">El <span className="text-orange-500">Jale</span></p>
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Admin Panel</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-white">✕</button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {TABS.map(t => (
            <NavItem key={t.id} {...t} active={activeTab === t.id} onClick={id => { setActiveTab(id); setSidebarOpen(false); }} />
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-gray-500 text-[10px] truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ══ MAIN ═════════════════════════════════════════════════════ */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-4 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div>
            <h1 className="font-bold text-gray-900 text-sm">{TABS.find(t => t.id === activeTab)?.label}</h1>
            <p className="text-xs text-gray-400">Panel de administración</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {kycUsers.length > 0 && activeTab !== 'kyc' && (
              <button onClick={() => setActiveTab('kyc')} className="flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl font-semibold hover:bg-amber-100 transition-colors">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                {kycUsers.length} verificación{kycUsers.length > 1 ? 'es' : ''} pendiente{kycUsers.length > 1 ? 's' : ''}
              </button>
            )}
            <button onClick={fetchStats} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all" title="Actualizar">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-5 lg:p-7 overflow-auto">

          {/* ── MODALES ── */}
          {selectedUser && (
            <Modal title="Detalle del usuario" onClose={() => setSelectedUser(null)} size="md">
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center text-white text-2xl font-black">
                    {selectedUser.user.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">{selectedUser.user.name}</h4>
                    <p className="text-gray-500 text-sm">{selectedUser.user.email}</p>
                    <div className="flex gap-2 mt-1.5">
                      <Badge label={selectedUser.user.role} color={selectedUser.user.role === 'expert' ? 'bg-blue-100 text-blue-700' : selectedUser.user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'} />
                      {selectedUser.user.email_verified_at ? <Badge label="Activo" color="bg-emerald-100 text-emerald-700" /> : <Badge label="Inactivo" color="bg-red-100 text-red-600" />}
                      {selectedUser.user.expert_profile?.is_verified && <Badge label="✓ Verificado" color="bg-emerald-100 text-emerald-700" />}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Trabajos', value: selectedUser.job_count },
                    { label: 'Completados', value: selectedUser.completed_jobs },
                    { label: 'Ganado', value: fmt(selectedUser.total_earned ?? 0) },
                    { label: 'Referidos', value: selectedUser.referrals_count ?? 0 },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="font-black text-xl text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
                {selectedUser.user.expert_profile && (
                  <div className="bg-blue-50 rounded-xl p-4 text-sm space-y-2">
                    <p className="font-semibold text-blue-900">Perfil de experto</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-700 text-xs">
                      <span>Oficio: <strong>{selectedUser.user.expert_profile?.category?.name ?? '—'}</strong></span>
                      <span>Experiencia: <strong>{selectedUser.user.expert_profile?.experience_years} años</strong></span>
                      <span>Rating: <strong>{selectedUser.user.expert_profile?.average_rating ?? 0} ⭐</strong></span>
                      <span>Reseñas: <strong>{selectedUser.user.expert_profile?.total_reviews}</strong></span>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  {selectedUser.user.role === 'expert' && (
                    selectedUser.user.expert_profile?.is_verified
                      ? <button onClick={() => handleVerify(selectedUser.user.id, false)} className="flex-1 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors">Revocar verificación</button>
                      : <button onClick={() => handleVerify(selectedUser.user.id, true)} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors">✓ Verificar experto</button>
                  )}
                  <button onClick={() => handleToggleUser(selectedUser.user.id)}
                    className={`flex-1 px-4 py-2 text-sm font-semibold rounded-xl transition-colors border ${selectedUser.user.email_verified_at ? 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'}`}>
                    {selectedUser.user.email_verified_at ? '🚫 Desactivar' : '✅ Reactivar'}
                  </button>
                </div>
              </div>
            </Modal>
          )}

          {selectedJob && (
            <Modal title={`Trabajo #${selectedJob.id}`} onClose={() => setSelectedJob(null)} size="lg">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">{selectedJob.title}</h4>
                    {selectedJob.address && <p className="text-xs text-gray-500 mt-1">📍 {selectedJob.address}</p>}
                  </div>
                  <Badge label={selectedJob.status} color={STATUS_COLOR[selectedJob.status]} />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3">{selectedJob.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 font-medium">Cliente</p>
                    {selectedJob.client ? (
                      <button onClick={() => { setSelectedJob(null); openUserDetail(selectedJob.client.id); }}
                        className="font-bold text-blue-600 hover:text-blue-800 hover:underline text-sm mt-0.5 text-left">
                        {selectedJob.client.name}
                      </button>
                    ) : <p className="font-bold text-gray-900 text-sm mt-0.5">—</p>}
                    {selectedJob.client?.email && <p className="text-[10px] text-gray-400 mt-0.5">{selectedJob.client.email}</p>}
                    {selectedJob.client?.phone && <p className="text-[10px] text-gray-400">{selectedJob.client.phone}</p>}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 font-medium">Experto</p>
                    {selectedJob.expert ? (
                      <button onClick={() => { setSelectedJob(null); openUserDetail(selectedJob.expert.id); }}
                        className="font-bold text-blue-600 hover:text-blue-800 hover:underline text-sm mt-0.5 text-left">
                        {selectedJob.expert.name}
                      </button>
                    ) : <p className="font-bold text-gray-400 text-sm mt-0.5 italic">Sin asignar</p>}
                    {selectedJob.expert?.email && <p className="text-[10px] text-gray-400 mt-0.5">{selectedJob.expert.email}</p>}
                    {selectedJob.expert?.phone && <p className="text-[10px] text-gray-400">{selectedJob.expert.phone}</p>}
                  </div>
                  {[
                    { label: 'Oficio', value: selectedJob.category?.name ?? '—' },
                    { label: 'Presupuesto', value: selectedJob.budget ? fmt(selectedJob.budget) : '—' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                      <p className="font-bold text-gray-900 text-sm mt-0.5 truncate">{s.value}</p>
                    </div>
                  ))}
                </div>
                {selectedJob.payment && (
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${PAYMENT_COLOR[selectedJob.payment.status] || 'bg-gray-100 text-gray-600'}`}>
                    💳 {selectedJob.payment.status.replace(/_/g, ' ')} — {fmt(selectedJob.payment.amount)}
                  </div>
                )}
                {selectedJob.review && (
                  <div className="bg-amber-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-amber-700 mb-1.5">Calificación</p>
                    <div className="flex items-center gap-2">
                      <StarRating value={selectedJob.review.rating} readonly size="sm" />
                      {selectedJob.review.comment && <p className="text-xs text-gray-600 italic">"{selectedJob.review.comment}"</p>}
                    </div>
                  </div>
                )}
                {selectedJob.messages?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Chat ({selectedJob.messages.length} mensajes)</p>
                    <div className="bg-gray-50 rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto">
                      {selectedJob.messages.map(m => (
                        <div key={m.id} className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{m.sender?.name?.[0]}</div>
                          <div>
                            <p className="text-xs font-semibold text-gray-700">{m.sender?.name} <span className="font-normal text-gray-400">{new Date(m.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</span></p>
                            <p className="text-xs text-gray-700 mt-0.5">{m.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Modal>
          )}

          {kycDocs && kycUserId && (
            <Modal title="Revisión de identidad" onClose={() => setKycDocs(null)} size="lg">
              <div className="space-y-5">
                {kycDocs.user && (
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold shrink-0">{kycDocs.user.name?.[0]}</div>
                    <div>
                      <p className="font-semibold text-gray-800">{kycDocs.user.name}</p>
                      <p className="text-xs text-gray-500">{kycDocs.user.email}</p>
                    </div>
                    <Badge label={kycDocs.verification_status} color="bg-yellow-100 text-yellow-700" />
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3">
                  {kycDocs.documents?.map(doc => (
                    <div key={doc.label}>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">{doc.label}</p>
                      {doc.blobUrl ? (
                        <a href={doc.blobUrl} target="_blank" rel="noreferrer">
                          <img src={doc.blobUrl} alt={doc.label} className="w-full aspect-[4/3] object-cover rounded-xl border-2 border-gray-200 hover:border-orange-400 transition-colors cursor-zoom-in" />
                        </a>
                      ) : (
                        <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-xs">Sin imagen</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <button onClick={() => handleKycApprove(kycUserId)}
                    className="flex-1 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors">
                    ✅ Aprobar verificación
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Motivo del rechazo</label>
                  <textarea value={kycRejectReason} onChange={e => setKycRejectReason(e.target.value)}
                    placeholder="Describe por qué se rechazan los documentos..." rows={2}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 resize-none" />
                  <button onClick={() => handleKycReject(kycUserId)} disabled={kycRejecting}
                    className="w-full py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-60">
                    {kycRejecting ? 'Rechazando...' : '❌ Rechazar documentos'}
                  </button>
                </div>
              </div>
            </Modal>
          )}

          {/* ── TAB: RESUMEN ── */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {!stats ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(12)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
                </div>
              ) : (
                <>
                  {/* Hoy / Esta semana */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
                      <p className="text-orange-200 text-xs font-medium mb-1">Hoy</p>
                      <div className="flex items-end gap-4">
                        <div><p className="text-2xl font-black">{stats.today_jobs}</p><p className="text-orange-200 text-xs">jales</p></div>
                        <div><p className="text-2xl font-black">{stats.today_users}</p><p className="text-orange-200 text-xs">usuarios</p></div>
                        <div><p className="text-lg font-black">{fmt(stats.today_revenue)}</p><p className="text-orange-200 text-xs">revenue</p></div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
                      <p className="text-blue-200 text-xs font-medium mb-1">Esta semana</p>
                      <div className="flex items-end gap-4">
                        <div><p className="text-2xl font-black">{stats.week_jobs}</p><p className="text-blue-200 text-xs">jales</p></div>
                        <div><p className="text-2xl font-black">{stats.week_users}</p><p className="text-blue-200 text-xs">usuarios</p></div>
                        <div><p className="text-lg font-black">{fmt(stats.week_revenue)}</p><p className="text-blue-200 text-xs">revenue</p></div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white">
                      <p className="text-emerald-200 text-xs font-medium mb-1">Métricas clave</p>
                      <div className="flex items-end gap-4">
                        <div><p className="text-2xl font-black">{stats.conversion_rate}%</p><p className="text-emerald-200 text-xs">conversión</p></div>
                        <div><p className="text-2xl font-black">{stats.cancellation_rate}%</p><p className="text-emerald-200 text-xs">cancelación</p></div>
                        <div><p className="text-lg font-black">{stats.avg_completion_hours ? `${stats.avg_completion_hours}h` : '—'}</p><p className="text-emerald-200 text-xs">prom. cierre</p></div>
                      </div>
                    </div>
                  </div>

                  {/* KPIs principales */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    <StatCard label="Usuarios" value={stats.total_users} icon="👤" color="bg-blue-100 text-blue-600" />
                    <StatCard label="Clientes" value={stats.total_clients} icon="🏠" color="bg-purple-100 text-purple-600" />
                    <StatCard label="Expertos" value={stats.total_experts} icon="🔧" color="bg-orange-100 text-orange-600" sub={`${stats.experts_verified ?? 0} verificados`} />
                    <StatCard label="Premium" value={stats.experts_premium} icon="⭐" color="bg-yellow-100 text-yellow-600" />
                    <StatCard label="Jales" value={stats.total_jobs} icon="📋" color="bg-slate-100 text-slate-600" />
                    <StatCard label="Completados" value={stats.jobs_completado} icon="✅" color="bg-emerald-100 text-emerald-600" />
                    <StatCard label="Reseñas" value={stats.total_reviews} icon="💬" color="bg-pink-100 text-pink-600" sub={`${stats.avg_rating} ⭐`} />
                    <StatCard label="Disputas" value={stats.open_disputes} icon="⚠️" color={stats.open_disputes > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'} />
                  </div>

                  {/* Revenue */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-950 rounded-2xl p-5 text-white relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.2),transparent_70%)]" />
                      <div className="relative space-y-2">
                        <p className="text-gray-400 text-xs font-medium">Revenue total</p>
                        <p className="text-2xl font-black text-white">{fmt(stats.revenue_total)}</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between"><span className="text-gray-500">En escrow</span><span className="text-amber-400">{fmt(stats.revenue_escrow)}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Comisiones</span><span className="text-orange-400">{fmt(stats.platform_fees)}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Reembolsado</span><span className="text-red-400">{fmt(stats.revenue_refunded)}</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-3 bg-white rounded-2xl p-5 border border-gray-100">
                      <p className="text-sm font-bold text-gray-900 mb-3">Revenue por mes — últimos 6 meses</p>
                      <BarChart data={(stats.revenue_by_month ?? []).map(m => ({ ...m, label: m.month?.slice(5), total: parseFloat(m.revenue ?? 0) }))} color="bg-emerald-500" />
                    </div>
                  </div>

                  {/* Gráficas + Categorías */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                      <p className="text-sm font-bold text-gray-900 mb-3">Jales — últimos 14 días</p>
                      <BarChart data={stats.jobs_by_day} />
                      <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                        <span>{stats.jobs_by_day?.[0]?.date}</span>
                        <span>{stats.jobs_by_day?.[stats.jobs_by_day?.length - 1]?.date}</span>
                      </div>
                    </div>

                    {stats.jobs_by_category?.length > 0 && (
                      <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <p className="text-sm font-bold text-gray-900 mb-3">Jales por categoría</p>
                        <div className="space-y-2.5">
                          {stats.jobs_by_category.slice(0, 6).map((c, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 w-24 truncate">{c.category}</span>
                              <div className="flex-1 bg-gray-100 rounded-full h-2">
                                <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${(c.total / stats.jobs_by_category[0].total) * 100}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-gray-700 w-6 text-right">{c.total}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {stats.top_experts?.length > 0 && (
                      <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <p className="text-sm font-bold text-gray-900 mb-3">🏆 Top expertos</p>
                        <div className="space-y-3">
                          {stats.top_experts.map((e, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : 'bg-orange-300'}`}>{i+1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">{e.name}</p>
                                <div className="w-full bg-gray-100 rounded-full h-1 mt-0.5">
                                  <div className="bg-orange-500 h-1 rounded-full" style={{ width: `${(e.earned / stats.top_experts[0].earned) * 100}%` }} />
                                </div>
                              </div>
                              <span className="text-xs font-bold text-emerald-600 shrink-0">{fmt(e.earned)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Revenue por categoría + Actividad reciente */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {stats.revenue_by_category?.length > 0 && (
                      <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <p className="text-sm font-bold text-gray-900 mb-3">Revenue por categoría</p>
                        <div className="space-y-2.5">
                          {stats.revenue_by_category.map((c, i) => (
                            <div key={i} className="flex items-center justify-between gap-3">
                              <span className="text-xs text-gray-600 flex-1 truncate">{c.category}</span>
                              <div className="w-24 bg-gray-100 rounded-full h-1.5">
                                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(parseFloat(c.revenue) / parseFloat(stats.revenue_by_category[0].revenue)) * 100}%` }} />
                              </div>
                              <span className="text-xs font-bold text-gray-800 w-20 text-right">{fmt(c.revenue)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-gray-900">Actividad reciente</p>
                        <button onClick={fetchStats} className="text-xs text-orange-500 hover:underline">↺ Actualizar</button>
                      </div>
                      <div className="space-y-3 max-h-56 overflow-y-auto">
                        {stats.activity?.length === 0 && <p className="text-xs text-gray-400">Sin actividad</p>}
                        {stats.activity?.map((a, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <span className="text-base shrink-0">{a.icon}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-700 leading-relaxed">{a.text}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{a.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {stats.experts_pending > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div className="flex-1">
                        <p className="font-bold text-amber-800">{stats.experts_pending} experto{stats.experts_pending > 1 ? 's' : ''} pendiente{stats.experts_pending > 1 ? 's' : ''} de verificar</p>
                        <p className="text-xs text-amber-700 mt-0.5">Revisa la pestaña Verificación para aprobar sus documentos.</p>
                      </div>
                      <button onClick={() => setActiveTab('kyc')} className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shrink-0">
                        Revisar ahora
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── TAB: USUARIOS ── */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="flex flex-wrap gap-2">
                  <SearchInput value={userSearch} onChange={v => { setUserSearch(v); setUserPage(1); }} placeholder="Nombre o email..." />
                  <select value={userRole} onChange={e => { setUserRole(e.target.value); setUserPage(1); }}
                    className="text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400/30">
                    <option value="">Todos los roles</option>
                    <option value="client">Clientes</option>
                    <option value="expert">Expertos</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
                <button onClick={() => handleExport('users')} className="flex items-center gap-1.5 text-xs text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-xl transition-colors font-medium">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Exportar CSV
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>{['#','Usuario','Rol','Oficio','Verificación','Registro',''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {users.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">Sin resultados</td></tr>}
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-4 py-3 text-xs text-gray-400">#{u.id}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{u.name[0].toUpperCase()}</div>
                              <div><p className="text-sm font-semibold text-gray-900">{u.name}</p><p className="text-xs text-gray-400">{u.email}</p></div>
                            </div>
                          </td>
                          <td className="px-4 py-3"><Badge label={u.role} color={u.role === 'expert' ? 'bg-blue-100 text-blue-700' : u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'} /></td>
                          <td className="px-4 py-3 text-xs text-gray-500">{u.expert_profile?.category?.name ?? '—'}</td>
                          <td className="px-4 py-3">
                            {u.role === 'expert'
                              ? u.expert_profile?.is_verified
                                ? <Badge label="✓ Verificado" color="bg-emerald-100 text-emerald-700" />
                                : <Badge label="Pendiente" color="bg-amber-100 text-amber-700" />
                              : <span className="text-xs text-gray-400">—</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString('es-MX')}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openUserDetail(u.id)} className="px-2.5 py-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium">Ver</button>
                              {u.role === 'expert' && !u.expert_profile?.is_verified && (
                                <button onClick={() => handleVerify(u.id, true)} className="px-2.5 py-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors font-medium">Verificar</button>
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
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="flex flex-wrap gap-2">
                  <SearchInput value={jobSearch} onChange={v => { setJobSearch(v); setJobPage(1); }} placeholder="Buscar trabajo..." />
                  <select value={jobStatus} onChange={e => { setJobStatus(e.target.value); setJobPage(1); }}
                    className="text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400/30">
                    <option value="">Todos</option>
                    {['buscando','asignado','completado','cancelado'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <button onClick={() => handleExport('jobs')} className="flex items-center gap-1.5 text-xs text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-xl transition-colors font-medium">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Exportar CSV
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>{['#','Trabajo','Oficio','Cliente','Experto','Presupuesto','Estado','Fecha',''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {jobs.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-400">Sin resultados</td></tr>}
                      {jobs.map(j => (
                        <tr key={j.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-4 py-3 text-xs text-gray-400">#{j.id}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[180px] truncate">{j.title}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{j.category?.name ?? '—'}</td>
                          <td className="px-4 py-3">
                            {j.client ? (
                              <button onClick={() => openUserDetail(j.client_id ?? j.client?.id)}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium text-left">
                                {j.client.name}
                              </button>
                            ) : <span className="text-gray-400 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {j.expert ? (
                              <button onClick={() => openUserDetail(j.expert_id ?? j.expert?.id)}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium text-left">
                                {j.expert.name}
                              </button>
                            ) : <span className="text-gray-400 text-xs italic">Sin asignar</span>}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{j.budget ? fmt(j.budget) : '—'}</td>
                          <td className="px-4 py-3"><Badge label={j.status} color={STATUS_COLOR[j.status]} /></td>
                          <td className="px-4 py-3 text-xs text-gray-400">{new Date(j.created_at).toLocaleDateString('es-MX')}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => openJobDetail(j.id)} className="opacity-0 group-hover:opacity-100 px-2.5 py-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all font-medium">Ver</button>
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
            <div className="space-y-4">
              {paymentTotals && (
                <div className="grid grid-cols-3 gap-4">
                  <StatCard label="En escrow" value={fmt(paymentTotals.retenido)} icon="🔒" color="bg-amber-100 text-amber-600" />
                  <StatCard label="Liberado a expertos" value={fmt(paymentTotals.liberado)} icon="✅" color="bg-emerald-100 text-emerald-600" />
                  <StatCard label="Reembolsado" value={fmt(paymentTotals.reembolsado)} icon="↩️" color="bg-red-100 text-red-500" />
                </div>
              )}
              <select value={paymentStatus} onChange={e => { setPaymentStatus(e.target.value); setPaymentPage(1); }}
                className="text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400/30">
                <option value="">Todos los estados</option>
                <option value="retenido_en_app">Retenido</option>
                <option value="liberado_al_experto">Liberado</option>
                <option value="reembolsado">Reembolsado</option>
              </select>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>{['#','Trabajo','Cliente','Experto','Monto','Estado','Fecha'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {payments.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">Sin pagos</td></tr>}
                      {payments.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 text-xs text-gray-400">#{p.id}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 max-w-[160px] truncate">{p.service_job?.title ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{p.service_job?.client?.name ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{p.service_job?.expert?.name ?? '—'}</td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">{fmt(p.amount)}</td>
                          <td className="px-4 py-3"><Badge label={p.status.replace(/_/g,' ')} color={PAYMENT_COLOR[p.status]} /></td>
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

          {/* ── TAB: KYC ── */}
          {activeTab === 'kyc' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Verificaciones pendientes</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Revisa los documentos de identidad de los expertos</p>
                </div>
                <button onClick={fetchKycUsers} className="flex items-center gap-1.5 text-xs text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-xl transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  Actualizar
                </button>
              </div>
              {kycLoading ? (
                <div className="flex justify-center py-12"><svg className="animate-spin w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>
              ) : kycUsers.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <div className="text-5xl mb-3">🎉</div>
                  <p className="font-semibold text-gray-700">Todo al día</p>
                  <p className="text-sm text-gray-400 mt-1">No hay documentos pendientes de revisión.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {kycUsers.map(u => (
                    <div key={u.id} className="bg-white rounded-2xl border border-amber-200 p-5 hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold shrink-0">{u.name?.[0]?.toUpperCase()}</div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{u.name}</p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                        <span className="text-xs text-amber-700 font-medium">Documentos enviados · Pendiente revisión</span>
                      </div>
                      <button onClick={() => openKycDocs(u.id)}
                        className="w-full py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors">
                        Revisar documentos →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: DISPUTAS ── */}
          {activeTab === 'disputes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Disputas</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Gestiona los conflictos entre clientes y expertos</p>
                </div>
                <button onClick={fetchDisputes} className="flex items-center gap-1.5 text-xs text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-xl transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  Actualizar
                </button>
              </div>
              {disputesLoading ? (
                <div className="flex justify-center py-12"><svg className="animate-spin w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>
              ) : disputes.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <div className="text-5xl mb-3">✅</div>
                  <p className="font-semibold text-gray-700">Sin disputas activas</p>
                  <p className="text-sm text-gray-400 mt-1">No hay conflictos pendientes de resolución.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {disputes.map(d => (
                    <div key={d.id} className={`bg-white rounded-2xl border p-5 ${d.status === 'resuelto' ? 'border-gray-100 opacity-70' : 'border-red-200'}`}>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-gray-900">{d.service_job?.title ?? `Trabajo #${d.service_job_id}`}</span>
                            <Badge label={d.status} color={d.status === 'resuelto' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'} />
                          </div>
                          <p className="text-xs text-gray-500">
                            Cliente: <strong>{d.service_job?.client?.name ?? '—'}</strong> · Experto: <strong>{d.service_job?.expert?.name ?? '—'}</strong>
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{new Date(d.created_at).toLocaleDateString('es-MX', { dateStyle: 'long' })}</p>
                        </div>
                        {d.service_job?.payment && (
                          <div className="bg-gray-50 rounded-xl px-3 py-2 text-right shrink-0">
                            <p className="text-xs text-gray-400">En disputa</p>
                            <p className="font-bold text-gray-900">{fmt(d.service_job.payment.amount)}</p>
                          </div>
                        )}
                      </div>
                      <div className="bg-red-50 rounded-xl p-3 mb-3">
                        <p className="text-xs font-semibold text-red-800 mb-1">Motivo de la disputa</p>
                        <p className="text-sm text-red-700">{d.reason}</p>
                      </div>
                      {d.resolution && (
                        <div className="bg-emerald-50 rounded-xl p-3 mb-3">
                          <p className="text-xs font-semibold text-emerald-800 mb-1">Resolución</p>
                          <p className="text-sm text-emerald-700">{d.resolution}</p>
                        </div>
                      )}
                      {d.status !== 'resuelto' && (
                        <DisputeResolver disputeId={d.id} onResolve={handleResolveDispute} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: RESEÑAS ── */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Gestión de reseñas</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Modera las calificaciones de la plataforma</p>
                </div>
                <select value={reviewFilter} onChange={e => { setReviewFilter(e.target.value); setReviewPage(1); }}
                  className="text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none">
                  <option value="">Todas las calificaciones</option>
                  <option value="2">⭐ Solo 1-2 estrellas</option>
                  <option value="3">⭐ Máximo 3 estrellas</option>
                </select>
              </div>
              {reviewsLoading ? (
                <div className="flex justify-center py-12"><svg className="animate-spin w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50">
                        <tr>{['#','Trabajo','Cliente','Experto','Rating','Comentario','Fecha',''].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(reviews ?? []).length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">Sin reseñas</td></tr>}
                        {(reviews ?? []).map(r => (
                          <tr key={r.id} className="hover:bg-gray-50/50 group">
                            <td className="px-4 py-3 text-xs text-gray-400">#{r.id}</td>
                            <td className="px-4 py-3 text-xs text-gray-600 max-w-[120px] truncate">{r.job?.title ?? '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{r.client?.name ?? '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{r.expert?.name ?? '—'}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <span className={`text-sm font-bold ${r.rating >= 4 ? 'text-emerald-600' : r.rating >= 3 ? 'text-amber-600' : 'text-red-500'}`}>{r.rating}</span>
                                <span className="text-amber-400">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate italic">{r.comment ? `"${r.comment}"` : <span className="text-gray-300">Sin comentario</span>}</td>
                            <td className="px-4 py-3 text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('es-MX')}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => handleDeleteReview(r.id)}
                                className="opacity-0 group-hover:opacity-100 px-2.5 py-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all font-medium">
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination meta={reviewsMeta} onPage={setReviewPage} />
                </div>
              )}
            </div>
          )}

          {/* ── TAB: NOTIFICACIONES ── */}
          {activeTab === 'notifications' && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Enviar notificación */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-24">
                  <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-900 text-sm">📢 Enviar notificación</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Broadcast a usuarios de la plataforma</p>
                  </div>
                  <form onSubmit={handleBroadcast} className="p-5 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Destinatarios</label>
                      <select value={broadcastForm.target} onChange={e => setBroadcastForm(p => ({ ...p, target: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30">
                        <option value="all">Todos los usuarios</option>
                        <option value="clients">Solo clientes</option>
                        <option value="experts">Solo expertos</option>
                        <option value="user">Usuario específico</option>
                      </select>
                    </div>
                    {broadcastForm.target === 'user' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">ID del usuario</label>
                        <input type="number" value={broadcastForm.user_id} onChange={e => setBroadcastForm(p => ({ ...p, user_id: e.target.value }))}
                          placeholder="Ej. 5" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30" />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Título *</label>
                      <input type="text" value={broadcastForm.title} onChange={e => setBroadcastForm(p => ({ ...p, title: e.target.value }))} required
                        placeholder="Ej. ¡Nueva función disponible!" maxLength={100}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Mensaje *</label>
                      <textarea value={broadcastForm.body} onChange={e => setBroadcastForm(p => ({ ...p, body: e.target.value }))} required
                        placeholder="Descripción del mensaje..." rows={3} maxLength={500}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30 resize-none" />
                      <p className="text-xs text-gray-400 mt-1 text-right">{broadcastForm.body.length}/500</p>
                    </div>
                    <button type="submit" disabled={broadcastSending}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-70">
                      {broadcastSending ? 'Enviando...' : '📤 Enviar notificación'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Log de notificaciones */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Historial de notificaciones</h3>
                  <button onClick={fetchNotifs} className="text-xs text-orange-500 hover:underline">↺ Actualizar</button>
                </div>
                {notifsLoading ? (
                  <div className="flex justify-center py-12"><svg className="animate-spin w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-50">
                      {(notifs ?? []).length === 0 && <p className="text-sm text-gray-400 text-center py-8">Sin notificaciones</p>}
                      {(notifs ?? []).map(n => (
                        <div key={n.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-gray-50/50">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-gray-300' : 'bg-orange-500'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                              <Badge label={n.type} color="bg-gray-100 text-gray-500" />
                            </div>
                            <p className="text-xs text-gray-500">{n.body}</p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              Para: <span className="font-medium">{n.user?.name ?? `#${n.user_id}`}</span>
                              {' · '}{new Date(n.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Pagination meta={notifsMeta} onPage={setNotifPage} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: OFICIOS ── */}
          {activeTab === 'categories' && (
            <div className="grid md:grid-cols-5 gap-6">
              <div className="md:col-span-2">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-24">
                  <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-900 text-sm">{catForm.id ? '✏️ Editar oficio' : '➕ Nuevo oficio'}</h3>
                  </div>
                  <form onSubmit={handleCatSubmit} className="p-5 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nombre *</label>
                      <input type="text" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                        placeholder="Ej. Plomería" required
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all" />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={catSaving}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-70">
                        {catSaving ? 'Guardando...' : catForm.id ? 'Guardar cambios' : 'Crear oficio'}
                      </button>
                      {catForm.id && (
                        <button type="button" onClick={() => setCatForm({ id: null, name: '' })}
                          className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors">✕</button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
              <div className="md:col-span-3">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-sm">Oficios registrados</h3>
                    <Badge label={`${categories.length} total`} color="bg-gray-100 text-gray-600" />
                  </div>
                  <div className="divide-y divide-gray-50">
                    {categories.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Sin categorías.</p>}
                    {categories.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 group transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-base">🏷️</div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{cat.name}</p>
                            <p className="text-xs text-gray-400">ID #{cat.id}</p>
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

        </main>
      </div>
    </div>
  );
}

// ── Dispute Resolver inline ────────────────────────────────────────
function DisputeResolver({ disputeId, onResolve }) {
  const [resolution, setResolution] = useState('');
  const [saving, setSaving] = useState(false);
  return (
    <div className="space-y-2">
      <textarea value={resolution} onChange={e => setResolution(e.target.value)}
        placeholder="Escribe la resolución (ej. Reembolso al cliente, liberado al experto...)..." rows={2}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30 resize-none" />
      <button disabled={!resolution.trim() || saving}
        onClick={async () => { setSaving(true); await onResolve(disputeId, resolution); setSaving(false); }}
        className="w-full py-2.5 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors disabled:opacity-50">
        {saving ? 'Resolviendo...' : '✅ Marcar como resuelta'}
      </button>
    </div>
  );
}
