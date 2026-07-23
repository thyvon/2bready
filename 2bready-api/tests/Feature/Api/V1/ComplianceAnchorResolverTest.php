<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Document\Services\ComplianceAnchorResolver;
use App\Domain\Journey\Models\Journey;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->resolver = app(ComplianceAnchorResolver::class);
});

it('defers entirely to the company anchor when effective_since is null', function () {
    $company = Company::factory()->create(['compliance_start_date' => '2023-01-01']);
    $journey = Journey::factory()->create(['company_id' => $company->id, 'activated_at' => now()]);
    $template = DocumentTemplate::factory()->create(['recurrence_type' => 'periodic_annual', 'effective_since' => null]);

    $anchor = $this->resolver->resolve($company, $journey, $template);

    expect($anchor->toDateString())->toBe('2023-01-01');
});

it('falls back to journey activation when compliance_start_date is not set', function () {
    $company = Company::factory()->create(['compliance_start_date' => null]);
    $journey = Journey::factory()->create(['company_id' => $company->id, 'activated_at' => Carbon::parse('2025-06-01')]);
    $template = DocumentTemplate::factory()->create(['recurrence_type' => 'periodic_annual', 'effective_since' => null]);

    $anchor = $this->resolver->resolve($company, $journey, $template);

    expect($anchor->toDateString())->toBe('2025-06-01');
});

it('lets effective_since push the anchor later than the company anchor', function () {
    $company = Company::factory()->create(['compliance_start_date' => '2020-01-01']);
    $journey = Journey::factory()->create(['company_id' => $company->id, 'activated_at' => now()]);
    $template = DocumentTemplate::factory()->create(['recurrence_type' => 'periodic_annual', 'effective_since' => '2024-06-01']);

    $anchor = $this->resolver->resolve($company, $journey, $template);

    expect($anchor->toDateString())->toBe('2024-06-01');
});

it('never lets effective_since pull the anchor earlier than the company anchor', function () {
    $company = Company::factory()->create(['compliance_start_date' => '2023-01-01']);
    $journey = Journey::factory()->create(['company_id' => $company->id, 'activated_at' => now()]);
    // A template's own effective_since is only ever a floor — it must never
    // override a company's own, later compliance start date.
    $template = DocumentTemplate::factory()->create(['recurrence_type' => 'periodic_annual', 'effective_since' => '2018-01-01']);

    $anchor = $this->resolver->resolve($company, $journey, $template);

    expect($anchor->toDateString())->toBe('2023-01-01');
});

it('ignores the template row insertion date entirely', function () {
    // The old, replaced behavior used template.created_at as a floor — this
    // proves that's gone: a template created "now" must not clamp a real,
    // much-earlier compliance_start_date.
    $company = Company::factory()->create(['compliance_start_date' => '2019-01-01']);
    $journey = Journey::factory()->create(['company_id' => $company->id, 'activated_at' => now()]);
    $template = DocumentTemplate::factory()->create(['recurrence_type' => 'periodic_annual', 'effective_since' => null]);

    expect($template->created_at->greaterThan(Carbon::parse('2019-01-01')))->toBeTrue();

    $anchor = $this->resolver->resolve($company, $journey, $template);

    expect($anchor->toDateString())->toBe('2019-01-01');
});
