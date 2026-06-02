// src/components/IdentityVerification.jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  sin_documentos:      { label: 'Sin documentos',      color: 'text-gray-500',   bg: 'bg-gray-100',   icon: '📋' },
  documentos_enviados: { label: 'En revisión',          color: 'text-yellow-700', bg: 'bg-yellow-100', icon: '⏳' },
  verificado:          { label: 'Identidad verificada', color: 'text-green-700',  bg: 'bg-green-100',  icon: '✅' },
  rechazado:           { label: 'Documentos rechazados', color: 'text-red-700',   bg: 'bg-red-100',    icon: '❌' },
};

export default function IdentityVerification() {
  const [status, setStatus]       = useState(null);
  const [files, setFiles]         = useState({ id_front: null, id_back: null, selfie: null });
  const [previews, setPreviews]   = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get('/kyc/status').then(r => setStatus(r.data)).catch(() => {});
  }, []);

  const handleFile = (key, file) => {
    if (!file) return;
    setFiles(prev => ({ ...prev, [key]: file }));
    setPreviews(prev => ({ ...prev, [key]: URL.createObjectURL(file) }));
  };

  const handleSubmit = async () => {
    if (!files.id_front || !files.id_back || !files.selfie) {
      toast.error('Debes subir los 3 documentos.');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('id_front', files.id_front);
    formData.append('id_back',  files.id_back);
    formData.append('selfie',   files.selfie);

    try {
      const res = await api.post('/kyc/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(res.data.message);
      setStatus({ verification_status: 'documentos_enviados', has_documents: true });
      setFiles({ id_front: null, id_back: null, selfie: null });
      setPreviews({});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al subir documentos.');
    } finally {
      setUploading(false);
    }
  };

  const sc = STATUS_CONFIG[status?.verification_status] ?? STATUS_CONFIG.sin_documentos;
  const canUpload = !status || ['sin_documentos', 'rechazado'].includes(status?.verification_status);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="bg-brand-dark px-6 py-4">
        <h2 className="text-lg font-bold text-white">Verificación de Identidad</h2>
        <p className="text-brand-accent text-sm mt-0.5">Requerida para poder aceptar trabajos.</p>
      </div>

      <div className="p-6 space-y-5">
        {/* Estado actual */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${sc.bg}`}>
          <span className="text-xl">{sc.icon}</span>
          <div>
            <p className={`text-sm font-bold ${sc.color}`}>{sc.label}</p>
            {status?.rejection_reason && (
              <p className="text-xs text-red-600 mt-0.5">Motivo: {status.rejection_reason}</p>
            )}
            {status?.verification_status === 'documentos_enviados' && (
              <p className="text-xs text-yellow-600 mt-0.5">El equipo revisará tus documentos en las próximas 24 horas.</p>
            )}
          </div>
        </div>

        {status?.verification_status === 'verificado' ? (
          <div className="text-center py-4">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-sm text-gray-600">Tu identidad está verificada. ¡Ya puedes aceptar trabajos!</p>
          </div>
        ) : canUpload ? (
          <>
            {/* Instrucciones */}
            <div className="bg-blue-50 rounded-xl p-4 text-xs text-blue-800 space-y-1">
              <p className="font-semibold">¿Qué necesitas subir?</p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                <li>Foto del frente de tu INE o pasaporte</li>
                <li>Foto del reverso del INE (no aplica para pasaporte)</li>
                <li>Selfie sosteniendo tu identificación</li>
              </ul>
              <p className="text-blue-600 mt-1">Los documentos solo los ve el equipo de El Jale para verificación.</p>
            </div>

            {/* Uploads */}
            {[
              { key: 'id_front', label: 'INE / Pasaporte — Frente', icon: '🪪' },
              { key: 'id_back',  label: 'INE — Reverso',             icon: '🔄' },
              { key: 'selfie',   label: 'Selfie con tu identificación', icon: '🤳' },
            ].map(({ key, label, icon }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{icon} {label}</label>
                <div className="flex items-center gap-3">
                  {previews[key] ? (
                    <div className="relative w-20 h-14 flex-shrink-0">
                      <img src={previews[key]} alt="" className="w-full h-full object-cover rounded-lg border" />
                      <button type="button"
                        onClick={() => { setFiles(prev => ({ ...prev, [key]: null })); setPreviews(prev => ({ ...prev, [key]: null })); }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center shadow">×</button>
                    </div>
                  ) : (
                    <label className="w-20 h-14 flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-primary hover:bg-orange-50 transition-all">
                      <span className="text-gray-400 text-xs">+ foto</span>
                      <input type="file" accept="image/*" capture="environment" className="sr-only"
                        onChange={e => handleFile(key, e.target.files[0])} />
                    </label>
                  )}
                  <p className="text-xs text-gray-400">JPG, PNG — máx. 8 MB</p>
                </div>
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={uploading || !files.id_front || !files.id_back || !files.selfie}
              className="w-full py-2.5 text-sm font-semibold text-white bg-brand-primary hover:bg-orange-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading
                ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Enviando...</>
                : '📤 Enviar para verificación'}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
