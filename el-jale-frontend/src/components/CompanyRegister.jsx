// src/components/CompanyRegister.jsx — Registro de cuenta empresarial
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function CompanyRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company_name: '', rfc: '', contact_name: '',
    email: '', password: '', phone: '', city: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.post('/register/company', form);
      localStorage.setItem('token', r.data.token);
      localStorage.setItem('user', JSON.stringify(r.data.user));
      toast.success('¡Cuenta empresarial creada! Bienvenido a El Jale Empresas.');
      navigate('/empresas');
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Error al registrar empresa');
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 mb-6">
            <span className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black">J</span>
            <span className="text-2xl font-black text-gray-900">El <span className="text-orange-500">Jale</span></span>
          </Link>
          <h1 className="text-2xl font-black text-gray-900">Cuenta Empresarial</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona los servicios de tu empresa en un solo lugar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Nombre de la empresa *</label>
                <input type="text" required value={form.company_name}
                  onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                  placeholder="Ej. Inmobiliaria Juárez S.A."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">RFC</label>
                <input type="text" value={form.rfc} maxLength={13}
                  onChange={e => setForm(f => ({ ...f, rfc: e.target.value.toUpperCase() }))}
                  placeholder="RFC123456789"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Ciudad</label>
                <input type="text" value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="CDMX"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Nombre del contacto *</label>
                <input type="text" required value={form.contact_name}
                  onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                  placeholder="Tu nombre completo"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Email corporativo *</label>
                <input type="email" required value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="contacto@empresa.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Contraseña *</label>
                <input type="password" required minLength={8} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Teléfono</label>
                <input type="tel" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+52 55 1234 5678"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30" />
              </div>
            </div>

            {/* Beneficios */}
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
              <p className="text-xs font-bold text-orange-800 mb-2">Incluido en tu cuenta empresarial:</p>
              <div className="grid grid-cols-2 gap-1">
                {['👥 Equipo ilimitado', '💳 Facturación centralizada', '📊 Dashboard con analytics', '🔧 Gestión de todos los Jales', '📋 Historial de servicios', '🏢 RFC en facturas'].map(b => (
                  <p key={b} className="text-xs text-orange-700">{b}</p>
                ))}
              </div>
            </div>

            <button type="submit" disabled={saving}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-60 text-base">
              {saving ? 'Creando cuenta...' : '🏢 Crear cuenta empresarial'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            ¿Eres particular?{' '}
            <Link to="/register" className="text-orange-500 hover:underline font-semibold">Registro estándar →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
