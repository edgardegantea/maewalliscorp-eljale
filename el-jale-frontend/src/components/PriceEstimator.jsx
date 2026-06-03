// src/components/PriceEstimator.jsx
// Widget que muestra el rango de precios histórico para una categoría
import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function PriceEstimator({ categoryId, city, isUrgent, onSuggest }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!categoryId) { setData(null); return; }
    setLoading(true);
    api.get('/price-estimate', { params: { category_id: categoryId, city: city || undefined } })
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [categoryId, city]);

  if (!categoryId) return null;
  if (loading) return (
    <div className="h-14 bg-blue-50 border border-blue-100 rounded-2xl animate-pulse" />
  );
  if (!data?.has_data) return null;

  const price = isUrgent ? data.urgent_price : data.suggested;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">💡</span>
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">
              Precios en tu zona
              {isUrgent && <span className="ml-1 text-orange-600">(modo urgente +50%)</span>}
            </p>
          </div>

          {/* Barra de rango */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-blue-600 font-medium w-12">${data.p25?.toLocaleString('es-MX')}</span>
            <div className="flex-1 h-2 bg-blue-200 rounded-full relative">
              <div className="absolute inset-y-0 bg-blue-500 rounded-full"
                style={{
                  left:  `${Math.max(0, ((data.p25 - data.min) / (data.max - data.min)) * 100)}%`,
                  right: `${Math.max(0, 100 - ((data.p75 - data.min) / (data.max - data.min)) * 100)}%`,
                }} />
              {/* Precio promedio */}
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-600 rounded-full shadow"
                style={{ left: `${((data.avg - data.min) / (data.max - data.min)) * 100}%`, transform: 'translate(-50%, -50%)' }} />
            </div>
            <span className="text-xs text-blue-600 font-medium w-12 text-right">${data.p75?.toLocaleString('es-MX')}</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-blue-600">
            <span>Mín: <strong>${data.min?.toLocaleString('es-MX')}</strong></span>
            <span>Típico: <strong className="text-blue-800">${data.p25?.toLocaleString('es-MX')} – ${data.p75?.toLocaleString('es-MX')}</strong></span>
            <span>Máx: <strong>${data.max?.toLocaleString('es-MX')}</strong></span>
          </div>

          <p className="text-[10px] text-blue-400 mt-1">
            Basado en {data.sample_count} jales completados
            {data.experts_available > 0 && ` · ${data.experts_available} expertos disponibles`}
          </p>
        </div>

        {/* Botón de precio sugerido */}
        {price && onSuggest && (
          <button
            type="button"
            onClick={() => onSuggest(price)}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors whitespace-nowrap"
          >
            Usar ${price?.toLocaleString('es-MX')}
          </button>
        )}
      </div>
    </div>
  );
}
