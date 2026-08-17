<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Shared\Services\PlatformSettingService;
use Illuminate\Database\Seeder;

class PlatformSettingSeeder extends Seeder
{
    public function run(PlatformSettingService $settings): void
    {
        $settings->set('bypass_employee_threshold', 8, 'compliance');

        // Off by default for demo/local dev so a fresh install's seeded admin
        // can sign in immediately; flip on from Settings > Security when
        // enforcing 2FA. Enforced per-account regardless of this toggle once
        // an admin turns it on and users enroll (see IssueAuthTokenAction).
        $settings->set('two_factor_globally_enabled', false, 'security');
        $settings->set('data_room_link_expiry_days', 7, 'compliance');

        // How many days before a recurring document expires to warn the
        // company — admin-tunable, not a literal, so ops can adjust it from
        // Settings without a redeploy.
        $settings->set('document_expiry_reminder_days', 30, 'compliance');

        // What 2bReady keeps from a TP hire's agreed price — the rest is the
        // firm's payout (see CreateTpHireAction). Not a confirmed business
        // figure from the source proposal, a placeholder default pending a
        // real decision — admin-editable via Settings, not a redeploy.
        $settings->set('marketplace.commission_percent', 15, 'marketplace');
    }
}
