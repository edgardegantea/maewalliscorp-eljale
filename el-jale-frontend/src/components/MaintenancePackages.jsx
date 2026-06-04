// src/components/MaintenancePackages.jsx — Paquetes de mantenimiento del hogar
const PACKAGES = [
  {
    id: 'basico',
    name: 'Revisión Básica',
    icon: '🔧',
    price: '699',
    duration: '2–3 hrs',
    color: 'border-blue-200 bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
    services: ['Revisión de tuberías y llaves', 'Revisión de instalación eléctrica', 'Diagnóstico de fugas'],
    category: 'plomería + electricidad',
    description: 'Plomero + Electricista · Diagnostica los puntos críticos de tu hogar.',
  },
  {
    id: 'hogar',
    name: 'Hogar Plus',
    icon: '🏠',
    price: '1,299',
    duration: '4–5 hrs',
    color: 'border-orange-200 bg-orange-50',
    badge: 'bg-orange-100 text-orange-700',
    popular: true,
    services: ['Todo el Básico', 'Revisión de aires acondicionados', 'Limpieza profunda de cocina', 'Sellado de filtraciones'],
    category: 'mantenimiento completo',
    description: '3 expertos · La solución más completa para mantener tu hogar en orden.',
  },
  {
    id: 'anual',
    name: 'Plan Anual',
    icon: '📅',
    price: '3,999',
    duration: 'Cada 3 meses',
    color: 'border-emerald-200 bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-700',
    services: ['4 visitas al año', 'Todos los servicios Hogar Plus', 'Experto dedicado', 'Prioridad en urgencias'],
    category: 'plan recurrente',
    description: 'Mismo equipo, 4 veces al año. La forma más inteligente de mantener tu hogar.',
  },
];

export default function MaintenancePackages({ onSelect }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📦</span>
        <div>
          <p className="text-sm font-bold text-gray-900">Paquetes de mantenimiento</p>
          <p className="text-xs text-gray-500">Todo en uno · Precio fijo · Sin sorpresas</p>
        </div>
      </div>

      <div className="space-y-3">
        {PACKAGES.map(pkg => (
          <div key={pkg.id} className={`relative rounded-2xl border-2 p-4 ${pkg.color} hover:shadow-sm transition-shadow`}>
            {pkg.popular && (
              <div className="absolute -top-2.5 left-4">
                <span className="bg-orange-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  ⭐ Más popular
                </span>
              </div>
            )}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{pkg.icon}</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">{pkg.name}</p>
                  <p className="text-[10px] text-gray-500">{pkg.duration}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-black text-gray-900">${pkg.price}</p>
                <p className="text-[10px] text-gray-400">MXN</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-2">{pkg.description}</p>
            <ul className="space-y-1 mb-3">
              {pkg.services.map(s => (
                <li key={s} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="text-emerald-500">✓</span> {s}
                </li>
              ))}
            </ul>
            <button
              onClick={() => onSelect?.(pkg)}
              className="w-full py-2 text-xs font-bold rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 transition-all hover:border-orange-300 hover:text-orange-600">
              Solicitar paquete →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
