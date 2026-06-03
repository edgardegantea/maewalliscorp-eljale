// src/components/PhoneVerification.jsx
import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function PhoneVerification({ user, onVerified }) {
  const [step, setStep]     = useState(user?.phone_verified ? 'done' : 'phone');
  const [phone, setPhone]   = useState(user?.phone || '');
  const [otp, setOtp]       = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!phone.trim()) return toast.error('Ingresa tu número de teléfono');
    setLoading(true);
    try {
      await api.post('/phone/send-otp', { phone });
      toast.success('Código enviado a tu teléfono');
      setStep('otp');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al enviar el código');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) return toast.error('El código tiene 6 dígitos');
    setLoading(true);
    try {
      await api.post('/phone/verify', { otp });
      toast.success('¡Teléfono verificado!');
      setStep('done');
      onVerified?.();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Código incorrecto');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <span className="text-xl">📱</span>
        <div>
          <p className="font-semibold text-sm">Teléfono verificado</p>
          <p className="text-xs text-green-600">{user?.phone || phone}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">📱</span>
        <div>
          <h3 className="font-bold text-gray-800">Verificar teléfono</h3>
          <p className="text-xs text-gray-500">Genera más confianza con tus clientes</p>
        </div>
      </div>

      {step === 'phone' && (
        <div className="space-y-3">
          <input
            type="tel"
            placeholder="+52 55 1234 5678"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            onClick={sendOtp}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 transition"
          >
            {loading ? 'Enviando...' : 'Enviar código SMS'}
          </button>
        </div>
      )}

      {step === 'otp' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Ingresa el código de 6 dígitos enviado a <strong>{phone}</strong>
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-center tracking-widest text-lg font-bold focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            onClick={verifyOtp}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 transition"
          >
            {loading ? 'Verificando...' : 'Confirmar código'}
          </button>
          <button
            onClick={() => setStep('phone')}
            className="w-full text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Cambiar número
          </button>
        </div>
      )}
    </div>
  );
}
