<?php

declare(strict_types=1);

namespace App\Domain\DataRoom\Actions;

use App\Domain\Audit\Services\ComplianceScoreCalculator;
use App\Domain\AuditLog\Events\AuditableActionOccurred;
use App\Domain\Company\Models\Company;
use App\Domain\DataRoom\Models\DataRoomLink;
use App\Domain\Package\Enums\Tier;
use App\Domain\Payment\Enums\SubscriptionStatus;
use App\Domain\Payment\Models\Subscription;
use App\Domain\Shared\Services\PlatformSettingService;
use App\Domain\User\Models\User;
use App\Exceptions\DataRoomLinkForbiddenException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CreateDataRoomLinkAction
{
    public function __construct(
        private readonly PlatformSettingService $settings,
        private readonly ComplianceScoreCalculator $scoreCalculator,
    ) {}

    /** @return array{link: DataRoomLink, pin: string} */
    public function execute(Company $company, User $createdBy): array
    {
        // Server-side entitlement gate — the client portal's lock screen is
        // convenience, not the boundary (Authorization via backend rule).
        // Sharing a data room requires an active Enterprise subscription.
        $hasEnterprise = Subscription::query()
            ->withoutGlobalScope('company')
            ->where('subscriptions.company_id', $company->id)
            ->where('subscriptions.status', SubscriptionStatus::Active)
            ->whereHas('package', fn ($q) => $q->where('tier', Tier::Enterprise->value))
            ->exists();

        if (! $hasEnterprise) {
            throw new DataRoomLinkForbiddenException('An active Enterprise subscription is required to share a data room.');
        }

        // And the company's L4 evidence must be fully verified — an investor
        // opening the room should never see an incomplete set. Same required-
        // template semantics as the audit score, so this can never disagree
        // with the compliance number shown elsewhere.
        $l4 = $this->scoreCalculator->calculate($company, 'L4');

        if ($l4['required'] === 0 || $l4['score'] < 100) {
            throw new DataRoomLinkForbiddenException('Your L4 documents must be fully verified before you can share a data room.');
        }

        // Singular active link per company (see DataRoomLink's docblock) —
        // one atomic UPDATE rather than fetch-then-save, so there's no
        // window where two links are simultaneously active.
        DataRoomLink::query()
            ->where('company_id', $company->id)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);

        $pin = Str::upper(Str::random(8));
        $expiryDays = (int) $this->settings->get('data_room_link_expiry_days', 7);

        $link = DataRoomLink::query()->create([
            'company_id' => $company->id,
            'created_by' => $createdBy->id,
            'token' => Str::random(64),
            'pin_hash' => Hash::make($pin),
            'expires_at' => now()->addDays($expiryDays),
        ]);

        event(new AuditableActionOccurred(
            action: 'data_room_link_created',
            companyId: $company->id,
            auditableType: DataRoomLink::class,
            auditableId: $link->id,
            actorId: $createdBy->id,
            actorEmail: $createdBy->email,
        ));

        return ['link' => $link, 'pin' => $pin];
    }
}
