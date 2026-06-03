// src/hooks/useJobTracking.js
// Escucha cambios de estado en tiempo real de un trabajo via Reverb
import { useEffect } from 'react';
import { getEcho } from '../echo';
import toast from 'react-hot-toast';

const STATUS_MSG = {
  asignado:   { msg: '¡Un experto aceptó tu trabajo!', icon: '🔧', color: 'text-blue-600' },
  completado: { msg: '¡Trabajo marcado como completado!', icon: '✅', color: 'text-emerald-600' },
  cancelado:  { msg: 'El trabajo fue cancelado.', icon: '❌', color: 'text-red-500' },
};

/**
 * Suscribirse a cambios de estado de un trabajo específico.
 * @param {number|null} jobId - ID del trabajo a trackear
 * @param {function} onStatusChange - callback(newStatus, data)
 */
export function useJobTracking(jobId, onStatusChange) {
  useEffect(() => {
    if (!jobId) return;

    const channel = getEcho().private(`job.${jobId}`)
      .listen('.status.changed', (data) => {
        const info = STATUS_MSG[data.status];
        if (info) {
          toast(
            <div className="flex items-center gap-2">
              <span>{info.icon}</span>
              <div>
                <p className="font-semibold text-sm">{info.msg}</p>
                {data.expert_name && data.status === 'asignado' && (
                  <p className="text-xs text-gray-500">Experto: {data.expert_name}</p>
                )}
              </div>
            </div>,
            { duration: 5000 }
          );
        }
        onStatusChange?.(data.status, data);
      });

    return () => {
      getEcho().leave(`job.${jobId}`);
    };
  }, [jobId]);
}
