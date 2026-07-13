<?php

declare(strict_types=1);

namespace App\Domain\Document\Events;

use App\Domain\Document\Models\Document;
use Illuminate\Foundation\Events\Dispatchable;

class DocumentVerified
{
    use Dispatchable;

    public function __construct(public readonly Document $document) {}
}
