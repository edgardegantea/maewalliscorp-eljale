// src/components/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/login', formData);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      const role = response.data.user.role;
      if (role === 'expert') navigate('/expert-dashboard');
      else if (role === 'admin') navigate('/admin');
      else navigate('/client-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-dark flex-col justify-between p-12 relative overflow-hidden">
        {/* Círculos decorativos */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-accent/10 rounded-full blur-2xl" />

        <div className="relative">
          <span className="text-3xl font-black text-white tracking-tight">
            El <span className="text-brand-primary">Jale</span>
          </span>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-5xl font-black text-white leading-tight">
            Conectamos talento<br />
            con quien lo<br />
            <span className="text-brand-primary">necesita.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-sm">
            Especialistas verificados para cada trabajo del hogar. Rápido, seguro y con garantía de pago.
          </p>

          <div className="flex gap-6 pt-4">
            {[
              { num: '50+', label: 'Especialistas' },
              { num: '100%', label: 'Verificados' },
              { num: '$0', label: 'Sin regateos' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-black text-white">{s.num}</p>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-gray-600">© 2025 El Jale · Maewalliscorp</p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-white">
        <div className="max-w-sm w-full mx-auto">
          {/* Logo móvil */}
          <div className="lg:hidden mb-8">
            <span className="text-2xl font-black text-brand-dark">
              El <span className="text-brand-primary">Jale</span>
            </span>
          </div>

          <div className="mb-8 animate-fade-in">
            <h2 className="text-3xl font-black text-gray-900">Bienvenido</h2>
            <p className="text-gray-500 mt-1 text-sm">Inicia sesión en tu cuenta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Correo electrónico
              </label>
              <input
                name="email" type="email" required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="tu@correo.com"
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Contraseña
              </label>
              <input
                name="password" type="password" required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="input"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 py-3 text-base">
              {loading ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Entrando...</>
              ) : 'Iniciar sesión'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-semibold text-brand-primary hover:text-orange-600 transition-colors">
              Únete gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
