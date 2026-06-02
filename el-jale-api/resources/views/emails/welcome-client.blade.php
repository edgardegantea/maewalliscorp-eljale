<x-emails.components.layout subject="¡Bienvenido a El Jale!">
  <h1>¡Bienvenido, {{ $user->name }}! 👋</h1>
  <p>Ya eres parte de El Jale, la plataforma donde encuentras especialistas verificados para cualquier trabajo en tu hogar.</p>

  <div class="card">
    <div class="steps">
      <div class="step"><p><strong>Publica tu Jale</strong> — describe el problema, agrega fotos y fija tu presupuesto.</p></div>
      <div class="step"><p><strong>Recibe cotizaciones</strong> — expertos verificados de tu zona envían sus propuestas.</p></div>
      <div class="step"><p><strong>Elige y paga seguro</strong> — tu dinero queda protegido hasta confirmar el trabajo.</p></div>
    </div>
  </div>

  <div style="text-align:center; margin-top:28px;">
    <a href="{{ config('app.frontend_url') }}/client-dashboard" class="btn">Publicar mi primer Jale →</a>
  </div>
</x-emails.components.layout>
