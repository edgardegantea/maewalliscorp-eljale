// src/components/TwoFactorModal.jsx — Verificación de dos factores
import { useState, useRef, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function TwoFactorModal({ email, onVerified, onClose }) {
  const [code, setCode]       = useState(['', '', '', '', '', '']);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputs = useRef([]);

  useEffect(() => {
    const t = setInterval(() => setResendTimer(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[i] = val;
    setCode(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      inputs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const full = code.join('');
    if (full.length !== 6) { toast.error('Ingresa los 6 dígitos.'); return; }
    setVerifying(true);
    try {
      await api.post('/2fa/verify', { code: full });
      toast.success('✅ Verificación exitosa');
      onVerified?.();
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Código incorrecto');
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally { setVerifying(false); }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setSending(true);
    try {
      await api.post('/2fa/send');
      toast.success('Nuevo código enviado.');
      setResendTimer(60);
    } catch { toast.error('Error al reenviar.'); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-gray-900 to-slate-800 px-6 py-5 text-center">
          <div className="text-3xl mb-2">🔐</div>
          <h3 className="font-black text-white text-lg">Verificación en dos pasos</h3>
          <p className="text-gray-400 text-xs mt-1">
            Enviamos un código a <strong className="text-gray-300">{email}</strong>
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Inputs del código */}
          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {code.map((d, i) => (
              <input key={i}
                ref={el => inputs.current[i] = el}
                type="text" inputMode="numeric" maxLength={1}
                value={d}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKey(i, e)}
                className={`w-11 h-14 text-center text-2xl font-black border-2 rounded-xl focus:outline-none transition-all ${
                  d ? 'border-orange-400 bg-orange-50 text-gray-900' : 'border-gray-200 text-gray-900'
                } focus:border-orange-500`}
              />
            ))}
          </div>

          <button onClick={handleVerify} disabled={verifying || code.join('').length !== 6}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50">
            {verifying ? 'Verificando...' : '✅ Verificar código'}
          </button>

          <div className="text-center">
            <button onClick={handleResend} disabled={resendTimer > 0 || sending}
              className="text-sm text-gray-500 hover:text-orange-500 transition-colors disabled:opacity-50">
              {resendTimer > 0 ? `Reenviar en ${resendTimer}s` : sending ? 'Enviando...' : '↺ Reenviar código'}
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            El código expira en 10 minutos. Revisa tu carpeta de spam.
          </p>
        </div>
      </div>
    </div>
  );
}
