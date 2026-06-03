// src/components/CategoryPage.jsx
// Página SEO pública: /expertos/:categoria (ej. /expertos/fontaneros)
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const CATEGORY_META = {
  fontaneros:    { title: 'Fontaneros',    emoji: '🔧', desc: 'Repara fugas, tuberías e instalaciones hidráulicas.' },
  electricistas: { title: 'Electricistas', emoji: '⚡', desc: 'Instalaciones eléctricas, cortacircuitos y más.' },
  pintores:      { title: 'Pintores',      emoji: '🎨', desc: 'Pintura interior y exterior, paredes y techos.' },
  carpinteros:   { title: 'Carpinteros',   emoji: '🪵', desc: 'Muebles, reparaciones y trabajos de madera.' },
  limpieza:      { title: 'Limpieza',      emoji: '🧹', desc: 'Limpieza del hogar, oficinas y espacios.' },
  cerrajeros:    { title: 'Cerrajeros',    emoji: '🔑', desc: 'Cerraduras, llaves y apertura de emergencia.' },
  jardineros:    { title: 'Jardineros',    emoji: '🌿', desc: 'Jardines, podas y mantenimiento de áreas verdes.' },
  mudanzas:      { title: 'Mudanzas',      emoji: '📦', desc: 'Servicio de mudanza local y foráneo.' },
};

export default function CategoryPage() {
  const { categoria } = useParams();
  const navigate      = useNavigate();
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const meta = CATEGORY_META[categoria] || { title: categoria, emoji: '🛠️', desc: 'Expertos en ' + categoria };

  useEffect(() => {
    // SEO: actualizar title y meta description
    document.title = `${meta.title} en tu ciudad | El Jale`;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.name = 'description'; document.head.appendChild(metaDesc); }
    metaDesc.content = `Encuentra ${meta.title.toLowerCase()} verificados cerca de ti. ${meta.desc} Contrata rápido y seguro en El Jale.`;

    // Cargar expertos de esta categoría
    api.get('/experts', { params: { search: meta.title, available: true } })
      .then(r => setExperts(Array.isArray(r.data) ? r.data : r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categoria]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white py-16 px-4 text-center">
        <div className="text-6xl mb-4">{meta.emoji}</div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">{meta.title} en tu ciudad</h1>
        <p className="text-orange-100 text-lg max-w-xl mx-auto">{meta.desc}</p>
        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          <Link to="/register" className="bg-white text-orange-600 font-bold px-6 py-3 rounded-xl hover:bg-orange-50 transition">
            Publicar trabajo gratis
          </Link>
          <Link to="/login" className="border-2 border-white text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition">
            Iniciar sesión
          </Link>
        </div>
      </div>

      {/* Expertos */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {loading ? 'Cargando...' : `${experts.length} ${meta.title.toLowerCase()} disponibles`}
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-48 shadow-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {experts.map(expert => (
              <Link
                key={expert.id}
                to={`/expertos/${expert.user_id}`}
                className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition border border-gray-100 group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-lg flex-shrink-0">
                    {expert.user?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate group-hover:text-orange-600 transition">
                      {expert.user?.name}
                    </p>
                    <p className="text-xs text-gray-500">{expert.city || 'Tu ciudad'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm mb-2">
                  <span className="text-yellow-500">⭐</span>
                  <span className="font-semibold">{Number(expert.average_rating || 0).toFixed(1)}</span>
                  <span className="text-gray-400">({expert.total_reviews || 0})</span>
                </div>
                {expert.bio && <p className="text-xs text-gray-500 line-clamp-2">{expert.bio}</p>}
                <div className="mt-3 flex items-center justify-between">
                  {expert.hourly_rate && (
                    <span className="text-sm font-semibold text-orange-600">${expert.hourly_rate}/hr</span>
                  )}
                  {expert.is_verified && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Verificado</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && experts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">{meta.emoji}</div>
            <p className="text-gray-600 mb-4">Aún no hay {meta.title.toLowerCase()} registrados en esta área.</p>
            <Link to="/register?role=client" className="bg-orange-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-orange-600 transition">
              Publicar trabajo gratis
            </Link>
          </div>
        )}

        {/* CTA SEO */}
        <div className="mt-12 bg-orange-500 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">¿Necesitas un {meta.title.slice(0,-1).toLowerCase()}?</h3>
          <p className="text-orange-100 mb-6">Publica tu trabajo gratis y recibe cotizaciones en minutos.</p>
          <Link to="/register" className="bg-white text-orange-600 font-bold px-8 py-3 rounded-xl hover:bg-orange-50 transition">
            Empezar ahora — Es gratis
          </Link>
        </div>
      </div>
    </div>
  );
}
