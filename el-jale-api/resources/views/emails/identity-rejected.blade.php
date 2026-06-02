<x-emails.components.layout subject="Acción requerida: verifica tu identidad en El Jale">
  <h1>📋 Necesitamos mejores documentos</h1>
  <p>Hola <strong>{{ $user->name }}</strong>, revisamos tus documentos y necesitamos que los vuelvas a enviar.</p>

  <div class="card" style="border-color:#fca5a5; background:#fff5f5;">
    <div class="card-title" style="color:#dc2626;">Motivo</div>
    <p style="margin-bottom:0; color:#7f1d1d;">{{ $reason }}</p>
  </div>

  <p>Puedes volver a enviar tus documentos desde tu perfil. Asegúrate de que las fotos sean nítidas y que todos los datos sean legibles.</p>

  <div style="text-align:center; margin-top:24px;">
    <a href="{{ config('app.frontend_url', 'http://localhost:5173') }}/expert-dashboard" class="btn">Volver a enviar documentos →</a>
  </div>
</x-emails.components.layout>
