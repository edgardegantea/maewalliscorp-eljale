<?php

namespace App\Mail;

use App\Models\ServiceJob;
use App\Models\User;
use App\Models\JobBid;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BidReceivedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public ServiceJob $job,
        public User $expert,
        public JobBid $bid,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Nueva cotización para «{$this->job->title}» — El Jale");
    }

    public function content(): Content
    {
        return new Content(view: 'emails.bid-received', with: [
            'job'    => $this->job,
            'expert' => $this->expert,
            'bid'    => $this->bid,
        ]);
    }

    public function attachments(): array { return []; }
}
