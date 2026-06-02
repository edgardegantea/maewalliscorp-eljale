// src/components/ExpertOnboarding.jsx
import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import LocationPicker from './LocationPicker';

const STEPS = [
  { id: 1, title: '¡Bienvenido a El Jale!',    icon: '👋' },
  { id: 2, title: 'Tu zona de cobertura',       icon: '📍' },
  { id: 3, title: 'Tarifa y presentación',      icon: '💰' },
  { id: 4, title: 'Verifica tu identidad',      icon: '🪪' },
  { id: 5, title: '¡Listo para trabajar!',      icon: '🚀' },
];

export default function ExpertOnboarding({ user, onComplete }) {
  const [step, setStep]         = useState(1);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);

  // Datos por paso
  const [location, setLocation] = useState({
    city: '', state: '', latitude: null, longitude: null, coverage_radius_km: 15,
  });
  const [bio, setBio]             = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [kycFiles, setKycFiles]   = useState({ id_front: null, id_back: null, selfie: null });
  const [kycPreviews, setKycPreviews] = useState({});

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  const saveStep2 = async () => {
    if (!location.city) { toast.error('Escribe tu ciudad de trabajo.'); return false; }
    setSaving(true);
    try {
      await api.put('/expert-profile', { ...location });
      return true;
    } catch { toast.error('Error al guardar ubicación.'); return false; }
    finally { setSaving(false); }
  };

  const saveStep3 = async () => {
    if (!bio.trim()) { toast.error('Agrega una bio breve.'); return false; }
    setSaving(true);
    try {
      await api.put('/expert-profile', { bio, hourly_rate: hourlyRate || null });
      return true;
    } catch { toast.error('Error al guardar perfil.'); return false; }
    finally { setSaving(false); }
  };

  const saveStep4 = async (skip = false) => {
    if (skip) return true;
    if (!kycFiles.id_front || !kycFiles.id_back || !kycFiles.selfie) {
      toast.error('Sube los 3 documentos para verificar tu identidad.');
      return false;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('id_front', kycFiles.id_front);
    formData.append('id_back',  kycFiles.id_back);
    formData.append('selfie',   kycFiles.selfie);
    try {
      await api.post('/kyc/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Documentos enviados. Los revisaremos en 24h.');
      return true;
    } catch (e) { toast.error(e.response?.data?.message || 'Error al subir documentos.'); return false; }
    finally { setUploading(false); }
  };

  const handleNext = async () => {
    let ok = true;
    if (step === 2) ok = await saveStep2();
    if (step === 3) ok = await saveStep3();
    if (step === 4) ok = await saveStep4(false);
    if (ok) setStep(s => s + 1);
  };

  const handleSkipKyc = async () => {
    setStep(s => s + 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await api.post('/expert-profile/onboarding-complete');
      onComplete();
    } catch { toast.error('Error al finalizar.'); }
    finally { setSaving(false); }
  };

  const handleKycFile = (key, file) => {
    if (!file) return;
    setKycFiles(p => ({ ...p, [key]: file }));
    setKycPreviews(p => ({ ...p, [key]: URL.createObjectURL(file) }));
  };

  const current = STEPS[step - 1];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100">
          <div className="h-full bg-brand-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Header */}
        <div className="px-8 pt-8 pb-2">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{current.icon}</span>
            <div>
              <p className="text-xs text-gray-400 font-medium">Paso {step} de {STEPS.length}</p>
              <h2 className="text-xl font-black text-gray-900">{current.title}</h2>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-6 space-y-4 min-h-[280px]">

          {/* Paso 1 — Bienvenida */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-gray-600">Hola <strong>{user?.name}</strong>, en 4 pasos rápidos tendrás tu perfil listo para recibir trabajos.</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '📍', text: 'Define tu zona de cobertura' },
                  { icon: '💰', text: 'Fija tu tarifa y bio' },
                  { icon: '🪪', text: 'Verifica tu identidad' },
                  { icon: '✅', text: '¡Empieza a ganar!' },
                ].map(item => (
                  <div key={item.text} className="flex items-start gap-2 bg-orange-50 rounded-xl p-3">
                    <span className="text-lg">{item.icon}</span>
                    <p className="text-xs text-gray-700 font-medium leading-tight">{item.text}</p>
                  </div>
                ))}
              </div>
              <div className="bg-brand-dark rounded-xl p-4 text-white text-sm">
                <p className="font-bold mb-1">¿Por qué completar el perfil?</p>
                <p className="text-gray-300 text-xs">Los expertos con perfil completo reciben <strong className="text-brand-accent">3x más trabajos</strong> que los perfiles vacíos.</p>
              </div>
            </div>
          )}

          {/* Paso 2 — Zona */}
          {step === 2 && (
            <div>
              <p className="text-sm text-gray-500 mb-4">Solo verás trabajos en tu zona. Puedes cambiarlo después.</p>
              <LocationPicker
                city={location.city}
                state={location.state}
                radius={location.coverage_radius_km}
                onChange={updates => setLocation(p => ({ ...p, ...updates }))}
              />
            </div>
          )}

          {/* Paso 3 — Tarifa y bio */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Tarifa por hora (opcional)</label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
                  <input type="number" min="0" step="0.01" value={hourlyRate}
                    onChange={e => setHourlyRate(e.target.value)} placeholder="Ej. 250.00"
                    className="w-full border border-gray-300 rounded-lg py-2 pl-7 pr-3 text-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Los clientes verán "desde $X/hora" en tu perfil.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                  Tu presentación <span className="text-red-400">*</span>
                </label>
                <textarea rows={4} value={bio} onChange={e => setBio(e.target.value)} maxLength={600}
                  placeholder="Ej: Plomero con 8 años de experiencia especializado en instalaciones residenciales y comerciales. Trabajo con materiales de primera calidad y garantizo mis trabajos..."
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary" />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Mín. 50 caracteres recomendados</span>
                  <span>{bio.length}/600</span>
                </div>
              </div>
            </div>
          )}

          {/* Paso 4 — KYC */}
          {step === 4 && (
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-800">
                <p className="font-semibold mb-1">¿Por qué necesitamos esto?</p>
                <p>La verificación de identidad genera confianza en los clientes y nos permite activar tu cuenta para trabajos con pago seguro.</p>
              </div>
              {[
                { key: 'id_front', label: 'INE / Pasaporte — Frente', icon: '🪪' },
                { key: 'id_back',  label: 'INE — Reverso', icon: '🔄' },
                { key: 'selfie',   label: 'Selfie con tu identificación', icon: '🤳' },
              ].map(({ key, label, icon }) => (
                <div key={key} className="flex items-center gap-3">
                  {kycPreviews[key] ? (
                    <div className="relative w-16 h-12 flex-shrink-0">
                      <img src={kycPreviews[key]} className="w-full h-full object-cover rounded-lg border" alt="" />
                      <button type="button" onClick={() => { setKycFiles(p => ({ ...p, [key]: null })); setKycPreviews(p => ({ ...p, [key]: null })); }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center">×</button>
                    </div>
                  ) : (
                    <label className="w-16 h-12 flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-primary hover:bg-orange-50 transition-all">
                      <span className="text-gray-400 text-[10px]">+ foto</span>
                      <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={e => handleKycFile(key, e.target.files[0])} />
                    </label>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-800">{icon} {label}</p>
                    <p className="text-xs text-gray-400">JPG, PNG — máx. 8 MB</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paso 5 — Listo */}
          {step === 5 && (
            <div className="text-center space-y-4 py-4">
              <div className="text-6xl">🎉</div>
              <h3 className="text-xl font-black text-gray-900">¡Perfil configurado!</h3>
              <p className="text-gray-500 text-sm">
                Tu perfil está listo. El equipo de El Jale revisará tu identidad en las próximas 24 horas.
                Mientras tanto, puedes explorar los trabajos disponibles en tu zona.
              </p>
              <div className="bg-emerald-50 rounded-xl p-4 text-left text-sm space-y-1">
                <p className="font-semibold text-emerald-800">✅ Zona configurada</p>
                <p className="font-semibold text-emerald-800">✅ Perfil y tarifa guardados</p>
                <p className="font-semibold text-yellow-700">⏳ Verificación de identidad en proceso</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex gap-3">
          {step > 1 && step < 5 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
              ← Atrás
            </button>
          )}

          {step === 4 && (
            <button onClick={handleSkipKyc}
              className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
              Hacerlo después
            </button>
          )}

          <div className="flex-1" />

          {step < 4 && (
            <button onClick={handleNext} disabled={saving}
              className="px-6 py-2.5 text-sm font-bold text-white bg-brand-primary hover:bg-orange-600 rounded-xl transition-colors disabled:opacity-70 flex items-center gap-2">
              {saving ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Guardando...</> : <>Continuar →</>}
            </button>
          )}

          {step === 4 && (
            <button onClick={handleNext} disabled={uploading}
              className="px-6 py-2.5 text-sm font-bold text-white bg-brand-primary hover:bg-orange-600 rounded-xl transition-colors disabled:opacity-70 flex items-center gap-2">
              {uploading ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Subiendo...</> : <>Enviar documentos →</>}
            </button>
          )}

          {step === 5 && (
            <button onClick={handleFinish} disabled={saving}
              className="flex-1 py-3 text-sm font-bold text-white bg-brand-primary hover:bg-orange-600 rounded-xl transition-colors disabled:opacity-70">
              {saving ? 'Guardando...' : '¡Empezar a trabajar! 🚀'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
