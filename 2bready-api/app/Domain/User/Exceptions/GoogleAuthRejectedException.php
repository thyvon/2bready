<?php

declare(strict_types=1);

namespace App\Domain\User\Exceptions;

use RuntimeException;

/** Thrown by HandleGoogleCallbackAction — caught by GoogleAuthController and turned into a 403. */
class GoogleAuthRejectedException extends RuntimeException {}
