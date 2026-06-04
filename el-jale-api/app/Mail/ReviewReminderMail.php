<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReviewReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $clientName,
        public string $expertName,
        public string $jobTitle,
        public string $frontendUrl
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "⭐ ¿Cómo estuvo {$this->expertName}? Deja tu reseña");
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
                <p style='color:#6b7280;'>Tu trabajo <strong>«{$this->jobTitle}»</strong> fue completado por <strong>{$this->expertName}</strong>.</p>
                <div style='text-align:center;margin:24px 0;'>
                  <p style='color:#111827;font-weight:700;font-size:18px;'>¿Cómo calificarías el trabajo?</p>
                  <div style='font-size:40px;letter-spacing:8px;'>⭐⭐⭐⭐⭐</div>
                </div>
                <p style='color:#6b7280;font-size:14px;'>Tu reseña ayuda a otros clientes a elegir buenos expertos y motiva a {$this->expertName} a seguir mejorando.</p>
                <a href='{$url}' style='display:block;background:#FF6B00;color:white;text-align:center;padding:14px;border-radius:10px;font-weight:700;text-decoration:none;margin-top:16px;'>
                  ⭐ Dejar mi reseña →
                </a>
                <p style='color:#9ca3af;font-size:12px;margin-top:16px;text-align:center;'>Solo toma 30 segundos.</p>
              </div>
            </div>"
        );
    }
}
