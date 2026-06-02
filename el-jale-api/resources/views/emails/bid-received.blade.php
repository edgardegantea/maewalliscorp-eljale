<x-emails.components.layout subject="Nueva cotización para tu Jale — {{ $job->title }}">
  <h1>💬 Tienes una cotización nueva</h1>
  <p>Hola <strong>{{ $job->client->name }}</strong>, <strong>{{ $expert->name }}</strong> envió una propuesta para tu solicitud.</p>

  <div class="card">
    <div class="card-title">Jale</div>
    <div class="card-value">{{ $job->title }}</div>
  </div>

  <div class="card">
    <div class="card-title">Mensaje del experto</div>
    <p style="margin-bottom:0; font-style:italic; color:#334155;">"{{ $bid->message }}"</p>
    @if($bid->amount)
    <p style="margin-top:8px; margin-bottom:0;"><strong style="font-size:20px; color:#16a34a;">${{ number_format($bid->amount,2) }}</strong></p>
    @endif
  </div>

  <p>Puedes ver el perfil del experto, sus reseñas y aceptar su cotización desde la plataforma.</p>

  <div style="text-align:center; margin-top:24px;">
    <a href="{{ config('app.frontend_url', 'http://localhost:5173') }}/client-dashboard" class="btn">Ver cotización →</a>
  </div>
</x-emails.components.layout>
