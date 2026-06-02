// src/components/LocationPicker.jsx
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function LocationPicker({ city, state, radius, onChange }) {
  const [detecting, setDetecting] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización.');
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          // Reverse geocoding con Nominatim (OpenStreetMap, sin API key)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&accept-language=es`
          );
          const data = await res.json();
          const addr = data.address ?? {};
          onChange({
            latitude:  coords.latitude,
            longitude: coords.longitude,
            city:      addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? '',
            state:     addr.state ?? '',
          });
          toast.success('Ubicación detectada.');
        } catch {
          // Si falla el geocoding, al menos guardamos coords
          onChange({ latitude: coords.latitude, longitude: coords.longitude, city: '', state: '' });
          toast('Ubicación detectada, pero no pudimos obtener la ciudad.', { icon: '📍' });
        } finally {
          setDetecting(false);
        }
      },
      () => {
        toast.error('No se pudo obtener tu ubicación. Escríbela manualmente.');
        setDetecting(false);
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-gray-500 uppercase">Zona de trabajo</label>
        <button
          type="button"
          onClick={detectLocation}
          disabled={detecting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-primary bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors disabled:opacity-60"
        >
          {detecting ? (
            <><svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Detectando...</>
          ) : (
            <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg> Detectar automático</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Ciudad</label>
          <input
            type="text"
            value={city ?? ''}
            onChange={e => onChange({ city: e.target.value })}
            placeholder="Ej. Monterrey"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Estado</label>
          <input
            type="text"
            value={state ?? ''}
            onChange={e => onChange({ state: e.target.value })}
            placeholder="Ej. Nuevo León"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Radio de cobertura — <strong>{radius ?? 15} km</strong>
        </label>
        <input
          type="range"
          min="5" max="100" step="5"
          value={radius ?? 15}
          onChange={e => onChange({ coverage_radius_km: parseInt(e.target.value) })}
          className="w-full accent-brand-primary"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>5 km</span><span>50 km</span><span>100 km</span>
        </div>
      </div>

      {city && (
        <p className="text-xs text-emerald-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
          Solo verás trabajos en {city}{state ? `, ${state}` : ''} en un radio de {radius ?? 15} km.
        </p>
      )}
    </div>
  );
}
