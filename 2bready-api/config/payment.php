<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Manual bank transfer instructions
    |--------------------------------------------------------------------------
    |
    | Shown to a company after they choose "Bank transfer" at checkout, so they
    | know where to send funds and what reference to quote.
    |
    */
    'bank_transfer' => [
        'bank_name' => env('BANK_TRANSFER_BANK_NAME', 'ABA Bank'),
        'account_name' => env('BANK_TRANSFER_ACCOUNT_NAME', '2bReady Co., Ltd.'),
        'account_number' => env('BANK_TRANSFER_ACCOUNT_NUMBER', '000 123 456'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Stripe
    |--------------------------------------------------------------------------
    |
    | Not wired to the real Stripe SDK yet — FakeStripeGateway reads these only
    | to decide whether it's "configured" for a clearer error than a blind API
    | call would give. Swap FakeStripeGateway for a real implementation once
    | test-mode keys are supplied.
    |
    */
    'stripe' => [
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
    ],

];
