<?php

declare(strict_types=1);

namespace App\Domain\Shared\Services;

use App\Domain\Shared\Models\PlatformSetting;
use App\Domain\User\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Platform branding (v3 §0.5 spirit: business-tunable values in
 * platform_settings, never hardcoded). The logo is a private asset: stored
 * on the non-public local disk (same filesystem rule as compliance
 * documents — system assets stay on "local" per config/filesystems.php) and
 * ONLY ever served through a short-lived signed temporaryUrl, never a plain
 * public URL.
 *
 * The setting value is `{path}` — the generated URL is always derived fresh
 * because signed URLs expire; persisting a URL would bake in expiry.
 */
class BrandingService
{
    private const SETTING_KEY = 'branding.logo';

    private const STORAGE_PREFIX = 'branding/logo';

    public function logoUrl(): ?string
    {
        $path = $this->logoPath();

        if ($path === null) {
            return null;
        }

        return Storage::disk('local')->temporaryUrl($path, now()->addMinutes(10));
    }

    /**
     * Replaces any previous logo: writes the new file first, then swaps the
     * setting — a failure mid-write leaves the old logo in place rather
     * than a dangling path. The old file is deleted only after the new
     * setting is persisted.
     */
    public function uploadLogo(UploadedFile $file, ?User $updatedBy = null): PlatformSetting
    {
        $extension = $file->getClientOriginalExtension();
        $path = self::STORAGE_PREFIX.'.'.$extension;

        Storage::disk('local')->putFileAs('branding', $file, 'logo.'.$extension, 'private');

        $oldPath = $this->logoPath();
        $setting = PlatformSetting::query()->updateOrCreate(
            ['key' => self::SETTING_KEY],
            ['value' => ['path' => $path], 'group' => 'branding', 'updated_by' => $updatedBy?->id],
        );

        if ($oldPath !== null && $oldPath !== $path && Storage::disk('local')->exists($oldPath)) {
            Storage::disk('local')->delete($oldPath);
        }

        return $setting;
    }

    public function deleteLogo(?User $updatedBy = null): void
    {
        $path = $this->logoPath();

        PlatformSetting::query()->where('key', self::SETTING_KEY)->delete();

        if ($path !== null && Storage::disk('local')->exists($path)) {
            Storage::disk('local')->delete($path);
        }
    }

    private function logoPath(): ?string
    {
        $setting = PlatformSetting::query()->where('key', self::SETTING_KEY)->first();

        if (! $setting instanceof PlatformSetting) {
            return null;
        }

        $value = $setting->getAttribute('value');

        if (! is_array($value)) {
            return null;
        }

        $path = $value['path'] ?? null;

        return is_string($path) ? $path : null;
    }
}
