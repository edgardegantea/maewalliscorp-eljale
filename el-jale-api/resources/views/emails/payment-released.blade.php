<x-emails.components.layout subject="¡Tu pago fue liberado! — El Jale">
  <h1>💰 ¡Cobro confirmado!</h1>
  <p>Hola <strong>{{ $expert->name }}</strong>, el cliente confirmó que el trabajo quedó perfecto.</p>

  <div class="card" style="text-align:center;">
    <div class="card-title">Recibirás</div>
    <div class="amount">${{ number_format($payment->expert_amount ?? $payment->amount, 2) }} MXN</div>
    @if(($payment->platform_fee ?? 0) > 0)
    <p style="font-size:13px; color:#94a3b8; margin-top:4px; margin-bottom:0;">Comisión de plataforma: ${{ number_format($payment->platform_fee, 2) }}</p>
    @endif
  </div>

  <div class="card">
    <div class="card-title">Trabajo completado</div>
    <div class="card-value">{{ $job->title }}</div>
  </div>

  <p>El dinero llegará a tu cuenta según los tiempos de procesamiento bancario. ¡Sigue así!</p>

  <div style="text-align:center; margin-top:24px;">
    <a href="{{ config('app.frontend_url', 'http://localhost:5173') }}/expert-dashboard" class="btn">Ver mis estadísticas →</a>
  </div>
</x-emails.components.layout>
