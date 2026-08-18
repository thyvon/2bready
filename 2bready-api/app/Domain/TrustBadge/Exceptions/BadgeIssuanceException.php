<?php

declare(strict_types=1);

namespace App\Domain\TrustBadge\Exceptions;

use RuntimeException;

/**
 * Thrown by IssueTrustBadgeAction when an approved audit can't be mapped back
 * to a real taxonomy row (the company's journey or its audited level is
 * missing). The trust_badges.journey_level_id column is NOT NULL, so a
 * badge can never be issued without it — an approved audit for a journey-less
 * company is a domain-inconsistent state and fails loudly rather than at the
 * DB constraint layer.
 */
class BadgeIssuanceException extends RuntimeException {}
