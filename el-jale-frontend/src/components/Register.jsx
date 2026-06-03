// src/components/Register.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
  const [searchParams]  = useSearchParams();
  const refCode         = searchParams.get('ref') || '';
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: searchParams.get('role') || 'client', category_id: '', experience_years: '', phone: '', referral_code: refCode });
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/categories').then(res => {
      setCategories(res.data);
      if (res.data.length > 0) setFormData(prev => ({ ...prev, category_id: res.data[0].id }));
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = { ...formData };
      if (formData.role === 'client') { delete payload.category_id; delete payload.experience_years; }
      const response = await api.post('/register', payload);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setMessage({ type: 'success', text: '¡Cuenta creada!' });
      setTimeout(() => navigate(formData.role === 'expert' ? '/expert-dashboard' : '/client-dashboard'), 800);
    } catch (error) {
      const errors = error.response?.data?.errors;
      const first = errors ? Object.values(errors)[0][0] : null;
      setMessage({ type: 'error', text: first || error.response?.data?.message || 'Error al registrarse.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isExpert = formData.role === 'expert';

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo */}
      <div className="hidden lg:flex lg:w-5/12 bg-brand-dark flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 -left-20 w-72 h-72 bg-brand-accent/10 rounded-full blur-2xl" />

        <span className="relative text-3xl font-black text-white">El <span className="text-brand-primary">Jale</span></span>

        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-primary/20 rounded-full">
            <span className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
            <span className="text-brand-primary text-xs font-bold uppercase tracking-widest">Socios Fundadores</span>
          </div>
          <h2 className="text-4xl font-black text-white leading-tight">
            Sé parte de los<br />primeros <span className="text-brand-accent">50 expertos</span><br />de la plataforma.
          </h2>
          <p className="text-gray-400 text-sm">Comisión preferencial de por vida para los socios fundadores.</p>

          <div className="space-y-3 pt-4">
            {[
              'Perfil verificado y visible a clientes',
              'Pago seguro garantizado por la plataforma',
              'Sin regateos — precio acordado, precio pagado',
            ].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-primary/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-brand-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <span className="text-gray-300 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-gray-600">© 2025 El Jale · Maewalliscorp</p>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 bg-white overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          <div className="lg:hidden mb-6">
            <span className="text-2xl font-black text-brand-dark">El <span className="text-brand-primary">Jale</span></span>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-black text-gray-900">Crear cuenta</h2>
            <p className="text-gray-500 mt-1 text-sm">Empieza gratis en menos de 2 minutos</p>
          </div>

          {/* Selector de rol */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: 'client', label: 'Soy Cliente', icon: '🏠', desc: 'Necesito un servicio' },
              { value: 'expert', label: 'Soy Experto', icon: '🔧', desc: 'Ofrezco mis servicios' },
            ].map(opt => (
              <button
                key={opt.value} type="button"
                onClick={() => setFormData({ ...formData, role: opt.value })}
                className={`p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
                  formData.role === opt.value
                    ? 'border-brand-primary bg-orange-50 shadow-glow'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}
              >
                <span className="text-2xl block mb-1">{opt.icon}</span>
                <p className={`font-bold text-sm ${formData.role === opt.value ? 'text-brand-primary' : 'text-gray-800'}`}>{opt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Nombre completo</label>
              <input name="name" type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Tu nombre" className="input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Correo electrónico</label>
              <input name="email" type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="tu@correo.com" className="input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Contraseña</label>
              <input name="password" type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Mín. 8 caracteres" className="input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Teléfono <span className="font-normal text-gray-400">(opcional)</span></label>
              <input name="phone" type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+52 55 1234 5678" className="input" />
            </div>
            {refCode && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                <span>🎁</span>
                <span>Tienes un código de referido: <strong>{refCode}</strong></span>
              </div>
            )}
            {!refCode && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Código de referido <span className="font-normal text-gray-400">(opcional)</span></label>
                <input name="referral_code" type="text" value={formData.referral_code} onChange={e => setFormData({ ...formData, referral_code: e.target.value.toUpperCase() })} placeholder="ABC12345" className="input" maxLength={8} />
              </div>
            )}

            {isExpert && (
              <div className="space-y-4 p-4 bg-orange-50 rounded-2xl border border-orange-100 animate-slide-up">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Tu especialidad</label>
                  <select value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} className="input">
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Años de experiencia</label>
                  <input type="number" min="0" value={formData.experience_years} onChange={e => setFormData({ ...formData, experience_years: e.target.value })} placeholder="Ej. 5" className="input" required />
                </div>
                <div className="flex items-start gap-2 text-xs text-orange-700 bg-orange-100 p-3 rounded-xl">
                  <span className="text-base">⭐</span>
                  <span>Los primeros <strong>50 expertos</strong> obtienen comisión preferencial de por vida como Socios Fundadores.</span>
                </div>
              </div>
            )}

            {message.text && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-sm border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
                {message.type === 'success' ? '✓' : '✕'} {message.text}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-base mt-2">
              {isSubmitting ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Creando cuenta...</>
              ) : isExpert ? '🔧 Reclamar Kit Fundador' : '🚀 Crear cuenta gratis'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold text-brand-primary hover:text-orange-600 transition-colors">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
