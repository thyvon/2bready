<?php

declare(strict_types=1);

namespace App\Exceptions;

use App\Domain\Package\Models\Package;

/**
 * Thrown by SubscribeToPackageAction — the controller turns this into a 409.
 * The company already has a pending/active subscription covering this
 * journey level; stacking another would double-pay one entitlement.
 */
class DuplicateSubscriptionException extends DomainException
{
    public function __construct(Package $package)
    {
        parent::__construct(
            "This company already has a live subscription for this journey level ({$package->name}). Cancel it or let it expire before subscribing again."
        );
    }
}
