// src/components/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import StarRating from './StarRating';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { SkeletonStat } from './Skeleton';

const STATUS_COLOR = {
  buscando:   'bg-yellow-100 text-yellow-800',
  asignado:   'bg-blue-100 text-blue-800',
  completado: 'bg-green-100 text-green-800',
  cancelado:  'bg-red-100 text-red-800',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentTotals, setPaymentTotals] = useState(null);
  const [categories, setCategories] = useState([]);
  const [catForm, setCatForm] = useState({ id: null, name: '', description: '' });
  const [catSaving, setCatSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('stats');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    if (activeTab === 'users')      fetchUsers();
    if (activeTab === 'jobs')       fetchJobs();
    if (activeTab === 'payments')   fetchPayments();
    if (activeTab === 'categories') fetchCategories();
  }, [activeTab]);

  const fetchStats = async () => {
    try { const r = await api.get('/admin/stats'); setStats(r.data); } catch {}
  };
  const fetchUsers = async () => {
    try { const r = await api.get('/admin/users'); setUsers(r.data.data); } catch {}
  };
  const fetchJobs = async () => {
    try { const r = await api.get('/admin/jobs'); setJobs(r.data.data); } catch {}
  };
  const fetchPayments = async () => {
    try {
      const r = await api.get('/admin/payments');
      setPayments(r.data.payments.data);
      setPaymentTotals(r.data.totals);
    } catch {}
  };

  const fetchCategories = async () => {
    try { const r = await api.get('/categories'); setCategories(r.data); } catch {}
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;
    setCatSaving(true);
    try {
      if (catForm.id) {
        await api.put(`/categories/${catForm.id}`, { name: catForm.name, description: catForm.description });
        toast.success('Categoría actualizada.');
      } else {
        await api.post('/categories', { name: catForm.name, description: catForm.description });
        toast.success('Categoría creada.');
      }
      setCatForm({ id: null, name: '', description: '' });
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar.');
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCat = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría? Los trabajos vinculados podrían verse afectados.')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Categoría eliminada.');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar.');
    }
  };

  const handleVerify = async (userId, verify) => {
    const endpoint = verify ? `/admin/experts/${userId}/verify` : `/admin/experts/${userId}/reject`;
    try {
      const r = await api.post(endpoint);
      toast.success(r.data.message);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleLogout = async () => {
    try { await api.post('/logout'); } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const tabs = [
    { id: 'stats',      label: 'Resumen' },
    { id: 'users',      label: 'Usuarios' },
    { id: 'jobs',       label: 'Trabajos' },
    { id: 'payments',   label: 'Pagos' },
    { id: 'categories', label: 'Oficios' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar Admin */}
      <nav className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-xl text-white">
                El <span className="text-brand-primary">Jale</span>
              </span>
              <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded">ADMIN</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">{user?.name}</span>
              <button onClick={handleLogout} className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm transition-colors">
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex border-b border-gray-300 mb-6">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.id ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Stats */}
        {activeTab === 'stats' && !stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <SkeletonStat key={i} />)}
          </div>
        )}
        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Usuarios totales', value: stats.total_users,   color: 'bg-white' },
                { label: 'Clientes',         value: stats.total_clients, color: 'bg-white' },
                { label: 'Expertos',         value: stats.total_experts, color: 'bg-white' },
                { label: 'Jales totales',    value: stats.total_jobs,    color: 'bg-white' },
              ].map(s => (
                <div key={s.label} className={`${s.color} rounded-lg shadow-sm p-5 border border-gray-200`}>
                  <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Buscando experto', value: stats.jobs_buscando,   badge: 'bg-yellow-100 text-yellow-800' },
                { label: 'En progreso',       value: stats.jobs_asignado,   badge: 'bg-blue-100 text-blue-800' },
                { label: 'Completados',       value: stats.jobs_completado, badge: 'bg-green-100 text-green-800' },
                { label: 'Calificación prom.', value: stats.avg_rating ? `${stats.avg_rating} ⭐` : 'N/A', badge: 'bg-orange-100 text-orange-800' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
                  <p className={`inline-block text-2xl font-extrabold px-2 py-0.5 rounded ${s.badge}`}>{s.value}</p>
                  <p className="text-sm text-gray-500 mt-2">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Usuarios */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['ID', 'Nombre', 'Email', 'Rol', 'Oficio', 'Verificado', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">#{u.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {u.role === 'expert'
                        ? <Link to={`/expertos/${u.id}`} className="text-brand-primary hover:underline">{u.name}</Link>
                        : u.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        u.role === 'expert' ? 'bg-blue-100 text-blue-700' :
                        u.role === 'admin'  ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {u.expert_profile?.category?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'expert' ? (
                        u.expert_profile?.is_verified
                          ? <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">✓ Verificado</span>
                          : <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Pendiente</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'expert' && (
                        <div className="flex gap-2">
                          {!u.expert_profile?.is_verified && (
                            <button
                              onClick={() => handleVerify(u.id, true)}
                              className="text-xs font-medium text-white bg-green-600 hover:bg-green-700 px-2 py-1 rounded transition-colors"
                            >
                              Verificar
                            </button>
                          )}
                          {u.expert_profile?.is_verified && (
                            <button
                              onClick={() => handleVerify(u.id, false)}
                              className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded transition-colors"
                            >
                              Revocar
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: Trabajos */}
        {activeTab === 'jobs' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['ID', 'Título', 'Oficio', 'Cliente', 'Experto', 'Presupuesto', 'Estado', 'Fecha'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map(j => (
                  <tr key={j.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">#{j.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">{j.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{j.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{j.client?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{j.expert?.name ?? 'Sin asignar'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{j.budget ? `$${j.budget}` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[j.status] || 'bg-gray-100 text-gray-700'}`}>
                        {j.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(j.created_at).toLocaleDateString('es-MX')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: Pagos */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {paymentTotals && (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'En Escrow (retenido)', value: paymentTotals.retenido,    color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
                  { label: 'Liberado a Expertos',  value: paymentTotals.liberado,    color: 'bg-green-50 border-green-200 text-green-800' },
                  { label: 'Reembolsado',          value: paymentTotals.reembolsado, color: 'bg-red-50 border-red-200 text-red-800' },
                ].map(t => (
                  <div key={t.label} className={`rounded-lg border p-4 ${t.color}`}>
                    <p className="text-2xl font-extrabold">${Number(t.value).toFixed(2)}</p>
                    <p className="text-xs font-medium mt-1 opacity-80">{t.label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['ID', 'Trabajo', 'Cliente', 'Experto', 'Monto', 'Estado', 'Fecha'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map(p => {
                    const statusColors = {
                      retenido_en_app:     'bg-yellow-100 text-yellow-800',
                      liberado_al_experto: 'bg-green-100 text-green-800',
                      reembolsado:         'bg-red-100 text-red-700',
                      pendiente:           'bg-gray-100 text-gray-600',
                    };
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">#{p.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{p.service_job?.title ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{p.service_job?.client?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{p.service_job?.expert?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">${Number(p.amount).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[p.status] || 'bg-gray-100 text-gray-700'}`}>
                            {p.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(p.created_at).toLocaleDateString('es-MX')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {payments.length === 0 && (
                <p className="text-center text-sm text-gray-500 py-8">No hay pagos registrados aún.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab: Oficios / Categorías */}
        {activeTab === 'categories' && (
          <div className="grid md:grid-cols-5 gap-6">

            {/* Formulario crear / editar */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-800 px-5 py-3">
                  <h3 className="text-sm font-bold text-white">
                    {catForm.id ? 'Editar oficio' : 'Nuevo oficio'}
                  </h3>
                </div>
                <form onSubmit={handleCatSubmit} className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={catForm.name}
                      onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                      placeholder="Ej. Plomería"
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                    <input
                      type="text"
                      value={catForm.description}
                      onChange={e => setCatForm({ ...catForm, description: e.target.value })}
                      placeholder="Ej. Reparación e instalación de tuberías"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={catSaving}
                      className="flex-1 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-orange-600 rounded-md transition-colors disabled:opacity-75"
                    >
                      {catSaving ? 'Guardando...' : catForm.id ? 'Guardar cambios' : 'Crear oficio'}
                    </button>
                    {catForm.id && (
                      <button
                        type="button"
                        onClick={() => setCatForm({ id: null, name: '', description: '' })}
                        className="px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Lista de categorías */}
            <div className="md:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {categories.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">Sin categorías registradas.</p>
                  )}
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{cat.name}</p>
                        {cat.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => setCatForm({ id: cat.id, name: cat.name, description: cat.description ?? '' })}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteCat(cat.id)}
                          className="text-xs font-medium text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          Eliminar
                        </button>
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
