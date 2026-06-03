// src/components/ReviewModal.jsx
import { useState } from 'react';
import api from '../api/axios';
import StarRating from './StarRating';

export default function ReviewModal({ job, onClose, onDone }) {
  const [rating, setRating]       = useState(0);
  const [comment, setComment]     = useState('');
  const [photos, setPhotos]       = useState([]);
  const [previews, setPreviews]   = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files).slice(0, 4);
    setPhotos(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removePhoto = (i) => {
    setPhotos(p => p.filter((_, idx) => idx !== i));
    setPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setError('Selecciona una calificación.'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('rating', rating);
      if (comment) fd.append('comment', comment);
      photos.forEach(p => fd.append('photos[]', p));
      await api.post(`/jobs/${job.id}/review`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
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

          {/* Fotos del trabajo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📸 Fotos del trabajo terminado <span className="text-gray-400 font-normal">(opcional, máx. 4)</span>
            </label>
            {previews.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {previews.map((src, i) => (
                  <div key={i} className="relative w-16 h-16">
                    <img src={src} className="w-full h-full object-cover rounded-xl border" alt="" />
                    <button type="button" onClick={() => removePhoto(i)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
                  </div>
                ))}
              </div>
            )}
            {previews.length < 4 && (
              <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer border-2 border-dashed border-gray-200 rounded-xl px-4 py-2.5 hover:border-orange-400 hover:bg-orange-50 transition-all w-fit">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Agregar foto
                <input type="file" accept="image/*" multiple className="sr-only" onChange={handlePhotos} />
              </label>
            )}
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
