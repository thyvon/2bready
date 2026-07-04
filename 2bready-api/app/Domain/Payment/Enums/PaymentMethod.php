<?php

declare(strict_types=1);

namespace App\Domain\Payment\Enums;

enum PaymentMethod: string
{
    case Stripe = 'stripe';
    case ManualBankTransfer = 'manual_bank_transfer';
}
