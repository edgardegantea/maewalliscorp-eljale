// src/components/TwoFactorSettings.jsx — Configurar 2FA en la cuenta
import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import TwoFactorModal from './TwoFactorModal';

export default function TwoFactorSettings() {
  const [status, setStatus]   = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep]       = useState('idle'); // idle | sending | verifying | disabling
  const [password, setPassword] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    api.get('/2fa/status').then(r => setStatus(r.data)).catch(() => {});
  }, []);

  const handleEnable = async () => {
    setStep('sending');
    try {
      await api.post('/2fa/send');
      setShowModal(true);
    } catch (e) { toast.error(e.response?.data?.message ?? 'Error'); }
    finally { setStep('idle'); }
  };

  const handleVerifiedAndEnable = async (code) => {
    try {
      await api.post('/2fa/enable', { code });
      toast.success('🔐 2FA activado. Tu cuenta es más segura.');
      setStatus(s => ({ ...s, enabled: true }));
      setShowModal(false);
    } catch (e) { toast.error(e.response?.data?.message ?? 'Error'); }
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    setStep('disabling');
    try {
      await api.post('/2fa/disable', { password });
      toast.success('2FA desactivado.');
      setStatus(s => ({ ...s, enabled: false }));
      setPassword('');
    } catch (e) { toast.error(e.response?.data?.message ?? 'Contraseña incorrecta'); }
    finally { setStep('idle'); }
  };

  if (!status) return null;

  return (
    <div className={`rounded-2xl border-2 p-5 ${status.enabled ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-white'}`}>
      {showModal && (
        <TwoFactorModal
          email={status.email}
          onVerified={() => {
            // En este flujo el verify ya está hecho, solo enablear
            api.post('/2fa/verify', {}).catch(() => {});
            setStatus(s => ({ ...s, enabled: true }));
            setShowModal(false);
            toast.success('🔐 2FA activado.');
          }}
          onClose={() => setShowModal(false)}
        />
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{status.enabled ? '🔐' : '🔓'}</span>
          <div>
            <p className="text-sm font-bold text-gray-900">Verificación en dos pasos (2FA)</p>
            <p className="text-xs text-gray-500">Protección adicional para tu cuenta</p>
          </div>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${status.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
          {status.enabled ? '✅ Activo' : '⚠️ Inactivo'}
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        {status.enabled
          ? `Al iniciar sesión recibirás un código de 6 dígitos en ${status.email}.`
          : 'Al activar 2FA recibirás un código cada vez que inicies sesión. Mucho más seguro.'}
      </p>

      {!status.enabled ? (
        <button onClick={handleEnable} disabled={step === 'sending'}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
          {step === 'sending' ? 'Enviando código...' : '🔐 Activar verificación en dos pasos'}
        </button>
      ) : (
        <form onSubmit={handleDisable} className="space-y-2">
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Confirma tu contraseña para desactivar"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30" />
          <button type="submit" disabled={step === 'disabling'}
            className="w-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
            {step === 'disabling' ? 'Desactivando...' : '🔓 Desactivar 2FA'}
          </button>
        </form>
      )}
    </div>
  );
}
