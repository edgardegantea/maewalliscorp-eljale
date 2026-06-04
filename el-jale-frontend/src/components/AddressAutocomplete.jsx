// src/components/AddressAutocomplete.jsx — Google Places Autocomplete con fallback
import { useState, useRef, useEffect } from 'react';

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

export default function AddressAutocomplete({ value, onChange, onSelect, placeholder = 'Ej. Calle Juárez 45, Col. Centro', className = '' }) {
  const inputRef      = useRef(null);
  const autocompleteRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  // Cargar la API de Google si hay key
  useEffect(() => {
    if (!GOOGLE_KEY || window.google?.maps?.places) { setLoaded(true); return; }
    if (document.getElementById('gmap-script')) { setLoaded(true); return; }

    const script = document.createElement('script');
    script.id  = 'gmap-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places&language=es&region=MX`;
    script.async = true;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Inicializar Autocomplete
  useEffect(() => {
    if (!loaded || !GOOGLE_KEY || !inputRef.current || autocompleteRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'mx' },
      fields: ['formatted_address', 'geometry', 'name'],
      types: ['address'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      const addr  = place.formatted_address ?? place.name ?? '';
      const lat   = place.geometry?.location?.lat();
      const lng   = place.geometry?.location?.lng();
      onChange(addr);
      onSelect?.({ address: addr, lat, lng });
    });
  }, [loaded]);

  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`pl-9 ${className || 'input'}`}
        autoComplete="off"
      />
      {!GOOGLE_KEY && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-300" title="Autocomplete desactivado">📍</span>
      )}
    </div>
  );
}
