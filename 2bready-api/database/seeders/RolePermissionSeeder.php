<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // ─── Define all permissions ────────────────────────────────────────────
        $permissions = [
            // Portal access — which frontend app a role may authenticate into
            // (see AuthController::login/adminLogin/tpLogin). The single source
            // of truth for "who can use admin-portal vs client-portal vs
            // tp-portal"; a new back-office or company-side role only ever needs
            // adding to the assignment lists below, never a code change in
            // AuthController, User, or any frontend's route-gating logic.
            'portal.admin.access',
            'portal.client.access',
            'portal.tp.access',

            // Company
            'company.view',
            'company.edit',
            'company.create',
            'company.delete',
            'company.list',

            // Industries (reference data for company setup)
            'industry.view',
            'industry.manage',

            // Team / Users
            'user.manage',      // admin: full user management
            'user.invite',      // owner: invite members to own company
            'user.remove',      // owner: remove members from own company

            // Packages
            'package.view',
            'package.manage',   // create / edit / archive packages

            // Subscriptions
            'subscription.view',
            'subscription.manage',

            // Payments
            'payment.view',
            'payment.manage',   // refunds, manual adjustments

            // Leads (paywall lead capture)
            'lead.view',

            // Journey
            'journey.view',
            'journey.complete', // mark milestones done
            'journey.manage',   // create / edit journey templates

            // Journey taxonomy authoring (JourneyTemplate/JourneyLevel/Milestone
            // CRUD) — deliberately separate from journey.manage above, which
            // gates milestone sign-off, not editing the taxonomy itself.
            'journey_template.view',
            'journey_template.manage',

            // Documents
            'document.view',
            'document.upload',
            'document.delete',
            'document.manage',  // admin: view / manage across all companies
            // auditor: verify/reject only a document belonging to a company
            // they have an active TpHire for — see DocumentPolicy::manage().
            // Never granted to admin/staff, who already have unrestricted
            // document.manage.
            'document.manage.assigned',

            // Document template authoring — separate from document.manage
            // above, which gates verify/reject of uploaded documents.
            'document_template.view',
            'document_template.manage',

            // Audit
            'audit.view',
            'audit.request',    // company: request an audit
            'audit.conduct',    // auditor: conduct / submit audit findings
            'audit.manage',     // admin: assign, override, close audits

            // Trust Badge
            'trust_badge.view',
            'trust_badge.manage', // award / revoke

            // Data Room
            'data_room.view',
            'data_room.manage', // set access control, manage folders
            'data_room.share',  // create guest/PIN sharing links

            // SOPs
            'sop.view',
            'sop.manage',

            // Support
            'support.view',
            'support.create',
            'support.manage',   // admin: reply, close, escalate tickets

            // Notifications
            'notification.view',

            // Reports & Audit Logs
            'report.view',
            'audit_log.view',

            // Platform settings
            'settings.manage',
            'faq.manage',

            // TP Partner (the audit firm/vendor org itself — admin-only CRUD,
            // registering firms and their staff)
            'tp_partner.manage',

            // Marketplace (the paid TpHire engagement — admin-only create/
            // manage; a TP's own view of their active hires is gated on
            // portal.tp.access + TpHirePolicy's assignment check instead)
            'marketplace.manage',
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        // ─── Create / retrieve roles ───────────────────────────────────────────
        $admin = Role::firstOrCreate(['name' => 'admin',          'guard_name' => 'web']);
        $staff = Role::firstOrCreate(['name' => 'staff',          'guard_name' => 'web']);
        $finance = Role::firstOrCreate(['name' => 'finance',        'guard_name' => 'web']);
        $owner = Role::firstOrCreate(['name' => 'company_owner',  'guard_name' => 'web']);
        $member = Role::firstOrCreate(['name' => 'company_member', 'guard_name' => 'web']);
        $auditor = Role::firstOrCreate(['name' => 'auditor',        'guard_name' => 'web']);

        // ─── Assign permissions ────────────────────────────────────────────────

        // Admin — full platform access, but portal.client.access/portal.tp.access
        // are deliberately excluded: syncPermissions($permissions) would otherwise
        // grant them too (it's "full access" to literally everything, including
        // every portal flag), letting an admin log into client-portal or
        // tp-portal. admin has no current_company_id and no Auditor profile, so
        // either session would show a portal with nothing in it — not a real use
        // case, just an accident of the superuser grant. Every other back-office
        // role below grants its own portal.*.access explicitly, one at a time,
        // for the same reason.
        $admin->syncPermissions($permissions);
        $admin->revokePermissionTo('portal.client.access');
        $admin->revokePermissionTo('portal.tp.access');

        // Staff — everything except destructive financial ops & platform settings
        $staff->syncPermissions([
            'portal.admin.access',
            'company.view', 'company.edit', 'company.create', 'company.list',
            'industry.view', 'industry.manage',
            'user.manage', 'user.invite', 'user.remove',
            'package.view', 'package.manage',
            'subscription.view', 'subscription.manage',
            'payment.view',
            'lead.view',
            'journey.view', 'journey.complete', 'journey.manage',
            'journey_template.view', 'journey_template.manage',
            'document.view', 'document.upload', 'document.delete', 'document.manage',
            'document_template.view', 'document_template.manage',
            'audit.view', 'audit.manage',
            'trust_badge.view', 'trust_badge.manage',
            'data_room.view', 'data_room.manage', 'data_room.share',
            'sop.view', 'sop.manage',
            'tp_partner.manage', 'marketplace.manage',
            'support.view', 'support.create', 'support.manage',
            'notification.view',
            'report.view', 'audit_log.view',
            'faq.manage',
        ]);

        // Finance — billing & reporting focus
        $finance->syncPermissions([
            'portal.admin.access',
            'company.view', 'company.list',
            'package.view', 'package.manage',
            'subscription.view', 'subscription.manage',
            'payment.view', 'payment.manage',
            'lead.view',
            'notification.view',
            'report.view', 'audit_log.view',
        ]);

        // Company Owner — full control of own company
        $owner->syncPermissions([
            'portal.client.access',
            'company.view', 'company.edit',
            'industry.view',
            'user.invite', 'user.remove',
            'package.view',
            'subscription.view',
            'payment.view',
            'journey.view', 'journey.complete',
            'document.view', 'document.upload', 'document.delete',
            'audit.view', 'audit.request',
            'trust_badge.view',
            'data_room.view', 'data_room.manage', 'data_room.share',
            'sop.view',
            'support.view', 'support.create',
            'notification.view',
            'report.view', 'audit_log.view',
        ]);

        // Company Member — read + contribute within own company
        $member->syncPermissions([
            'portal.client.access',
            'company.view',
            'industry.view',
            'journey.view', 'journey.complete',
            'document.view', 'document.upload',
            'audit.view',
            'trust_badge.view',
            'data_room.view',
            'sop.view',
            'support.view', 'support.create',
            'notification.view',
        ]);

        // Auditor (TP staff) — logs into tp-portal, not admin-portal;
        // scoped to only the companies their firm has an active TpHire for
        // (DocumentPolicy::manage(), TpAssignment* endpoints), never a
        // platform-wide company.view/company.list grant.
        $auditor->syncPermissions([
            'portal.tp.access',
            'document.view',
            'document.manage.assigned',
            'support.view', 'support.create',
            'notification.view',
        ]);
    }
}
