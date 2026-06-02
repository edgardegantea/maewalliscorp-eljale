<x-emails.components.layout subject="¡Identidad verificada! Ya puedes aceptar trabajos">
  <h1>✅ ¡Estás verificado!</h1>
  <p>Hola <strong>{{ $user->name }}</strong>, tu identidad fue verificada por el equipo de El Jale.</p>

  <div class="card" style="text-align:center;">
    <span class="pill pill-green" style="font-size:14px; padding:8px 20px;">✓ Experto Verificado</span>
    <p style="margin-top:12px; margin-bottom:0; font-size:14px;">Tu perfil ahora muestra la insignia de verificación que genera confianza en los clientes.</p>
  </div>

  <p>A partir de ahora apareces en los resultados de búsqueda y puedes aceptar y cotizar trabajos en tu zona.</p>

  <div style="text-align:center; margin-top:24px;">
    <a href="{{ config('app.frontend_url', 'http://localhost:5173') }}/expert-dashboard" class="btn">Ver trabajos disponibles →</a>
  </div>
</x-emails.components.layout>
