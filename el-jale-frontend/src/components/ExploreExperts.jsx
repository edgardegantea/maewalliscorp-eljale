// src/components/ExploreExperts.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import StarRating from './StarRating';
import { SkeletonCard } from './Skeleton';

export default function ExploreExperts() {
  const [experts, setExperts]                 = useState([]);
  const [categories, setCategories]           = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery]         = useState('');
  const [onlyAvailable, setOnlyAvailable]     = useState(false);
  const [minRating, setMinRating]             = useState('');
  const [cityFilter, setCityFilter]           = useState('');
  const [loading, setLoading]                 = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  const fetchExperts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category_id', selectedCategory);
    if (onlyAvailable)    params.set('available', 'true');
    if (minRating)        params.set('min_rating', minRating);
    if (searchQuery)      params.set('search', searchQuery);
    if (cityFilter)       params.set('city', cityFilter);

    api.get(`/experts?${params}`)
      .then(r => setExperts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCategory, onlyAvailable, minRating, searchQuery]);

  useEffect(() => {
    const t = setTimeout(fetchExperts, searchQuery ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchExperts]);

  // Detectar ciudad del cliente automáticamente al cargar
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async ({ coords }) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&accept-language=es`);
          const data = await res.json();
          const city = data.address?.city ?? data.address?.town ?? data.address?.village ?? '';
          if (city) setCityFilter(city);
        } catch {}
      }, () => {});
    }
  }, []);

  return (
    <div className="min-h-screen bg-brand-light">
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate('/client-dashboard')} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-extrabold text-xl text-brand-dark">
            El <span className="text-brand-primary">Jale</span>
          </span>
          <span className="text-gray-400 hidden sm:block">/ Explorar Expertos</span>
          <span className="ml-auto text-sm text-gray-600">Hola, {user?.name}</span>
        </div>
      </nav>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Nuestros Especialistas</h1>
          <p className="text-sm text-gray-500 mt-1">Todos verificados por el equipo de El Jale.</p>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative mb-5">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-brand-primary focus:border-brand-primary shadow-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Categorías */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === '' ? 'bg-brand-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(String(cat.id))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === String(cat.id)
                    ? 'bg-brand-primary text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Separador */}
          <div className="hidden sm:block w-px h-6 bg-gray-200" />

          {/* Solo disponibles */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setOnlyAvailable(!onlyAvailable)}
              className={`w-8 h-4 rounded-full transition-colors relative ${onlyAvailable ? 'bg-brand-primary' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${onlyAvailable ? 'left-4' : 'left-0.5'}`} />
            </div>
            <span className="text-xs font-medium text-gray-600">Solo disponibles</span>
          </label>

          {/* Ciudad */}
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
            <input
              type="text"
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              placeholder="Ciudad"
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white w-28 focus:outline-none focus:ring-brand-primary"
            />
            {cityFilter && <button onClick={() => setCityFilter('')} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>}
          </div>

          {/* Rating mínimo */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Rating mín:</span>
            <select
              value={minRating}
              onChange={e => setMinRating(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-brand-primary"
            >
              <option value="">Cualquiera</option>
              <option value="3">3+ ⭐</option>
              <option value="4">4+ ⭐</option>
              <option value="4.5">4.5+ ⭐</option>
            </select>
          </div>

          {/* Resultado */}
          {!loading && (
            <span className="ml-auto text-xs text-gray-400">{experts.length} experto{experts.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : experts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-gray-500 text-sm">No se encontraron expertos con estos filtros.</p>
            <button onClick={() => { setSearchQuery(''); setOnlyAvailable(false); setMinRating(''); setSelectedCategory(''); setCityFilter(''); }}
              className="mt-3 text-brand-primary text-sm hover:underline font-medium">
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...experts].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)).map(expert => (
              <div key={expert.id} className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col group relative ${expert.is_featured ? 'ring-2 ring-amber-400' : ''}`}>
                {expert.is_featured && (
                  <div className="absolute top-2 right-2 z-10">
                    <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">⭐ DESTACADO</span>
                  </div>
                )}
                {/* Header */}
                <div className={`h-12 relative ${expert.is_featured ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-brand-dark'}`} />
                <div className="px-5 pb-4 flex-grow">
                  <div className="-mt-6 mb-3 flex items-end justify-between">
                    <div className="flex items-end gap-3">
                      <div className="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center text-white text-xl font-extrabold border-2 border-white shadow">
                        {expert.name[0].toUpperCase()}
                      </div>
                      {expert.is_founding_member && (
                        <span className="mb-1 px-2 py-0.5 bg-brand-accent text-brand-dark text-xs font-bold rounded-full">⭐ Fundador</span>
                      )}
                    </div>
                    <span className={`mb-0.5 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${expert.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${expert.is_available ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}/>
                      {expert.is_available ? 'Disponible' : 'Ocupado'}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900">{expert.name}</h3>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <p className="text-xs text-brand-primary font-medium">{expert.category?.name}</p>
                    {expert.city && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                        {expert.city}
                      </span>
                    )}
                  </div>

                  {/* Premium badge */}
                  {expert.is_premium && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-amber-400 text-white rounded-full font-bold">
                      ⭐ Premium
                    </span>
                  )}

                  {/* Badges */}
                  {(expert.badge_top_rated || expert.badge_fast_responder || expert.badge_most_requested) && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {expert.badge_top_rated      && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded-full font-bold">🏆 Top</span>}
                      {expert.badge_fast_responder && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold">⚡ Rápido</span>}
                      {expert.badge_most_requested && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-800 rounded-full font-bold">🔥 Popular</span>}
                    </div>
                  )}

                  {expert.bio && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{expert.bio}</p>
                  )}

                  <div className="mt-3 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <StarRating value={Math.round(expert.average_rating ?? 0)} readonly size="sm" />
                      <span className="text-xs text-gray-500">
                        {expert.average_rating > 0
                          ? `${Number(expert.average_rating).toFixed(1)} (${expert.total_reviews})`
                          : 'Sin reseñas'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        <strong className="text-gray-700">{expert.experience_years}</strong> años de exp.
                      </p>
                      {expert.hourly_rate && (
                        <span className="text-xs font-bold text-brand-primary bg-orange-50 px-2 py-0.5 rounded-full">
                          desde ${Number(expert.hourly_rate).toLocaleString('es-MX')}/hr
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex gap-2">
                  <Link to={`/expertos/${expert.id}`} className="flex-1 text-center text-xs font-medium text-brand-primary hover:underline py-1">
                    Ver perfil →
                  </Link>
                  <Link
                    to={`/client-dashboard?hire=${expert.id}&name=${encodeURIComponent(expert.name)}`}
                    className="flex-1 text-center text-xs font-semibold text-white bg-brand-primary hover:bg-orange-600 py-1.5 rounded-lg transition-colors"
                  >
                    Contratar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
