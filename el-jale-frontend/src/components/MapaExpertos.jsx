// src/components/MapaExpertos.jsx
// Mapa interactivo de expertos con Leaflet + React-Leaflet
import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axios';
import { Link } from 'react-router-dom';

// Fix íconos de Leaflet con Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Íconos custom ─────────────────────────────────────────────────
const makeIcon = (color, size = 36) => L.divIcon({
  html: `<div style="
    width:${size}px; height:${size}px;
    background:${color};
    border:3px solid white;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    box-shadow:0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  className: '',
  iconSize:   [size, size],
  iconAnchor: [size / 2, size],
  popupAnchor:[0, -size],
});

const ICONS = {
  available: makeIcon('#10b981', 38),  // verde
  busy:      makeIcon('#f59e0b', 34),  // amarillo
  premium:   makeIcon('#f97316', 42),  // naranja grande
  user:      makeIcon('#3b82f6', 32),  // azul — posición del usuario
};

// ── Recenter helper ───────────────────────────────────────────────
function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom ?? map.getZoom(), { animate: true });
  }, [center]);
  return null;
}

// ── Stars ─────────────────────────────────────────────────────────
const Stars = ({ rating }) => (
  <span className="text-amber-400 text-xs">
    {'★'.repeat(Math.round(rating ?? 0))}{'☆'.repeat(5 - Math.round(rating ?? 0))}
    <span className="text-gray-500 ml-1">{Number(rating ?? 0).toFixed(1)}</span>
  </span>
);

// ══════════════════════════════════════════════════════════════════
export default function MapaExpertos({ onClose, onHire }) {
  const [experts, setExperts]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [userPos, setUserPos]         = useState(null);
  const [center, setCenter]           = useState([-19.4326, -99.1332]); // CDMX default
  const [zoom, setZoom]               = useState(12);
  const [categories, setCategories]   = useState([]);
  const [filterCat, setFilterCat]     = useState('');
  const [filterAvail, setFilterAvail] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [radius, setRadius]           = useState(10); // km
  const [showRadius, setShowRadius]   = useState(false);

  // Cargar categorías
  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  // Detectar posición del usuario
  useEffect(() => {
    if (!navigator.geolocation) { fetchExperts(); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserPos([lat, lng]);
        setCenter([lat, lng]);
        setZoom(13);
        fetchExperts(lat, lng);
      },
      () => fetchExperts(),
      { timeout: 8000 }
    );
  }, []);

  const fetchExperts = useCallback(async (lat, lng) => {
    setLoading(true);
    try {
      const params = {};
      if (filterCat)   params.category_id = filterCat;
      if (filterAvail) params.available    = 'true';
      if (lat && lng)  { params.lat = lat; params.lng = lng; params.radius = radius; }
      const r = await api.get('/experts-map', { params });
      setExperts(r.data);
    } catch {}
    finally { setLoading(false); }
  }, [filterCat, filterAvail, radius]);

  useEffect(() => {
    fetchExperts(userPos?.[0], userPos?.[1]);
  }, [filterCat, filterAvail, radius]);

  const expertIcon = (e) => {
    if (e.is_premium)  return ICONS.premium;
    if (e.is_available) return ICONS.available;
    return ICONS.busy;
  };

  const availableCount = experts.filter(e => e.is_available).length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">

      {/* Header */}
      <div className="bg-gray-950 text-white px-4 py-3 flex items-center gap-3 shrink-0 z-10">
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-sm">Mapa de expertos</h2>
          <p className="text-gray-400 text-xs">
            {loading ? 'Buscando...' : `${experts.length} expertos · ${availableCount} disponibles`}
          </p>
        </div>
        {/* Filtros */}
        <div className="flex items-center gap-2">
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="text-xs bg-white/10 border border-white/20 text-white rounded-lg px-2 py-1.5 focus:outline-none">
            <option value="">Todos los oficios</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button
            onClick={() => setFilterAvail(v => !v)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${filterAvail ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
          >
            {filterAvail ? '✓ ' : ''}Disponibles
          </button>
          <button
            onClick={() => setShowRadius(v => !v)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${showRadius ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
          >
            Radio
          </button>
        </div>
      </div>

      {/* Control de radio */}
      {showRadius && (
        <div className="bg-gray-900 px-4 py-2 flex items-center gap-3 text-white shrink-0">
          <span className="text-xs text-gray-400">Radio de búsqueda:</span>
          <input type="range" min="1" max="50" value={radius}
            onChange={e => setRadius(Number(e.target.value))}
            className="flex-1 accent-orange-500" />
          <span className="text-xs font-bold text-orange-400 w-12">{radius} km</span>
        </div>
      )}

      {/* Mapa */}
      <div className="flex-1 flex">
        <MapContainer
          center={center}
          zoom={zoom}
          className="flex-1 h-full"
          style={{ height: '100%' }}
        >
          <RecenterMap center={center} zoom={zoom} />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />

          {/* Posición del usuario */}
          {userPos && (
            <>
              <Marker position={userPos} icon={ICONS.user}>
                <Popup><p className="text-sm font-semibold">📍 Tu ubicación</p></Popup>
              </Marker>
              {showRadius && (
                <Circle
                  center={userPos}
                  radius={radius * 1000}
                  pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.05, weight: 1.5, dashArray: '6,4' }}
                />
              )}
            </>
          )}

          {/* Expertos */}
          {experts.map(expert => (
            <Marker
              key={expert.user_id}
              position={[expert.latitude, expert.longitude]}
              icon={expertIcon(expert)}
              eventHandlers={{ click: () => setSelectedExpert(expert) }}
            >
              <Popup maxWidth={260} className="expert-popup">
                <div className="p-1 min-w-[220px]">
                  {/* Encabezado */}
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {expert.name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{expert.name}</p>
                      <p className="text-xs text-gray-500">{expert.category}</p>
                    </div>
                    {expert.is_premium && <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-bold">PRO</span>}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-2">
                    <Stars rating={expert.average_rating} />
                    <span className="text-xs text-gray-400">({expert.total_reviews} reseñas)</span>
                  </div>

                  {/* Info */}
                  <div className="flex items-center gap-3 text-xs mb-3">
                    <span className={`flex items-center gap-1 font-semibold ${expert.is_available ? 'text-emerald-600' : 'text-amber-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${expert.is_available ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {expert.is_available ? 'Disponible' : 'Ocupado'}
                    </span>
                    {expert.hourly_rate && <span className="text-gray-600">💰 ${expert.hourly_rate}/hr</span>}
                    {expert.city && <span className="text-gray-400">📍 {expert.city}</span>}
                  </div>

                  {expert.bio && (
                    <p className="text-xs text-gray-500 italic mb-3 line-clamp-2">"{expert.bio}"</p>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <Link to={`/expertos/${expert.user_id}`}
                      className="flex-1 text-center text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 py-1.5 rounded-lg transition-colors font-medium">
                      Ver perfil
                    </Link>
                    {expert.is_available && (
                      <button
                        onClick={() => onHire?.(expert)}
                        className="flex-1 text-xs text-white bg-orange-500 hover:bg-orange-600 py-1.5 rounded-lg transition-colors font-bold">
                        Contratar
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Panel lateral — experto seleccionado */}
        {selectedExpert && (
          <div className="w-72 bg-white border-l border-gray-100 flex flex-col shadow-xl overflow-y-auto shrink-0">
            <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
              <p className="font-bold text-gray-900 text-sm">Detalle del experto</p>
              <button onClick={() => setSelectedExpert(null)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>

            <div className="p-4 space-y-4 flex-1">
              {/* Avatar + nombre */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center text-white text-xl font-black shrink-0">
                  {selectedExpert.name?.[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{selectedExpert.name}</p>
                  <p className="text-sm text-gray-500">{selectedExpert.category}</p>
                  {selectedExpert.is_premium && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">⭐ Premium</span>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <Stars rating={selectedExpert.average_rating} />
                  <p className="text-xs text-gray-400 mt-0.5">{selectedExpert.total_reviews} reseñas</p>
                </div>
                <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${selectedExpert.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedExpert.is_available ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {selectedExpert.is_available ? 'Disponible' : 'Ocupado'}
                </span>
              </div>

              {/* Info */}
              <div className="space-y-2 text-sm">
                {selectedExpert.hourly_rate && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>💰</span>
                    <span>Desde <strong className="text-gray-900">${selectedExpert.hourly_rate}/hr</strong></span>
                  </div>
                )}
                {selectedExpert.city && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>📍</span>
                    <span>{selectedExpert.city}</span>
                  </div>
                )}
                {selectedExpert.coverage_radius_km && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>🗺️</span>
                    <span>Cubre hasta {selectedExpert.coverage_radius_km} km</span>
                  </div>
                )}
                {selectedExpert.badge_top_rated && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <span>🏆</span>
                    <span className="font-semibold text-xs">Top Rated</span>
                  </div>
                )}
              </div>

              {selectedExpert.bio && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-600 leading-relaxed italic">"{selectedExpert.bio}"</p>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="p-4 border-t border-gray-100 space-y-2">
              {selectedExpert.is_available && (
                <button onClick={() => onHire?.(selectedExpert)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                  ⚡ Contratar ahora
                </button>
              )}
              <Link to={`/expertos/${selectedExpert.user_id}`}
                className="block w-full text-center text-gray-700 border border-gray-200 hover:bg-gray-50 font-semibold py-2.5 rounded-xl transition-colors text-sm">
                Ver perfil completo
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="bg-white border-t border-gray-100 px-4 py-2 flex items-center gap-5 text-xs text-gray-500 shrink-0">
        {[
          { color: '#f97316', label: 'Premium' },
          { color: '#10b981', label: 'Disponible' },
          { color: '#f59e0b', label: 'Ocupado' },
          { color: '#3b82f6', label: 'Tu ubicación' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
            <span>{l.label}</span>
          </div>
        ))}
        <span className="ml-auto text-gray-400">© OpenStreetMap / CARTO</span>
      </div>
    </div>
  );
}
