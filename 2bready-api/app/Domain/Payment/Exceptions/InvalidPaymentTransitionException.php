<?php

declare(strict_types=1);

namespace App\Domain\Payment\Exceptions;

use RuntimeException;

/** Thrown when a payment transition violates the lifecycle — the controller turns this into a 409. */
class InvalidPaymentTransitionException extends RuntimeException {}
