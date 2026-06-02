// src/components/Register.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'client',
    category_id: '',
    experience_years: ''
  });
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/categories').then(res => {
      setCategories(res.data);
      if (res.data.length > 0) {
        setFormData(prev => ({ ...prev, category_id: res.data[0].id }));
      }
    }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = { ...formData };
      if (formData.role === 'client') {
        delete payload.category_id;
        delete payload.experience_years;
      }

      const response = await api.post('/register', payload);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      setMessage({ type: 'success', text: '¡Registro exitoso! Bienvenido.' });
      setTimeout(() => {
        navigate(formData.role === 'expert' ? '/expert-dashboard' : '/client-dashboard');
      }, 1000);
    } catch (error) {
      const errors = error.response?.data?.errors;
      const firstError = errors ? Object.values(errors)[0][0] : null;
      setMessage({ type: 'error', text: firstError || error.response?.data?.message || 'Error al registrarse.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isExpert = formData.role === 'expert';

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-white">
          Únete a <span className="text-brand-primary">El Jale</span>
        </h2>
        <p className="mt-2 text-sm text-gray-300">
          Conectando talento local con quien lo necesita
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border-t-4 border-brand-accent">

          {/* Selector de Rol */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quiero registrarme como</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'client', label: 'Cliente', desc: 'Necesito un servicio' },
                { value: 'expert', label: 'Experto', desc: 'Ofrezco mis servicios' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: opt.value })}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    formData.role === opt.value
                      ? 'border-brand-primary bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className={`font-bold text-sm ${formData.role === opt.value ? 'text-brand-primary' : 'text-gray-700'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
              <input
                name="name" type="text" required onChange={handleChange} value={formData.name}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
              <input
                name="email" type="email" required onChange={handleChange} value={formData.email}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input
                name="password" type="password" required onChange={handleChange} value={formData.password}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              />
            </div>

            {/* Campos exclusivos para expertos */}
            {isExpert && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tu oficio / especialidad</label>
                  <select
                    name="category_id" required onChange={handleChange} value={formData.category_id}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                  >
                    {categories.length === 0 && (
                      <option value="">Cargando categorías...</option>
                    )}
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Años de experiencia</label>
                  <input
                    name="experience_years" type="number" required min="0" onChange={handleChange} value={formData.experience_years}
                    placeholder="Ej. 5"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-xs text-yellow-800 font-medium">
                    Socio Fundador: Los primeros 50 expertos obtienen comisión preferencial de por vida.
                  </p>
                </div>
              </>
            )}

            {message.text && (
              <div className={`p-3 rounded-md text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Registrando...' : isExpert ? 'Reclamar Kit Fundador' : 'Crear Cuenta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-medium text-brand-primary hover:text-orange-600">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
