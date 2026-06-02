// src/components/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/login', formData);
      
      // Guardamos el token y los datos del usuario en el navegador
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Redirección inteligente basada en el rol
      const role = response.data.user.role;
      if (role === 'expert') navigate('/expert-dashboard');
      else if (role === 'admin') navigate('/admin');
      else navigate('/client-dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Credenciales incorrectas');
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-brand-dark">
          Bienvenido a <span className="text-brand-primary">El Jale</span>
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Inicia sesión para continuar
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border-t-4 border-brand-primary">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
              <input name="email" type="email" required onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm mt-1" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input name="password" type="password" required onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm mt-1" />
            </div>

            <div>
              <button type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-dark hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark transition-colors">
                Entrar
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded text-center text-sm font-semibold">
              {error}
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/register" className="text-sm text-brand-primary hover:text-orange-600 font-medium">
              ¿No tienes cuenta? Únete como Socio Fundador
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}