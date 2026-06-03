<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Tu resumen semanal</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .wrap { max-width: 580px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .header { background: linear-gradient(135deg, #FF6B00, #FF8C38); padding: 32px 24px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; }
    .header p  { color: rgba(255,255,255,.85); margin: 6px 0 0; font-size: 14px; }
    .body { padding: 28px 24px; }
    .greeting { font-size: 16px; color: #222; margin-bottom: 20px; }
    .stats { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
    .stat { flex: 1 1 120px; background: #fff8f3; border: 1px solid #ffe0cc; border-radius: 10px; padding: 14px; text-align: center; }
    .stat .num { font-size: 28px; font-weight: 700; color: #FF6B00; }
    .stat .lbl { font-size: 12px; color: #777; margin-top: 4px; }
    .cta { display: block; width: fit-content; margin: 0 auto 24px; background: #FF6B00; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; }
    .premium-banner { background: linear-gradient(135deg, #ffd700, #ff9500); border-radius: 10px; padding: 16px 20px; margin-bottom: 20px; color: #fff; font-size: 14px; }
    .premium-banner strong { display: block; font-size: 16px; margin-bottom: 4px; }
    .footer { background: #f9f9f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #aaa; }
    .footer a { color: #FF6B00; text-decoration: none; }
  </style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>📊 Tu resumen de la semana</h1>
    <p>Semana del {{ \Carbon\Carbon::parse($data['week_start'])->format('d/m/Y') }}</p>
  </div>

  <div class="body">
    <p class="greeting">Hola <strong>{{ $data['name'] }}</strong>, aquí está tu actividad de esta semana:</p>

    <div class="stats">
      <div class="stat">
        <div class="num">{{ $data['jobs_completed'] }}</div>
        <div class="lbl">Jales completados</div>
      </div>
      <div class="stat">
        <div class="num">{{ $data['bids_sent'] }}</div>
        <div class="lbl">Cotizaciones enviadas</div>
      </div>
      <div class="stat">
        <div class="num">${{ number_format($data['total_earned'], 0) }}</div>
        <div class="lbl">Ganado (MXN)</div>
      </div>
      <div class="stat">
        <div class="num">{{ number_format($data['average_rating'], 1) }}⭐</div>
        <div class="lbl">Calificación promedio</div>
      </div>
    </div>

    <p style="color:#555;font-size:14px;">
      Hay <strong>{{ $data['jobs_available'] }} trabajos disponibles</strong> en tu categoría ahora mismo.
    </p>

    @if(!$data['is_premium'])
    <div class="premium-banner">
      <strong>⭐ Hazte Premium y consigue más clientes</strong>
      Aparece primero en las búsquedas, muestra tu badge Premium y recibe prioridad en las notificaciones.
    </div>
    @endif

    <a class="cta" href="{{ config('app.frontend_url') }}/expert-dashboard">
      Ver mi dashboard →
    </a>
  </div>

  <div class="footer">
    © {{ date('Y') }} El Jale. <a href="{{ config('app.frontend_url') }}">eljalecorp.com</a><br/>
    Recibes este correo porque eres experto en El Jale.
  </div>
</div>
</body>
</html>
