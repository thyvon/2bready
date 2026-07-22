<?php

declare(strict_types=1);

namespace App\Domain\DataRoom\Exceptions;

use RuntimeException;

/** Thrown by VerifyDataRoomAccessAction — caught by PublicDataRoomController and turned into a 404. */
class DataRoomLinkInvalidException extends RuntimeException {}
