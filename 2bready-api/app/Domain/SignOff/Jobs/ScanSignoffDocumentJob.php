<?php

declare(strict_types=1);

namespace App\Domain\SignOff\Jobs;

use App\Domain\SignOff\Models\SignoffDocument;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * STUB — same honest-stub pattern as Document's ScanDocumentForMalwareJob.
 * No real antivirus service is wired into this project yet; the job has the
 * correct real shape (queued, never inline) and transitions nothing while
 * the scan always passes. A real integration would flip an infected file to
 * rejected with a security-scan comment behind this same job.
 */
class ScanSignoffDocumentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public readonly string $signoffDocumentId) {}

    public function handle(): void
    {
        SignoffDocument::query()->find($this->signoffDocumentId);
    }
}
