<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{ $subject ?? 'El Jale' }}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; }
  .wrapper { max-width: 600px; margin: 40px auto; padding: 0 16px 40px; }
  .header { background: #1a2332; border-radius: 16px 16px 0 0; padding: 28px 32px; text-align: center; }
  .logo { font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; }
  .logo span { color: #FF6B00; }
  .body { background: #ffffff; padding: 36px 32px; }
  .footer { background: #f8fafc; border-radius: 0 0 16px 16px; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
  .footer p { font-size: 12px; color: #94a3b8; line-height: 1.6; }
  h1 { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
  p { font-size: 15px; line-height: 1.7; color: #475569; margin-bottom: 16px; }
  .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin: 20px 0; }
  .card-title { font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .card-value { font-size: 17px; font-weight: 700; color: #0f172a; }
  .pill { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
  .pill-orange { background: #fff7ed; color: #ea580c; }
  .pill-green  { background: #f0fdf4; color: #16a34a; }
  .btn { display: inline-block; background: #FF6B00; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 12px; text-align: center; margin: 8px 0; }
  .btn:hover { background: #ea580c; }
  .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
  .steps { counter-reset: steps; }
  .step { counter-increment: steps; display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
  .step::before { content: counter(steps); background: #FF6B00; color: #fff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
  .step p { margin: 0; font-size: 14px; }
  .amount { font-size: 28px; font-weight: 900; color: #16a34a; }
  @media (max-width: 600px) {
    .body, .header, .footer { padding: 24px 20px; }
  }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo">El <span>Jale</span></div>
  </div>
  <div class="body">
    {{ $slot }}
  </div>
  <div class="footer">
    <p>Este correo fue enviado por El Jale · <a href="{{ config('app.frontend_url', 'http://localhost:5173') }}" style="color:#FF6B00;">eljale.mx</a></p>
    <p style="margin-top:4px;">Si no esperabas este correo, ignóralo.</p>
  </div>
</div>
</body>
</html>
