<?php

declare(strict_types=1);

namespace App\Domain\LegalConsent\Actions;

use App\Domain\AuditLog\Events\AuditableActionOccurred;
use App\Domain\Company\Models\Company;
use App\Domain\LegalConsent\Enums\PathwayLevel;
use App\Domain\LegalConsent\Models\LegalConsent;
use App\Domain\LegalConsent\Services\LegalConsentService;
use App\Domain\User\Models\User;

/**
 * Record a client-side legal consent for a restricted P3/P4 document action
 * (v3 §4.2/§5.1). Two writes by design:
 *  1. legal_consents — the durable record tied to the current consent-text
 *     version, so old consents stay valid evidence after a rewording.
 *  2. audit_logs — via AuditableActionOccurred, the access-trail entry, so a
 *     consent can be proven even if the LegalConsent row were ever disputed.
 * Stamping the version at record time (not reading it back later) is what
 * makes the versioned evidence work.
 */
class RecordLegalConsentAction
{
    public function __construct(private readonly LegalConsentService $service) {}

    public function execute(User $user, Company $company, PathwayLevel $pathwayLevel, ?string $ipAddress = null): LegalConsent
    {
        $consent = LegalConsent::query()->create([
            'user_id' => $user->id,
            'company_id' => $company->id,
            'pathway_level' => $pathwayLevel,
            'consent_text_version' => $this->service->currentVersion(),
            'accepted_at' => now(),
            'ip_address' => $ipAddress,
        ]);

        event(new AuditableActionOccurred(
            action: 'legal_consent_recorded',
            companyId: $company->id,
            auditableType: LegalConsent::class,
            auditableId: $consent->id,
            metadata: [
                'pathway_level' => $pathwayLevel->value,
                'consent_text_version' => $consent->consent_text_version,
                'ip' => $ipAddress,
            ],
        ));

        return $consent;
    }
}
