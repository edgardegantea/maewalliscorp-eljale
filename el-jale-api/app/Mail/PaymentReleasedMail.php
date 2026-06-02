<?php

namespace App\Mail;

use App\Models\ServiceJob;
use App\Models\User;
use App\Models\Payment;
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
        public User $expert,
        public ?Payment $payment = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: '💰 ¡Tu pago fue liberado! — El Jale');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.payment-released', with: [
            'job'     => $this->job,
            'expert'  => $this->expert,
            'payment' => $this->payment ?? $this->job->payment,
        ]);
    }

    public function attachments(): array { return []; }
}
