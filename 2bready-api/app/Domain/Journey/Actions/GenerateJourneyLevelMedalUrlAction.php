<?php

declare(strict_types=1);

namespace App\Domain\Journey\Actions;

use App\Domain\Journey\Models\JourneyLevel;
use Illuminate\Support\Facades\Storage;

/**
 * Same private-disk + signed-URL mechanism as
 * Document\Actions\GeneratePreviewUrlAction, but a much longer expiry: a
 * document preview is opened on-demand by one user for one document, so a
 * short-lived link is fine, but a medal renders as always-visible chrome on
 * every level, on every page load, across both portals — a 5 minute link
 * would need constant regeneration. An hour keeps this well short of
 * "effectively permanent" while avoiding that churn.
 */
class GenerateJourneyLevelMedalUrlAction
{
    public function execute(JourneyLevel $journeyLevel): string
    {
        return Storage::disk('local')->temporaryUrl(
            $journeyLevel->medal_image_path,
            now()->addHour(),
        );
    }
}
