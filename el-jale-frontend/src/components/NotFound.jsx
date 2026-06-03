// src/components/NotFound.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const navigate  = useNavigate();
  const [count, setCount] = useState(8);

  // Auto-redirect en 8 segundos
  useEffect(() => {
    const iv = setInterval(() => setCount(c => c - 1), 1000);
    const to = setTimeout(() => navigate('/'), 8000);
    return () => { clearInterval(iv); clearTimeout(to); };
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Fondo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.08),transparent_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative text-center max-w-lg">
        {/* 404 grande */}
        <div className="text-[120px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-orange-600 select-none mb-4">
          404
        </div>

        <h1 className="text-2xl font-black text-white mb-3">
          Esta página no existe
        </h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          La ruta que buscas no se encontró o fue movida.<br />
          Te redirigimos al inicio en <span className="text-orange-400 font-bold">{count}s</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-2xl transition-all active:scale-95">
            Ir al inicio
          </Link>
          <button onClick={() => navigate(-1)}
            className="border border-white/20 text-white/80 hover:bg-white/10 font-semibold px-8 py-3 rounded-2xl transition-all">
            ← Volver
          </button>
        </div>

        {/* Links útiles */}
        <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          {[
            { to: '/login',    label: 'Iniciar sesión' },
            { to: '/register', label: 'Registrarse' },
            { to: '/servicios/fontaneros', label: 'Ver expertos' },
          ].map(l => (
            <Link key={l.to} to={l.to} className="text-gray-500 hover:text-orange-400 transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
