// src/components/CompanyDashboard.jsx — Dashboard de cuenta empresarial
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

const fmt = n => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n ?? 0);

const STATUS = {
  buscando:   { label: 'Buscando',   cls: 'bg-amber-100 text-amber-700' },
  asignado:   { label: 'En progreso',cls: 'bg-blue-100 text-blue-700' },
  completado: { label: 'Completado', cls: 'bg-emerald-100 text-emerald-700' },
  cancelado:  { label: 'Cancelado',  cls: 'bg-red-100 text-red-600' },
};

export default function CompanyDashboard() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '' });
  const [inviting, setInviting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    api.get('/company/dashboard')
      .then(r => setData(r.data))
      .catch(() => toast.error('Error al cargar el dashboard empresarial'))
      .finally(() => setLoading(false));
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await api.post('/company/invite', inviteForm);
      toast.success(`✅ Invitación enviada a ${inviteForm.email}`);
      setInviteForm({ name: '', email: '' });
      const r = await api.get('/company/dashboard');
      setData(r.data);
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Error al invitar');
    } finally { setInviting(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <svg className="animate-spin w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-md px-4">
        <div className="text-6xl mb-4">🏢</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Cuenta empresarial</h2>
        <p className="text-gray-500 mb-6">Gestiona tus servicios, equipo y presupuesto desde un solo lugar.</p>
        <Link to="/register/empresa" className="btn-primary px-8 py-3">Crear cuenta empresarial →</Link>
      </div>
    </div>
  );

  const { company, team, recent_jobs: jobs, stats } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-slate-800 text-white px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center text-2xl font-black">
              {company.name[0].toUpperCase()}
            </div>
            <div>
              <p className="text-white font-black text-xl">{company.name}</p>
              <p className="text-gray-400 text-sm">{company.city} · Plan {company.plan}</p>
            </div>
            <div className="ml-auto">
              <span className="bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-bold px-3 py-1.5 rounded-full">
                🏢 Cuenta empresarial
              </span>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Trabajos totales',  value: stats.total_jobs,   icon: '📋', color: 'text-blue-400' },
              { label: 'En progreso',       value: stats.active_jobs,  icon: '🔧', color: 'text-amber-400' },
              { label: 'Gasto total',       value: fmt(stats.total_spent), icon: '💰', color: 'text-emerald-400' },
              { label: 'Equipo',            value: stats.team_size,    icon: '👥', color: 'text-purple-400' },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-gray-400 text-xs font-medium mb-1">{s.icon} {s.label}</p>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex bg-white rounded-2xl p-1 shadow-sm gap-1 w-fit mb-6">
          {[
            { id: 'overview', label: '📊 Resumen' },
            { id: 'jobs',     label: '🔧 Trabajos' },
            { id: 'team',     label: '👥 Equipo' },
            { id: 'billing',  label: '💳 Facturación' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${activeTab === t.id ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Resumen */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">Últimos trabajos</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {jobs.length === 0 && (
                    <div className="py-12 text-center text-sm text-gray-400">
                      <Link to="/client-dashboard" className="text-orange-500 hover:underline font-semibold">
                        Publicar el primer trabajo →
                      </Link>
                    </div>
                  )}
                  {jobs.slice(0, 8).map(job => {
                    const s = STATUS[job.status] ?? { label: job.status, cls: 'bg-gray-100 text-gray-600' };
                    return (
                      <div key={job.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {job.category?.name} · {job.expert ? job.expert.name : 'Sin asignar'}
                          </p>
                        </div>
                        <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
                        {job.budget && <p className="text-sm font-bold text-gray-700 flex-shrink-0">{fmt(job.budget)}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Publicar trabajo rápido */}
              <div className="bg-orange-500 rounded-2xl p-5 text-white">
                <p className="font-bold text-lg mb-1">Publicar trabajo</p>
                <p className="text-orange-200 text-sm mb-4">Encuentra el experto correcto para tu empresa en minutos.</p>
                <Link to="/client-dashboard" className="block text-center bg-white text-orange-600 font-bold py-2.5 rounded-xl hover:bg-orange-50 transition-colors text-sm">
                  + Nuevo Jale →
                </Link>
              </div>

              {/* Info empresa */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-sm font-bold text-gray-900 mb-3">Datos de la empresa</p>
                <div className="space-y-2 text-xs text-gray-600">
                  <p>📧 {company.email}</p>
                  {company.rfc && <p>🧾 RFC: {company.rfc}</p>}
                  {company.phone && <p>📱 {company.phone}</p>}
                  {company.city && <p>📍 {company.city}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Equipo */}
        {activeTab === 'team' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">Miembros del equipo</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {team.map(member => (
                    <div key={member.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {member.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-400">{member.email}</p>
                      </div>
                      <p className="text-xs text-gray-400">{new Date(member.created_at).toLocaleDateString('es-MX')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-sm font-bold text-gray-900 mb-4">Invitar colaborador</p>
                <form onSubmit={handleInvite} className="space-y-3">
                  <input type="text" required placeholder="Nombre completo" value={inviteForm.name}
                    onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30" />
                  <input type="email" required placeholder="Email corporativo" value={inviteForm.email}
                    onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30" />
                  <button type="submit" disabled={inviting}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
                    {inviting ? 'Invitando...' : '📨 Enviar invitación'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Facturación */}
        {activeTab === 'billing' && (
          <div className="max-w-xl space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Plan actual</h3>
              <div className="flex items-center gap-4 p-4 bg-orange-50 border border-orange-100 rounded-2xl mb-4">
                <span className="text-3xl">🏢</span>
                <div>
                  <p className="font-black text-gray-900 capitalize">{company.plan}</p>
                  <p className="text-xs text-gray-500">Facturación centralizada para todo el equipo</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Gasto este mes',  value: fmt(stats.total_spent) },
                  { label: 'Presupuesto',     value: company.monthly_budget ? fmt(company.monthly_budget) : 'Sin límite' },
                  { label: 'Trabajos',        value: `${stats.total_jobs} jales` },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-sm py-2 border-b border-gray-50">
                    <span className="text-gray-500">{r.label}</span>
                    <span className="font-semibold text-gray-900">{r.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">Para factura fiscal o cambiar tu plan, escríbenos a empresas@eljale.mx</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
