<?php

declare(strict_types=1);

namespace App\Domain\Journey\Actions;

use App\Domain\Journey\Models\JourneyLevel;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class UploadJourneyLevelMedalAction
{
    // No malware-scan dispatch here — see CLAUDE.md "simplest option first";
    // this upload surface is gated to journey_template.manage (trusted
    // staff, never arbitrary tenant users), and the existing
    // ScanDocumentForMalwareJob is an unwired stub anyway. Revisit if this
    // upload surface is ever opened to non-staff.
    public function execute(JourneyLevel $journeyLevel, UploadedFile $file): JourneyLevel
    {
        if ($journeyLevel->medal_image_path) {
            Storage::disk('local')->delete($journeyLevel->medal_image_path);
        }

        $path = $file->store("journey-level-medals/{$journeyLevel->id}", 'local');

        $journeyLevel->update(['medal_image_path' => $path]);

        return $journeyLevel;
    }
}
