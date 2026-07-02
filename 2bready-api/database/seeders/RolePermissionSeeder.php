<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Internal 2bReady roles (no company_id — bypass BelongsToCompany scope)
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'staff', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'finance', 'guard_name' => 'web']);

        // External roles
        Role::firstOrCreate(['name' => 'company_owner', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'company_member', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'auditor', 'guard_name' => 'web']);
    }
}
