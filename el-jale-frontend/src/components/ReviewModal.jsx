// src/components/ReviewModal.jsx
import { useState } from 'react';
import api from '../api/axios';
import StarRating from './StarRating';

export default function ReviewModal({ job, onClose, onDone }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setError('Selecciona una calificación.'); return; }
    setSubmitting(true);
    try {
      await api.post(`/jobs/${job.id}/review`, { rating, comment });
      onDone();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar la calificación.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="bg-brand-dark px-6 py-4 rounded-t-xl">
          <h2 className="text-lg font-bold text-white">Califica el trabajo</h2>
          <p className="text-sm text-brand-accent mt-0.5">{job.title}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              ¿Cómo calificarías el trabajo de <strong>{job.expert?.name}</strong>?
            </p>
            <StarRating value={rating} onChange={setRating} size="lg" />
            {rating > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][rating]}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comentario (opcional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={e => setComment(e.target.value)}
              maxLength={500}
              placeholder="¿Qué fue lo que más te gustó? ¿Llegó a tiempo? ¿Dejó todo limpio?"
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Ahora no
            </button>
            <button
              type="submit" disabled={submitting}
              className="px-5 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-orange-600 rounded-md transition-colors disabled:opacity-75"
            >
              {submitting ? 'Enviando...' : 'Enviar calificación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
