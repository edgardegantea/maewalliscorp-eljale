<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NoBidsReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $clientName,
        public string $jobTitle,
        public int    $jobId,
        public string $frontendUrl
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: '⏳ Tu Jale aún no tiene cotizaciones — activa modo urgente');
    }

    public function content(): Content
    {
        $url = "{$this->frontendUrl}/client-dashboard";
        return new Content(
            htmlString: "
            <div style='font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;'>
              <div style='background:#FF6B00;padding:20px;border-radius:12px 12px 0 0;text-align:center;'>
                <h1 style='color:white;margin:0;'>El <strong>Jale</strong></h1>
              </div>
              <div style='background:#fffbf5;padding:32px;border-radius:0 0 12px 12px;border:1px solid #fde68a;'>
                <p style='color:#374151;font-size:16px;'>Hola {$this->clientName},</p>
                <p style='color:#6b7280;'>Tu trabajo <strong>«{$this->jobTitle}»</strong> lleva más de 2 horas sin cotizaciones.</p>
                <div style='background:white;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e5e7eb;'>
                  <p style='margin:0;font-weight:700;color:#111827;'>💡 ¿Qué puedes hacer?</p>
                  <ul style='color:#6b7280;line-height:2;'>
                    <li>Activar <strong>Modo Urgente</strong> para aparecer primero</li>
                    <li>Aumentar tu presupuesto un poco</li>
                    <li>Agregar fotos del problema</li>
                  </ul>
                </div>
                <a href='{$url}' style='display:block;background:#FF6B00;color:white;text-align:center;padding:14px;border-radius:10px;font-weight:700;text-decoration:none;'>
                  ⚡ Activar modo urgente →
                </a>
                <p style='color:#9ca3af;font-size:12px;margin-top:16px;text-align:center;'>
                  Recibiste este email porque tienes una solicitud activa en El Jale.
                </p>
              </div>
            </div>"
        );
    }
}
