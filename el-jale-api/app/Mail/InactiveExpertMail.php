<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InactiveExpertMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $expertName,
        public int    $newJobsCount,
        public string $frontendUrl
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "🔔 {$this->newJobsCount} trabajos nuevos te esperan en El Jale");
    }

    public function content(): Content
    {
        $url = "{$this->frontendUrl}/expert-dashboard";
        return new Content(
            htmlString: "
            <div style='font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;'>
              <div style='background:#1f2937;padding:20px;border-radius:12px 12px 0 0;text-align:center;'>
                <h1 style='color:white;margin:0;'>El <strong style='color:#FF6B00;'>Jale</strong></h1>
              </div>
              <div style='background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;'>
                <p style='color:#374151;font-size:16px;'>Hola {$this->expertName},</p>
                <p style='color:#6b7280;'>Tienes <strong>{$this->newJobsCount} trabajos nuevos</strong> disponibles en tu zona y categoría que aún no has revisado.</p>
                <div style='background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin:20px 0;text-align:center;'>
                  <p style='font-size:32px;font-weight:900;color:#FF6B00;margin:0;'>{$this->newJobsCount}</p>
                  <p style='color:#9a3412;margin:4px 0 0;font-weight:600;'>trabajos esperando cotización</p>
                </div>
                <p style='color:#6b7280;font-size:14px;'>Responde rápido — los primeros en cotizar tienen más probabilidades de ser elegidos.</p>
                <a href='{$url}' style='display:block;background:#FF6B00;color:white;text-align:center;padding:14px;border-radius:10px;font-weight:700;text-decoration:none;margin-top:16px;'>
                  Ver trabajos disponibles →
                </a>
              </div>
            </div>"
        );
    }
}
