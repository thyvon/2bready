<?php

declare(strict_types=1);

namespace App\Domain\Vault\Enums;

/**
 * Why a vault unlock session was closed (v3 §5.1). Auto-lock timeout is the
 * one enforced server-side (VaultAutoLockService reading
 * platform_settings.vault_auto_lock_minutes, seed 3); manual and role_change
 * are explicit lock calls. Mirrors the ERD CHECK constraint verbatim.
 */
enum VaultLockReason: string
{
    case Timeout = 'timeout';
    case Manual = 'manual';
    case RoleChange = 'role_change';
}
