// src/components/CameraCapture.jsx
// Captura de foto con cámara en vivo o selección de archivo
import { useState, useRef, useEffect, useCallback } from 'react';

export default function CameraCapture({ label, icon, onCapture, preview, onClear }) {
  const [mode, setMode]         = useState('idle');    // idle | camera | preview
  const [cameraError, setCameraError] = useState(false);
  const [facingMode, setFacingMode]   = useState('environment'); // environment | user
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  // Limpiar stream al desmontar
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async (facing = facingMode) => {
    stopCamera();
    setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setMode('camera');
    } catch (e) {
      console.warn('[Camera]', e.message);
      setCameraError(true);
      setMode('idle');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const capture = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const url  = URL.createObjectURL(blob);
      stopCamera();
      setMode('idle');
      onCapture(file, url);
    }, 'image/jpeg', 0.92);
  };

  const flipCamera = async () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    await startCamera(next);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onCapture(file, url);
    e.target.value = '';
  };

  const handleClear = () => {
    onClear();
    setMode('idle');
  };

  // ── Vista previa (ya tiene foto) ──
  if (preview) {
    return (
      <div className="flex items-center gap-3">
        <div className="relative w-20 h-16 flex-shrink-0">
          <img src={preview} className="w-full h-full object-cover rounded-xl border-2 border-green-300" alt="foto" />
          <button
            type="button"
            onClick={handleClear}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center shadow transition"
          >×</button>
          <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{icon} {label}</p>
          <p className="text-xs text-green-600 font-medium">✓ Foto capturada</p>
        </div>
      </div>
    );
  }

  // ── Cámara en vivo ──
  if (mode === 'camera') {
    return (
      <div className="rounded-2xl overflow-hidden border-2 border-orange-300 bg-black">
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-h-56 object-cover"
          />
          {/* Guía de encuadre */}
          <div className="absolute inset-4 border-2 border-white/40 rounded-xl pointer-events-none">
            <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-white rounded-tl" />
            <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-white rounded-tr" />
            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-white rounded-bl" />
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-white rounded-br" />
          </div>
          {/* Label */}
          <div className="absolute top-3 left-0 right-0 text-center">
            <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full">{icon} {label}</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-950">
          {/* Cancelar */}
          <button
            type="button"
            onClick={() => { stopCamera(); setMode('idle'); }}
            className="text-gray-400 hover:text-white text-sm transition"
          >
            Cancelar
          </button>

          {/* Capturar */}
          <button
            type="button"
            onClick={capture}
            className="w-14 h-14 rounded-full bg-white border-4 border-gray-300 hover:scale-95 active:scale-90 transition-transform flex items-center justify-center shadow-lg"
          >
            <div className="w-10 h-10 rounded-full bg-orange-500" />
          </button>

          {/* Flip cámara */}
          <button
            type="button"
            onClick={flipCamera}
            className="text-gray-400 hover:text-white transition"
            title="Cambiar cámara"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
        </div>

        {/* Canvas oculto para captura */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // ── Idle — botones de acción ──
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-2">
        {/* Botón cámara */}
        <button
          type="button"
          onClick={() => startCamera()}
          className="w-16 h-14 flex flex-col items-center justify-center border-2 border-dashed border-orange-300 bg-orange-50 hover:bg-orange-100 rounded-xl cursor-pointer transition-all group"
          title="Usar cámara"
        >
          <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <span className="text-[9px] text-orange-600 font-medium mt-0.5">Cámara</span>
        </button>

        {/* Botón galería */}
        <label className="w-16 h-14 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-all">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span className="text-[9px] text-gray-500 font-medium mt-0.5">Galería</span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-800">{icon} {label}</p>
        {cameraError ? (
          <p className="text-xs text-red-500">Cámara no disponible — usa galería</p>
        ) : (
          <p className="text-xs text-gray-400">JPG, PNG — máx. 8 MB</p>
        )}
      </div>
    </div>
  );
}
