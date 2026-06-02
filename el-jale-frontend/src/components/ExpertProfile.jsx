// src/components/ExpertProfile.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import StarRating from './StarRating';

export default function ExpertProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/experts/${id}`)
      .then(res => setExpert(res.data))
      .catch(() => setError('No se pudo cargar el perfil.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <p className="text-brand-dark font-bold text-lg">Cargando perfil...</p>
      </div>
    );
  }

  if (error || !expert) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-light gap-4">
        <p className="text-red-600 font-medium">{error || 'Perfil no encontrado.'}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-brand-primary underline">Volver</button>
      </div>
    );
  }

  const profile = expert.profile;
  const avgRating = profile?.average_rating ?? 0;
  const totalReviews = profile?.total_reviews ?? 0;

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Navbar mínimo */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-extrabold text-xl text-brand-dark">
            El <span className="text-brand-primary">Jale</span>
          </span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Tarjeta de perfil */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-brand-dark h-24" />
          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="-mt-10 mb-4 flex items-end gap-4">
              <div className="w-20 h-20 rounded-full bg-brand-primary flex items-center justify-center text-white text-3xl font-extrabold border-4 border-white shadow">
                {expert.name[0].toUpperCase()}
              </div>
              {profile?.is_founding_member && (
                <span className="mb-2 px-3 py-1 bg-brand-accent text-brand-dark text-xs font-bold rounded-full">
                  Socio Fundador
                </span>
              )}
              {profile?.is_verified && (
                <span className="mb-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verificado
                </span>
              )}
            </div>

            <h1 className="text-2xl font-extrabold text-gray-900">{expert.name}</h1>
            <p className="text-brand-primary font-medium text-sm mt-0.5">{profile?.category?.name}</p>

            {profile?.bio && (
              <p className="mt-3 text-gray-600 text-sm leading-relaxed">{profile.bio}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <StarRating value={Math.round(avgRating)} readonly size="sm" />
                <span className="font-bold text-gray-900">{avgRating > 0 ? avgRating.toFixed(1) : 'Sin calificaciones'}</span>
                {totalReviews > 0 && <span className="text-gray-500">({totalReviews} reseñas)</span>}
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span><strong className="text-gray-900">{expert.completed_jobs}</strong> trabajos completados</span>
              </div>
              {profile?.experience_years > 0 && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span><strong className="text-gray-900">{profile.experience_years}</strong> años de experiencia</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reseñas */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Reseñas de clientes</h2>
          </div>

          {expert.reviews.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-gray-500">Este experto aún no tiene reseñas.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {expert.reviews.map(review => (
                <div key={review.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                        {review.client?.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{review.client?.name}</span>
                    </div>
                    <StarRating value={review.rating} readonly size="sm" />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 mt-1 ml-9 italic">"{review.comment}"</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1 ml-9">
                    {new Date(review.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
