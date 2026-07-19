<?php

declare(strict_types=1);

namespace App\Domain\Shared\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

// A real Mailable (not Mail::raw()) so MailSettingController's test-send
// endpoint is assertable with Mail::fake()/Mail::assertSent() — MailFake
// silently no-ops Mail::raw() calls, so a raw send can never be verified
// in a test.
class MailSettingTestMail extends Mailable
{
    use Queueable, SerializesModels;

    public function build(): self
    {
        return $this->subject('2bReady test email')
            ->html('<p>This is a test email from 2bReady — your SMTP settings are working.</p>');
    }
}
