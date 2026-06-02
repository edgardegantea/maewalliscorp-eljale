// src/components/JobChat.jsx
import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';

export default function JobChat({ job, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 10000);
    return () => clearInterval(pollRef.current);
  }, [job.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/jobs/${job.id}/messages`);
      setMessages(res.data);
    } catch { /* silencioso */ }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/jobs/${job.id}/messages`, { body });
      setMessages(prev => [...prev, res.data]);
      setBody('');
    } catch (err) {
      console.error('Error al enviar mensaje', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
        <svg className="w-4 h-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="text-xs font-semibold text-gray-700">Chat del trabajo</span>
        <span className="ml-auto text-xs text-gray-400">Se actualiza cada 10s</span>
      </div>

      {/* Mensajes */}
      <div className="h-48 overflow-y-auto p-3 space-y-2 bg-white">
        {messages.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-4">
            Aún no hay mensajes. Coordina aquí el horario y detalles.
          </p>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${isMe ? 'bg-brand-primary text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                {!isMe && (
                  <p className="text-xs font-semibold mb-0.5 opacity-70">{msg.sender?.name}</p>
                )}
                <p>{msg.body}</p>
                <p className={`text-xs mt-1 opacity-60 ${isMe ? 'text-right' : ''}`}>
                  {new Date(msg.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-gray-200 bg-gray-50">
        <input
          type="text"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Escribe un mensaje..."
          maxLength={1000}
          className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
        />
        <button
          type="submit" disabled={sending || !body.trim()}
          className="px-3 py-1.5 text-sm font-medium text-white bg-brand-primary hover:bg-orange-600 rounded-md transition-colors disabled:opacity-50"
        >
          {sending ? '...' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}
