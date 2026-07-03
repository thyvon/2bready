<?php

declare(strict_types=1);

namespace App\Domain\Shared\Services;

use App\Domain\Shared\Models\PlatformSetting;
use App\Domain\User\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

/**
 * Generic admin-editable key/value store — v3 §0.5: business-tunable values
 * (thresholds, percentages, timeouts) must live here, never as a hardcoded
 * literal in domain code. Not a domain of its own, deliberately kept this thin.
 */
class PlatformSettingService
{
    private const CACHE_PREFIX = 'platform_setting:';

    public function get(string $key, mixed $default = null): mixed
    {
        return Cache::rememberForever(self::CACHE_PREFIX.$key, function () use ($key, $default) {
            $setting = PlatformSetting::query()->where('key', $key)->first();

            return $setting instanceof PlatformSetting ? $setting->value : $default;
        });
    }

    public function set(string $key, mixed $value, string $group = 'general', ?User $updatedBy = null): PlatformSetting
    {
        $setting = PlatformSetting::query()->updateOrCreate(
            ['key' => $key],
            ['value' => $value, 'group' => $group, 'updated_by' => $updatedBy?->id],
        );

        Cache::forget(self::CACHE_PREFIX.$key);

        return $setting;
    }

    /** @return Collection<int, PlatformSetting> */
    public function all(): Collection
    {
        return PlatformSetting::query()->orderBy('group')->orderBy('key')->get();
    }
}
