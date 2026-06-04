<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TwoFactorMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $userName, public string $code) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Tu código de verificación — El Jale');
    }

    public function content(): Content
    {
        return new Content(
            htmlString: "
            <div style='font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;'>
              <div style='background:#FF6B00;padding:20px;border-radius:12px 12px 0 0;text-align:center;'>
                <h1 style='color:white;margin:0;font-size:24px;'>El <strong>Jale</strong></h1>
              </div>
              <div style='background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;'>
                <p style='color:#374151;font-size:16px;'>Hola {$this->userName},</p>
                <p style='color:#6b7280;'>Tu código de verificación es:</p>
                <div style='background:white;border:2px solid #FF6B00;border-radius:12px;padding:24px;text-align:center;margin:24px 0;'>
                  <span style='font-size:40px;font-weight:900;letter-spacing:12px;color:#111827;'>{$this->code}</span>
                </div>
                <p style='color:#9ca3af;font-size:13px;'>Este código expira en 10 minutos. Si no solicitaste este código, ignora este email.</p>
              </div>
            </div>"
        );
    }
}
