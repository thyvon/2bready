<?php

declare(strict_types=1);

namespace App\Domain\Shared\Services;

use App\Domain\Shared\Models\PlatformSetting;
use App\Domain\User\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Platform branding (v3 §0.5 spirit: business-tunable values in
 * platform_settings, never hardcoded). Logos are private assets: stored
 * on the non-public local disk (same filesystem rule as compliance
 * documents — system assets stay on "local" per config/filesystems.php) and
 * ONLY ever served through a short-lived signed temporaryUrl, never a plain
 * public URL.
 *
 * Four slots cover the two theme modes × two placements:
 *   main  (`branding.logo`)           light-mode headers/sidebars/auth
 *   dark  (`branding.logo_dark`)      dark-mode headers/sidebars
 *   footer (`branding.logo_footer`)   footers in light mode
 *   footer_dark (`branding.logo_footer_dark`) footers in dark mode
 *
 * The 'main' slot keeps the original setting key AND storage path
 * (`branding/logo.{ext}`) so existing installs need no data migration.
 *
 * Each setting value is `{path}` — the generated URL is always derived fresh
 * because signed URLs expire; persisting a URL would bake in expiry.
 */
class BrandingService
{
    /** @var array<string, array{key: string, file: string}> */
    private const SLOTS = [
        'main' => ['key' => 'branding.logo', 'file' => 'logo'],
        'dark' => ['key' => 'branding.logo_dark', 'file' => 'logo-dark'],
        'footer' => ['key' => 'branding.logo_footer', 'file' => 'logo-footer'],
        'footer_dark' => ['key' => 'branding.logo_footer_dark', 'file' => 'logo-footer-dark'],
    ];

    /** @return list<string> */
    public static function slots(): array
    {
        return array_keys(self::SLOTS);
    }

    /**
     * All four slots in one call — the shape the public branding endpoint
     * and every portal's logo hook consume. Null per slot when unset.
     *
     * @return array{light: string|null, dark: string|null, footer: string|null, footerDark: string|null}
     */
    public function brandingUrls(): array
    {
        return [
            'light' => $this->logoUrl('main'),
            'dark' => $this->logoUrl('dark'),
            'footer' => $this->logoUrl('footer'),
            'footerDark' => $this->logoUrl('footer_dark'),
        ];
    }

    public function logoUrl(string $slot = 'main'): ?string
    {
        $path = $this->logoPath($slot);

        if ($path === null) {
            return null;
        }

        return Storage::disk('local')->temporaryUrl($path, now()->addMinutes(10));
    }

    /**
     * Replaces any previous logo in the slot: writes the new file first,
     * then swaps the setting — a failure mid-write leaves the old logo in
     * place rather than a dangling path. The old file is deleted only after
     * the new setting is persisted.
     */
    public function uploadLogo(UploadedFile $file, string $slot = 'main', ?User $updatedBy = null): PlatformSetting
    {
        $definition = $this->slotDefinition($slot);
        $extension = $file->getClientOriginalExtension();
        $path = 'branding/'.$definition['file'].'.'.$extension;

        Storage::disk('local')->putFileAs('branding', $file, $definition['file'].'.'.$extension, 'private');

        $oldPath = $this->logoPath($slot);
        $setting = PlatformSetting::query()->updateOrCreate(
            ['key' => $definition['key']],
            ['value' => ['path' => $path], 'group' => 'branding', 'updated_by' => $updatedBy?->id],
        );

        if ($oldPath !== null && $oldPath !== $path && Storage::disk('local')->exists($oldPath)) {
            Storage::disk('local')->delete($oldPath);
        }

        return $setting;
    }

    public function deleteLogo(string $slot = 'main', ?User $updatedBy = null): void
    {
        $definition = $this->slotDefinition($slot);
        $path = $this->logoPath($slot);

        PlatformSetting::query()->where('key', $definition['key'])->delete();

        if ($path !== null && Storage::disk('local')->exists($path)) {
            Storage::disk('local')->delete($path);
        }
    }

    /**
     * @return array{key: string, file: string}
     */
    private function slotDefinition(string $slot): array
    {
        if (! isset(self::SLOTS[$slot])) {
            throw new \InvalidArgumentException("Unsupported branding slot: {$slot}");
        }

        return self::SLOTS[$slot];
    }

    private function logoPath(string $slot): ?string
    {
        $setting = PlatformSetting::query()->where('key', $this->slotDefinition($slot)['key'])->first();

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
