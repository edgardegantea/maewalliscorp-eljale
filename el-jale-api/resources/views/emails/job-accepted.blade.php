<x-emails.components.layout subject="¡Experto en camino! — {{ $job->title }}">
  <h1>¡Tu Jale tiene experto! 🎉</h1>
  <p>Hola <strong>{{ $job->client->name }}</strong>, <strong>{{ $expert->name }}</strong> aceptó tu solicitud.</p>

  <div class="card">
    <div class="card-title">Trabajo</div>
    <div class="card-value">{{ $job->title }}</div>
    @if($job->address)
    <p style="margin-top:8px; margin-bottom:0; font-size:14px;">📍 {{ $job->address }}</p>
    @endif
    @if($job->preferred_date)
    <p style="margin-top:4px; margin-bottom:0; font-size:14px;">📅 {{ \Carbon\Carbon::parse($job->preferred_date)->isoFormat('dddd D [de] MMMM') }}{{ $job->preferred_time ? ' a las ' . substr($job->preferred_time,0,5) : '' }}</p>
    @endif
    @if($job->budget)
    <p style="margin-top:4px; margin-bottom:0; font-size:14px;">💰 Presupuesto: <strong>${{ number_format($job->budget,2) }}</strong></p>
    @endif
  </div>

  <p>Coordina los detalles finales usando el chat de la plataforma. Cuando el trabajo esté listo, confirma su terminación para liberar el pago al experto.</p>

  <div style="text-align:center; margin-top:24px;">
    <a href="{{ config('app.frontend_url') }}/client-dashboard" class="btn">Ir al chat →</a>
  </div>
</x-emails.components.layout>
