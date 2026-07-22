<?php

declare(strict_types=1);

namespace App\Domain\DataRoom\Actions;

use App\Domain\AuditLog\Events\AuditableActionOccurred;
use App\Domain\Company\Models\Company;
use App\Domain\DataRoom\Models\DataRoomLink;
use App\Domain\Shared\Services\PlatformSettingService;
use App\Domain\User\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CreateDataRoomLinkAction
{
    public function __construct(private readonly PlatformSettingService $settings) {}

    /** @return array{link: DataRoomLink, pin: string} */
    public function execute(Company $company, User $createdBy): array
    {
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
