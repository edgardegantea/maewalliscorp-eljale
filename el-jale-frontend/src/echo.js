// src/echo.js — Laravel Echo conectado a Reverb (lazy connection)
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

let _echo = null;

/**
 * Retorna la instancia de Echo, creándola la primera vez.
 * Se llama solo cuando se abre el chat — no al cargar la app.
 */
export function getEcho() {
    if (_echo) return _echo;

    _echo = new Echo({
        broadcaster:       'reverb',
        key:               import.meta.env.VITE_REVERB_APP_KEY,
        wsHost:            import.meta.env.VITE_REVERB_HOST,
        wsPort:            import.meta.env.VITE_REVERB_PORT   ?? 8080,
        wssPort:           import.meta.env.VITE_REVERB_PORT   ?? 8080,
        forceTLS:          (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint:      import.meta.env.VITE_API_URL + '/broadcasting/auth',
        auth: {
            headers: {
                Authorization: 'Bearer ' + (localStorage.getItem('token') ?? ''),
                Accept: 'application/json',
            },
        },
    });

    return _echo;
}

export default { getEcho };
