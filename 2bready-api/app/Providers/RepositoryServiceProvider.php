<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Repository bindings go here as domains are built out.
        // Example:
        // $this->app->bind(
        //     \App\Domain\Company\Contracts\CompanyRepositoryInterface::class,
        //     \App\Domain\Company\Repositories\EloquentCompanyRepository::class,
        // );
    }
}
