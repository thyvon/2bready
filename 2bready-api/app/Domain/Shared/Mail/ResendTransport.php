<?php

declare(strict_types=1);

namespace App\Domain\Shared\Mail;

use Illuminate\Support\Facades\Http;
use RuntimeException;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\MessageConverter;

/**
 * Custom Resend HTTP API mail transport.
 *
 * Sends emails directly via Resend's REST API (https://api.resend.com/emails)
 * over HTTPS (port 443). This bypasses any cloud provider outbound SMTP
 * port blocks (ports 25, 465, 587 on DigitalOcean / AWS / GCP) with zero
 * external dependencies beyond Laravel's built-in Http client.
 */
class ResendTransport extends AbstractTransport
{
    private const API_URL = 'https://api.resend.com/emails';

    public function __construct(
        private readonly string $apiKey,
    ) {
        parent::__construct();
    }

    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());

        $payload = $this->buildPayload($email);

        $response = Http::withToken($this->apiKey)
            ->timeout(15)
            ->acceptJson()
            ->asJson()
            ->post(self::API_URL, $payload);

        if ($response->failed()) {
            $error = $response->json('message') ?? $response->body();
            throw new RuntimeException("Resend API error ({$response->status()}): {$error}");
        }

        $messageId = (string) ($response->json('id') ?? '');
        if ($messageId !== '') {
            $message->getOriginalMessage()->getHeaders()->addHeader('X-Resend-Message-ID', $messageId);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function buildPayload(Email $email): array
    {
        $from = $email->getFrom()[0] ?? null;
        $fromFormatted = $from instanceof Address
            ? ($from->getName() !== '' ? "{$from->getName()} <{$from->getAddress()}>" : $from->getAddress())
            : (string) config('mail.from.address', 'noreply@2bready.asia');

        $to = array_map(fn (Address $addr) => $addr->getAddress(), $email->getTo());

        $payload = [
            'from' => $fromFormatted,
            'to' => $to,
            'subject' => $email->getSubject() ?? '',
        ];

        if ($html = $email->getHtmlBody()) {
            $payload['html'] = is_resource($html) ? stream_get_contents($html) : $html;
        }

        if ($text = $email->getTextBody()) {
            $payload['text'] = is_resource($text) ? stream_get_contents($text) : $text;
        }

        // If neither html nor text was provided, fallback to empty string
        if (! isset($payload['html']) && ! isset($payload['text'])) {
            $payload['text'] = '';
        }

        if (! empty($email->getCc())) {
            $payload['cc'] = array_map(fn (Address $addr) => $addr->getAddress(), $email->getCc());
        }

        if (! empty($email->getBcc())) {
            $payload['bcc'] = array_map(fn (Address $addr) => $addr->getAddress(), $email->getBcc());
        }

        if (! empty($email->getReplyTo())) {
            $payload['reply_to'] = array_map(fn (Address $addr) => $addr->getAddress(), $email->getReplyTo());
        }

        $attachments = [];
        foreach ($email->getAttachments() as $attachment) {
            $attachments[] = [
                'filename' => $attachment->getFilename() ?? 'attachment',
                'content' => base64_encode($attachment->getBody()),
            ];
        }

        if (! empty($attachments)) {
            $payload['attachments'] = $attachments;
        }

        return $payload;
    }

    public function __toString(): string
    {
        return 'resend-api';
    }
}

