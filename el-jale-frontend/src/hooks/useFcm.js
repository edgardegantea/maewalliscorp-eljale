// src/hooks/useFcm.js
// Registra el FCM token del usuario en el servidor al iniciar sesión.
// Requiere configurar VITE_FCM_VAPID_KEY en .env del frontend (para web push).
import { useEffect } from 'react';
import api from '../api/axios';

const FCM_VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY;

export function useFcm(user) {
  useEffect(() => {
    if (!user || !FCM_VAPID_KEY) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    registerFcmToken();
  }, [user?.id]);
}

async function registerFcmToken() {
  try {
    // Registrar/obtener SW
    const registration = await navigator.serviceWorker.ready;

    // Pedir permiso de notificaciones
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    // Suscribirse al push (VAPID)
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(FCM_VAPID_KEY),
    });

    // Enviar el token al backend
    // Para FCM Legacy API, el token se extrae del endpoint
    const token = subscription.toJSON().keys?.p256dh || JSON.stringify(subscription);

    await api.post('/fcm-token', { fcm_token: token });
  } catch (e) {
    // Silencioso — las notificaciones push son opt-in
    console.debug('[FCM]', e.message);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}
