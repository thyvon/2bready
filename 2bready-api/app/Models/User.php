<?php

declare(strict_types=1);

namespace App\Models;

// Thin alias so Laravel internals (Sanctum, factories, auth config) resolve App\Models\User
// while all domain logic lives in App\Domain\User\Models\User.
class User extends \App\Domain\User\Models\User {}
