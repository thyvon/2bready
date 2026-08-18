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

        // Vault (v3 §0.5): the blueprint hardcoded a 3-minute auto-lock and a
        // 6-digit PIN in the prototype — both are seed defaults here, not
        // literals, so an admin can tune them from Settings without a redeploy.
        $settings->set('vault_auto_lock_minutes', 3, 'security');
        $settings->set('vault_pin_length', 6, 'security');

        // Legal consent (v3 §5.1): versioned consent text. The blueprint's
        // exact string is the seed default (en is the legally operative copy,
        // kh mirrors it); bump legal_consent_version whenever it's reworded
        // so old consents remain valid evidence against their own version.
        $settings->set('legal_consent_version', 'v1', 'compliance');
        $settings->set('legal_consent_text_en', 'I agree to the Terms of Use — I confirm authorization and will use this document for legitimate business purposes. It contains confidential information.', 'compliance');
        $settings->set('legal_consent_text_kh', 'ខ្ញុំយល់ព្រមនឹងលក្ខខណ្ឌប្រើប្រាស់ — ខ្ញុំបញ្ជាក់សិទ្ធិអំណាច ហើយនឹងប្រើប្រាស់ឯកសារនេះសម្រាប់គោលបំណងអាជីវកម្មស្របច្បាប់។ វាមានផ្ទុកព័ត៌មានសម្ងាត់។', 'compliance');

        // Certificates (v3 §0.3): the fixed master-verification-authority stamp
        // every certificate footer carries regardless of which TP partner was
        // hired for the audit. Snapshot into certificates.master_verifier_stamp
        // at issuance, so historical certificates don't change if this is later
        // edited. verify_base_url is what the QR encodes (v3 §1.6) — the public
        // verify page root, seeded with the production blueprint value.
        $settings->set('certificate.master_verification_authority', [
            'verified_by' => 'ADMIT UNIT Master Auditors',
            'approved_by' => 'ADMIT Global Executive',
            'prepared_by' => '2bReady Trust Engine Powered by ADMIT Global',
        ], 'certificate');
        $settings->set('certificate.verify_base_url', 'https://verify.2bready.asia', 'certificate');
    }
}
