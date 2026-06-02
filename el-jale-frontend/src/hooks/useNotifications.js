// src/hooks/useNotifications.js
import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';

export default function useNotifications(intervalMs = 30000) {
  const [pending, setPending] = useState(0);
  const timerRef = useRef(null);

  const fetch = async () => {
    try {
      const res = await api.get('/notifications');
      setPending(res.data.pending);
    } catch {
      // silencioso — no interrumpir el flujo por un fallo de polling
    }
  };

  useEffect(() => {
    fetch();
    timerRef.current = setInterval(fetch, intervalMs);
    return () => clearInterval(timerRef.current);
  }, [intervalMs]);

  return { pending, refresh: fetch };
}
