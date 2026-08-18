<?php

declare(strict_types=1);

namespace App\Domain\Vault\Exceptions;

use App\Exceptions\DomainException;

class VaultPinNotSetException extends DomainException
{
    public function __construct()
    {
        parent::__construct('No vault PIN is set for this company yet.');
    }
}
