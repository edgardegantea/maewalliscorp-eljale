<?php

namespace App\Mail;

use App\Models\ServiceJob;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentReleasedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public ServiceJob $job,
        public User $expert
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: '¡Tu pago fue liberado! — El Jale');
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.payment-released',
            with: ['job' => $this->job, 'expert' => $this->expert]
        );
    }

    public function attachments(): array { return []; }
}
