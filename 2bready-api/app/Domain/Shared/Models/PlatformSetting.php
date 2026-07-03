<?php

declare(strict_types=1);

namespace App\Domain\Shared\Models;

use App\Support\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Model;

class PlatformSetting extends Model
{
    use HasUlid;

    protected $fillable = [
        'key',
        'value',
        'group',
        'updated_by',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'value' => 'json',
        ];
    }
}
