<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: DejaVu Sans, sans-serif; font-size: 13px; color: #1e293b; background: #fff; }
  .page { padding: 48px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .logo { font-size: 26px; font-weight: 900; color: #1a2332; }
  .logo span { color: #FF6B00; }
  .invoice-info { text-align: right; }
  .invoice-info h1 { font-size: 22px; font-weight: 900; color: #FF6B00; letter-spacing: -0.5px; }
  .invoice-info p { font-size: 12px; color: #64748b; margin-top: 2px; }
  .divider { border: none; border-top: 2px solid #FF6B00; margin: 24px 0; }
  .parties { display: flex; gap: 40px; margin-bottom: 32px; }
  .party { flex: 1; }
  .party-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; margin-bottom: 6px; }
  .party-name { font-size: 16px; font-weight: 800; color: #0f172a; }
  .party-detail { font-size: 12px; color: #64748b; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin: 24px 0; }
  th { background: #1a2332; color: #fff; padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
  tr:last-child td { border-bottom: none; }
  .totals { margin-left: auto; width: 280px; margin-top: 16px; }
  .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
  .totals-row.total { border-top: 2px solid #FF6B00; margin-top: 8px; padding-top: 10px; font-weight: 900; font-size: 16px; color: #0f172a; }
  .badge { display: inline-block; background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
  .footer { margin-top: 48px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin: 24px 0; }
  .info-box p { font-size: 12px; color: #475569; margin-bottom: 4px; }
  .info-box p:last-child { margin-bottom: 0; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo">El <span>Jale</span></div>
    <div class="invoice-info">
      <h1>RECIBO #{{ str_pad($job->id, 6, '0', STR_PAD_LEFT) }}</h1>
      <p>Emitido: {{ now()->isoFormat('D [de] MMMM [de] YYYY') }}</p>
      <p>Trabajo completado: {{ \Carbon\Carbon::parse($job->updated_at)->isoFormat('D [de] MMMM [de] YYYY') }}</p>
    </div>
  </div>

  <hr class="divider">

  <div class="parties">
    <div class="party">
      <div class="party-label">Cliente</div>
      <div class="party-name">{{ $job->client->name }}</div>
      <div class="party-detail">{{ $job->client->email }}</div>
    </div>
    <div class="party">
      <div class="party-label">Proveedor de servicio</div>
      <div class="party-name">{{ $job->expert->name }}</div>
      <div class="party-detail">{{ $job->expert->email }}</div>
    </div>
  </div>

  <div class="info-box">
    <p><strong>Servicio:</strong> {{ $job->category->name ?? 'Servicio general' }}</p>
    @if($job->address)<p><strong>Dirección:</strong> {{ $job->address }}</p>@endif
    @if($job->preferred_date)<p><strong>Fecha del servicio:</strong> {{ \Carbon\Carbon::parse($job->preferred_date)->isoFormat('D [de] MMMM [de] YYYY') }}</p>@endif
  </div>

  <table>
    <thead>
      <tr>
        <th>Descripción</th>
        <th style="text-align:right;">Monto</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>{{ $job->title }}</strong><br>
          <span style="color:#64748b; font-size:12px;">{{ Str::limit($job->description, 120) }}</span>
        </td>
        <td style="text-align:right; font-weight:700;">${{ number_format($payment->amount, 2) }} MXN</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span style="color:#64748b;">Subtotal</span>
      <span>${{ number_format($payment->amount, 2) }}</span>
    </div>
    @if(($payment->platform_fee ?? 0) > 0)
    <div class="totals-row">
      <span style="color:#64748b;">Comisión plataforma</span>
      <span style="color:#94a3b8;">-${{ number_format($payment->platform_fee, 2) }}</span>
    </div>
    <div class="totals-row">
      <span style="color:#64748b;">Experto recibe</span>
      <span style="color:#16a34a; font-weight:700;">${{ number_format($payment->expert_amount, 2) }}</span>
    </div>
    @endif
    <div class="totals-row total">
      <span>Total pagado</span>
      <span>${{ number_format($payment->amount, 2) }} MXN</span>
    </div>
  </div>

  <div style="margin-top:24px;">
    <span class="badge">✓ Pago procesado — {{ ucfirst(str_replace('_', ' ', $payment->status)) }}</span>
    @if($payment->mp_payment_id)
    <span style="font-size:11px; color:#94a3b8; margin-left:8px;">ID MercadoPago: {{ $payment->mp_payment_id }}</span>
    @endif
  </div>

  <div class="footer">
    <p>El Jale · <strong>eljale.mx</strong> · noreply@eljale.mx</p>
    <p>Este documento es un comprobante de servicio. No es una factura fiscal (CFDI).</p>
  </div>
</div>
</body>
</html>
