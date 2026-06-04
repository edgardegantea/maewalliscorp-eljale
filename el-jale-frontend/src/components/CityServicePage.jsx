// src/components/CityServicePage.jsx — Página SEO por ciudad y categoría
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import StarRating from './StarRating';
import { SkeletonCard } from './Skeleton';

const CITY_NAMES = {
  cdmx: 'Ciudad de México', 'ciudad-de-mexico': 'Ciudad de México',
  guadalajara: 'Guadalajara', monterrey: 'Monterrey',
  puebla: 'Puebla', tijuana: 'Tijuana', leon: 'León',
  queretaro: 'Querétaro', merida: 'Mérida', cancun: 'Cancún',
};

const SCHEMA_ICONS = { plomeros: '🔧', electricistas: '⚡', pintores: '🎨', carpinteros: '🪵', albanileria: '🏗️', limpieza: '🧹' };

export default function CityServicePage() {
  const { categoria, ciudad } = useParams();
  const [experts, setExperts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  const cityLabel = CITY_NAMES[ciudad] ?? ciudad?.replace(/-/g, ' ');
  const icon      = SCHEMA_ICONS[categoria] ?? '🔧';

  useEffect(() => {
    // Cargar categoría
    api.get('/categories').then(r => {
      const cat = r.data.find(c =>
        c.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-') === categoria
      );
      setCategory(cat);
      if (cat) {
        api.get(`/experts?category_id=${cat.id}&city=${cityLabel}&available=true`)
          .then(r => setExperts(r.data))
          .catch(() => {})
          .finally(() => setLoading(false));
      } else { setLoading(false); }
    });

    // Actualizar meta tags dinámicamente
    document.title = `${icon} ${categoria?.replace(/-/g, ' ')} en ${cityLabel} — El Jale`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = `Encuentra ${categoria?.replace(/-/g, ' ')} verificados en ${cityLabel}. Pago seguro, sin regateos. Cotizaciones gratis en El Jale.`;

    return () => { document.title = 'El Jale — Especialistas Verificados'; };
  }, [categoria, ciudad]);

  // Schema.org JSON-LD
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${categoria?.replace(/-/g, ' ')} en ${cityLabel}`,
    description: `Servicio de ${categoria?.replace(/-/g, ' ')} con expertos verificados en ${cityLabel}, México.`,
    areaServed: { '@type': 'City', name: cityLabel },
    provider: { '@type': 'Organization', name: 'El Jale', url: 'https://eljale.maewalliscorp.org' },
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* JSON-LD para SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="font-black text-xl text-gray-900">El <span className="text-orange-500">Jale</span></Link>
          <span className="text-gray-300">›</span>
          <span className="text-sm text-gray-500 capitalize">{categoria?.replace(/-/g, ' ')}</span>
          <span className="text-gray-300">›</span>
          <span className="text-sm text-gray-700 font-semibold">{cityLabel}</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero SEO */}
        <div className="bg-gradient-to-r from-gray-900 to-slate-800 rounded-2xl p-8 text-white mb-8">
          <div className="text-5xl mb-3">{icon}</div>
          <h1 className="text-3xl font-black mb-2 capitalize">
            {categoria?.replace(/-/g, ' ')} en {cityLabel}
          </h1>
          <p className="text-gray-300 text-lg mb-6">
            Expertos verificados disponibles ahora · Pago protegido · Sin regateos
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/register"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-all">
              Publicar trabajo gratis →
            </Link>
            <Link to="/explorar"
              className="border border-white/20 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-xl transition-all">
              Ver todos los expertos
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { v: experts.length, l: 'Expertos disponibles', icon: '👷' },
            { v: '4.9⭐',        l: 'Calificación promedio', icon: '⭐' },
            { v: '2h',           l: 'Tiempo de respuesta',  icon: '⚡' },
          ].map(s => (
            <div key={s.l} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className="text-xl font-black text-gray-900">{s.v}</p>
              <p className="text-xs text-gray-500">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Expertos */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {loading ? 'Buscando expertos...' : `${experts.length} expertos en ${cityLabel}`}
        </h2>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : experts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">🔍</div>
            <p className="font-semibold text-gray-700">Aún no hay expertos en {cityLabel}</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Publica tu trabajo y te notificamos cuando llegue uno.</p>
            <Link to="/register" className="bg-orange-500 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-orange-600 transition-colors">
              Publicar trabajo →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {experts.map(expert => (
              <Link key={expert.id} to={`/expertos/${expert.id}`}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all block">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white text-xl font-black shrink-0">
                    {expert.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-gray-900 truncate">{expert.name}</p>
                      {expert.is_featured && <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full shrink-0">⭐ Dest.</span>}
                    </div>
                    {expert.avg_rating > 0 && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <StarRating value={Math.round(expert.avg_rating)} readonly size="sm" />
                        <span className="text-xs text-gray-500">({expert.total_reviews})</span>
                      </div>
                    )}
                    {expert.bio && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{expert.bio}</p>}
                  </div>
                </div>
                {expert.hourly_rate && (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{expert.experience_years} años de exp.</span>
                    <span className="text-sm font-bold text-orange-500">desde ${Number(expert.hourly_rate).toLocaleString('es-MX')}/hr</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* CTA SEO */}
        <div className="mt-10 bg-orange-500 rounded-2xl p-6 text-white text-center">
          <h2 className="text-xl font-black mb-2">¿Necesitas {categoria?.replace(/-/g, ' ')} en {cityLabel}?</h2>
          <p className="text-orange-100 mb-4">Publica gratis y recibe cotizaciones en minutos de expertos verificados.</p>
          <Link to="/register" className="inline-block bg-white text-orange-600 font-black px-8 py-3 rounded-xl hover:bg-orange-50 transition-colors">
            Publicar trabajo gratis →
          </Link>
        </div>
      </main>
    </div>
  );
}
