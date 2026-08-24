<?php

declare(strict_types=1);

namespace App\Exceptions;

/**
 * Thrown by CreateDataRoomLinkAction when the company doesn't meet the
 * data-room entitlement (active Enterprise subscription + fully verified
 * L4 evidence). Rendered as a 422 by the DomainException handler.
 */
class DataRoomLinkForbiddenException extends DomainException {}
