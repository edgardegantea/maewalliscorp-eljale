// src/components/ChatModal.jsx — Chat en tiempo real con Laravel Reverb
import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import echo from '../echo';

export default function ChatModal({ job, currentUserId, onClose }) {
  const [messages, setMessages]   = useState([]);
  const [body, setBody]           = useState('');
  const [sending, setSending]     = useState(false);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // ── Cargar historial + suscribir al canal ──────────────────────
  useEffect(() => {
    fetchMessages();
    inputRef.current?.focus();
    document.body.style.overflow = 'hidden';

    // Suscribirse al canal privado del chat
    const channel = echo.private(`chat.${job.id}`)
      .listen('.message.sent', (data) => {
        setMessages(prev => {
          // Evitar duplicados (el remitente ya agregó el mensaje optimistamente)
          if (prev.find(m => m.id === data.id)) return prev;
          return [...prev, data];
        });
      })
      .subscribed(() => setConnected(true))
      .error(() => setConnected(false));

    return () => {
      echo.leave(`chat.${job.id}`);
      document.body.style.overflow = '';
    };
  }, [job.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/jobs/${job.id}/messages`);
      setMessages(res.data);
    } catch { /* silencioso */ }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;

    // Optimistic UI — agregar mensaje localmente antes de la respuesta
    const optimistic = {
      id:             `tmp-${Date.now()}`,
      sender_id:      currentUserId,
      body:           body.trim(),
      created_at:     new Date().toISOString(),
      sender:         { id: currentUserId, name: 'Tú' },
    };
    setMessages(prev => [...prev, optimistic]);
    setBody('');
    inputRef.current?.focus();

    setSending(true);
    try {
      const res = await api.post(`/jobs/${job.id}/messages`, { body: optimistic.body });
      // Reemplazar mensaje optimista con el real del servidor
      setMessages(prev => prev.map(m => m.id === optimistic.id ? res.data : m));
    } catch {
      // Si falla, quitar el mensaje optimista
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  const otherName = job.client?.name || job.expert?.name || 'Contacto';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

      <div className="relative w-full sm:w-[560px] h-[90vh] sm:h-[600px] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 bg-brand-dark shrink-0">
          <div className="w-9 h-9 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
            {otherName[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{otherName}</p>
            <p className="text-gray-400 text-xs truncate">{job.title}</p>
          </div>
          {/* Indicador de conexión en tiempo real */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-gray-400 text-xs hidden sm:block">
              {connected ? 'En vivo' : 'Conectando...'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="ml-2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Info del trabajo */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {job.address && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {job.address}
              </span>
            )}
            {job.budget && (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                </svg>
                ${job.budget}
              </span>
            )}
            <span className="ml-auto text-emerald-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Tiempo real
            </span>
          </div>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-white">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Inicia la conversación</p>
                <p className="text-xs text-gray-400 mt-0.5">Coordina el horario y los detalles del trabajo aquí.</p>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isMe = msg.sender_id === currentUserId;
            const isOptimistic = String(msg.id).startsWith('tmp-');
            const showAvatar = !isMe && (idx === 0 || messages[idx - 1]?.sender_id !== msg.sender_id);
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${showAvatar ? 'bg-slate-500' : 'opacity-0'}`}>
                    {msg.sender?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className={`max-w-[72%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  {!isMe && showAvatar && (
                    <span className="text-xs text-gray-400 font-medium ml-1">{msg.sender?.name}</span>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? `bg-brand-primary text-white rounded-br-sm ${isOptimistic ? 'opacity-70' : ''}`
                      : 'bg-slate-100 text-gray-800 rounded-bl-sm'
                  }`}>
                    {msg.body}
                  </div>
                  <span className={`text-xs text-gray-400 px-1 flex items-center gap-1 ${isMe ? 'justify-end' : ''}`}>
                    {new Date(msg.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    {isMe && !isOptimistic && <span className="text-emerald-400">✓</span>}
                    {isOptimistic && <span className="text-gray-300">⏳</span>}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex items-end gap-3 px-4 py-4 border-t border-gray-100 bg-white shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Escribe un mensaje..."
            maxLength={1000}
            className="flex-1 px-4 py-3 text-sm bg-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:bg-white transition-all placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="w-11 h-11 flex items-center justify-center bg-brand-primary text-white rounded-2xl hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-40 shrink-0"
          >
            {sending ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
