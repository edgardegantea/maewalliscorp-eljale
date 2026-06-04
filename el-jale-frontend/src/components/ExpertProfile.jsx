// src/components/ExpertProfile.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { storageUrl } from '../api/axios';
import StarRating from './StarRating';
import toast from 'react-hot-toast';
import InstantBookModal from './InstantBookModal';

export default function ExpertProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favorited, setFavorited] = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);
  const [showInstantBook, setShowInstantBook] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const isClient = currentUser?.role === 'client';

  useEffect(() => {
    api.get(`/experts/${id}`)
      .then(res => setExpert(res.data))
      .catch(() => setError('No se pudo cargar el perfil.'))
      .finally(() => setLoading(false));

    if (isClient) {
      api.get(`/favorites/${id}/check`)
        .then(r => setFavorited(r.data.favorited))
        .catch(() => {});
    }
  }, [id]);

  const handleToggleFav = async () => {
    if (!currentUser) { navigate('/login'); return; }
    setTogglingFav(true);
    try {
      const r = await api.post(`/favorites/${id}`);
      setFavorited(r.data.favorited);
      toast.success(r.data.message);
    } catch { toast.error('Error al actualizar favoritos'); }
    finally { setTogglingFav(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <svg className="animate-spin w-10 h-10 text-brand-primary" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
    </div>
  );

  if (error || !expert) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <p className="text-red-600 font-medium">{error || 'Perfil no encontrado.'}</p>
      <button onClick={() => navigate(-1)} className="text-sm text-brand-primary underline">Volver</button>
    </div>
  );

  const profile = expert.profile;
  const avgRating = profile?.average_rating ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">

      {showInstantBook && isClient && (
        <InstantBookModal
          expert={expert}
          onClose={() => setShowInstantBook(false)}
          onBooked={() => navigate('/client-dashboard')}
        />
      )}

      <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <Link to="/" className="font-black text-xl text-brand-dark">El <span className="text-brand-primary">Jale</span></Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Tarjeta de perfil */}
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-brand-dark to-slate-800 h-28 relative">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 20% 50%, #FF6B00 0%, transparent 50%), radial-gradient(circle at 80% 20%, #FFB800 0%, transparent 40%)'}} />
          </div>
          <div className="px-6 pb-6">
            <div className="-mt-12 mb-4 flex items-end justify-between">
              <div className="flex items-end gap-4">
                <div className="w-20 h-20 rounded-2xl bg-brand-primary flex items-center justify-center text-white text-3xl font-black border-4 border-white shadow-lg">
                  {expert.name[0].toUpperCase()}
                </div>
                <div className="mb-1 flex flex-wrap gap-2">
                  {profile?.is_featured && (
                    <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">⭐ Destacado</span>
                  )}
                  {profile?.is_founding_member && (
                    <span className="px-2.5 py-1 bg-brand-accent text-brand-dark text-xs font-bold rounded-full">⭐ Socio Fundador</span>
                  )}
                  {profile?.is_verified && (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                      Verificado
                    </span>
                  )}
                  {/* Premium */}
            {profile?.is_premium && (
              <span className="px-2.5 py-1 bg-gradient-to-r from-yellow-400 to-amber-400 text-white text-xs font-bold rounded-full">⭐ Premium</span>
            )}

            {/* Badges */}
            {profile?.badge_top_rated && (
              <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">🏆 Top Rated</span>
            )}
            {profile?.badge_fast_responder && (
              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">⚡ Respuesta rápida</span>
            )}
            {profile?.badge_most_requested && (
              <span className="px-2.5 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">🔥 Muy solicitado</span>
            )}

            {profile?.is_available !== undefined && (
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full flex items-center gap-1 ${profile.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${profile.is_available ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}/>
                      {profile.is_available ? 'Disponible ahora' : 'No disponible'}
                    </span>
                  )}
                </div>
              </div>

              {/* Acciones del cliente */}
              {isClient && (
                <div className="flex items-center gap-2">
                  {/* Reserva instantánea */}
                  {profile?.is_available && (
                    <button onClick={() => setShowInstantBook(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 transition-all shadow-sm shadow-orange-500/30 active:scale-95">
                      📅 Reservar ahora
                    </button>
                  )}
                  <button onClick={handleToggleFav} disabled={togglingFav}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${favorited ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                    <svg className="w-4 h-4" fill={favorited ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                    {favorited ? 'Guardado' : 'Guardar'}
                  </button>
                </div>
              )}
            </div>

            <h1 className="text-2xl font-black text-gray-900">{expert.name}</h1>
            <p className="text-brand-primary font-semibold text-sm mt-0.5">{profile?.category?.name}</p>

            {profile?.bio && (
              <p className="mt-3 text-gray-600 text-sm leading-relaxed max-w-2xl">{profile.bio}</p>
            )}

            <div className="mt-5 flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <StarRating value={Math.round(avgRating)} readonly size="sm" />
                <span className="font-bold text-gray-900">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
                {profile?.total_reviews > 0 && <span className="text-gray-400">({profile.total_reviews} reseñas)</span>}
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <span className="text-base">✅</span>
                <span><strong className="text-gray-900">{expert.completed_jobs}</strong> trabajos completados</span>
              </div>
              {profile?.experience_years > 0 && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <span className="text-base">⏱️</span>
                  <span><strong className="text-gray-900">{profile.experience_years}</strong> años de experiencia</span>
                </div>
              )}
              {profile?.hourly_rate && (
                <div className="flex items-center gap-1.5 text-brand-primary font-bold">
                  <span className="text-base">💰</span>
                  <span>desde ${Number(profile.hourly_rate).toLocaleString('es-MX')}/hora</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Disponibilidad y reserva rápida */}
        {isClient && profile?.is_available && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Disponibilidad</h2>
              <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Disponible ahora
              </span>
            </div>

            {profile?.available_days?.length > 0 ? (
              <div className="mb-4">
                <p className="text-xs text-gray-500 font-medium mb-2">Días disponibles</p>
                <div className="flex gap-1.5 flex-wrap">
                  {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => {
                    const active = profile.available_days?.includes(d);
                    return (
                      <span key={d} className={`px-3 py-1 rounded-full text-xs font-semibold ${active ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-gray-100 text-gray-400'}`}>
                        {d}
                      </span>
                    );
                  })}
                </div>
                {profile.available_from && (
                  <p className="text-xs text-gray-500 mt-2">
                    🕐 Horario: <strong>{profile.available_from} – {profile.available_to}</strong>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4">Consulta disponibilidad al reservar.</p>
            )}

            <button onClick={() => setShowInstantBook(true)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98] shadow-sm shadow-orange-500/20">
              📅 Reservar con {expert.name.split(' ')[0]} ahora
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">Pago protegido · Sin comisiones por adelantado</p>
          </div>
        )}

        {/* Video de presentación */}
        {profile?.video_url && (
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-4">📹 Video de presentación</h2>
            <div className="aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <iframe
                src={profile.video_url.replace('watch?v=', 'embed/')}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`Video de ${expert.name}`}
              />
            </div>
          </div>
        )}

        {/* Portfolio */}
        {expert.portfolio?.length > 0 && (
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-4">Portfolio de trabajos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {expert.portfolio.map((photo, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-xl">
                  <img
                    src={`${storageUrl}/${photo.photo_path}`}
                    alt={photo.caption || `Trabajo ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {photo.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-medium">{photo.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reseñas */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Reseñas de clientes</h2>
          </div>
          {expert.reviews.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-gray-400">Este experto aún no tiene reseñas.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {expert.reviews.map(review => (
                <div key={review.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        {review.client?.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{review.client?.name}</span>
                    </div>
                    <StarRating value={review.rating} readonly size="sm" />
                  </div>
                  {review.comment && <p className="text-sm text-gray-600 mt-1.5 ml-9 italic">"{review.comment}"</p>}
                  <p className="text-xs text-gray-400 mt-1 ml-9">
                    {new Date(review.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA si no está logueado */}
        {!currentUser && (
          <div className="card p-6 text-center bg-gradient-to-r from-brand-dark to-slate-800">
            <h3 className="font-bold text-white text-lg mb-2">¿Necesitas contratar a {expert.name}?</h3>
            <p className="text-gray-300 text-sm mb-4">Crea una cuenta gratis y publica tu Jale en segundos.</p>
            <Link to="/register" className="btn-primary px-8 py-3">Publicar un Jale gratis →</Link>
          </div>
        )}
      </main>
    </div>
  );
}
