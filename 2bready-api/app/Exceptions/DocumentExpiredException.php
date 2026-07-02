<?php

declare(strict_types=1);

namespace App\Exceptions;

class DocumentExpiredException extends DomainException
{
    public function __construct(string $documentName)
    {
        parent::__construct("Document \"{$documentName}\" has expired and cannot be used for compliance verification.");
    }
}
