// src/hooks/usePWAInstall.js — Hook para el prompt de instalación de la PWA
import { useState, useEffect } from 'react';

export default function usePWAInstall() {
  const [prompt, setPrompt]       = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!prompt) return false;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setPrompt(null);
      setInstalled(true);
    }
    return outcome === 'accepted';
  };

  return { canInstall: !!prompt && !installed, installed, install };
}
