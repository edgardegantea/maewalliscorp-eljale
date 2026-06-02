// src/components/ExploreExperts.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import StarRating from './StarRating';
import { SkeletonCard } from './Skeleton';

export default function ExploreExperts() {
  const [experts, setExperts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = selectedCategory ? `?category_id=${selectedCategory}` : '';
    api.get(`/experts${params}`)
      .then(r => setExperts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-brand-light">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate('/client-dashboard')} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-extrabold text-xl text-brand-dark">
            El <span className="text-brand-primary">Jale</span>
          </span>
          <span className="text-gray-400">/ Explorar Expertos</span>
          <span className="ml-auto text-sm text-gray-600">Hola, {user?.name}</span>
        </div>
      </nav>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Nuestros Especialistas</h1>
          <p className="text-sm text-gray-500 mt-1">Todos verificados por el equipo de El Jale.</p>
        </div>

        {/* Filtro por categoría */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === '' ? 'bg-brand-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Todos los oficios
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(String(cat.id))}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === String(cat.id)
                  ? 'bg-brand-primary text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : experts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 text-sm">No hay expertos disponibles en esta categoría aún.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {experts.map(expert => (
              <Link
                key={expert.id}
                to={`/expertos/${expert.id}`}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="bg-brand-dark h-12 relative" />
                <div className="px-5 pb-5 flex-grow">
                  <div className="-mt-6 mb-3 flex items-end gap-3">
                    <div className="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center text-white text-xl font-extrabold border-2 border-white shadow">
                      {expert.name[0].toUpperCase()}
                    </div>
                    {expert.is_founding_member && (
                      <span className="mb-1 px-2 py-0.5 bg-brand-accent text-brand-dark text-xs font-bold rounded-full">
                        Socio Fundador
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900">{expert.name}</h3>
                  <p className="text-xs text-brand-primary font-medium mt-0.5">{expert.category?.name}</p>

                  {expert.bio && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{expert.bio}</p>
                  )}

                  <div className="mt-3 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <StarRating value={Math.round(expert.average_rating)} readonly size="sm" />
                      <span className="text-xs text-gray-500">
                        {expert.average_rating > 0
                          ? `${Number(expert.average_rating).toFixed(1)} (${expert.total_reviews} reseñas)`
                          : 'Sin calificaciones aún'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      <strong className="text-gray-700">{expert.experience_years}</strong> años de experiencia
                    </p>
                  </div>
                </div>

                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                  <span className="text-xs font-medium text-brand-primary">Ver perfil completo →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
