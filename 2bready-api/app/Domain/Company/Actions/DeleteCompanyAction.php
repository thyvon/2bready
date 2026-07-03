<?php

declare(strict_types=1);

namespace App\Domain\Company\Actions;

use App\Domain\Company\Models\Company;

class DeleteCompanyAction
{
    public function execute(Company $company): void
    {
        $company->delete();
    }
}
