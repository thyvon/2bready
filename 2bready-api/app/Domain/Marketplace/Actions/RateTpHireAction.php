<?php

declare(strict_types=1);

namespace App\Domain\Marketplace\Actions;

use App\Domain\Marketplace\Enums\TpHireStatus;
use App\Domain\Marketplace\Models\TpHire;
use App\Domain\Marketplace\Models\TpRating;
use App\Domain\User\Models\User;
use App\Exceptions\HireNotRateableException;

/**
 * The company's verdict on a finished engagement — 1–5 stars plus an
 * optional review, recorded against the hire (one rating per hire, enforced
 * by the unique index on tp_ratings.tp_hire_id). Only completed hires are
 * rateable: a firm must have actually done the work before it earns a
 * public reputation, and a cancelled hire must never collect one.
 */
class RateTpHireAction
{
    public function execute(TpHire $tpHire, int $rating, ?string $reviewText, User $ratedBy): TpRating
    {
        if ($tpHire->status !== TpHireStatus::Completed) {
            throw new HireNotRateableException('Only completed hires can be rated.');
        }

        if ($tpHire->rating()->exists()) {
            throw new HireNotRateableException('This hire has already been rated.');
        }

        return $tpHire->rating()->create([
            'company_id' => $tpHire->company_id,
            'tp_partner_id' => $tpHire->tp_partner_id,
            'rating' => $rating,
            'review_text' => $reviewText,
            'created_by_user_id' => $ratedBy->id,
        ]);
    }
}
