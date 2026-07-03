<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domain\Company\Contracts\CompanyRepositoryInterface;
use App\Domain\Company\Repositories\EloquentCompanyRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(CompanyRepositoryInterface::class, EloquentCompanyRepository::class);
    }
}
