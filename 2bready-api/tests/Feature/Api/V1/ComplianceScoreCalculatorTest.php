<?php

declare(strict_types=1);

use App\Domain\Audit\Services\ComplianceScoreCalculator;
use App\Domain\Company\Models\Company;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Journey\Models\Journey;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\JourneyTemplate;
use App\Domain\Journey\Models\Milestone;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->calculator = app(ComplianceScoreCalculator::class);
});

function calculatorFixture(string $levelCode = 'L3'): array
{
    $company = Company::factory()->create();
    $template = JourneyTemplate::factory()->create();
    Journey::factory()->create(['company_id' => $company->id, 'journey_template_id' => $template->id]);
    $level = JourneyLevel::factory()->create(['journey_template_id' => $template->id, 'code' => $levelCode, 'pillar' => 'scale', 'sort_order' => 3]);

    return compact('company', 'level');
}

it('scores zero for a company with no verified documents at the level', function () {
    ['company' => $company, 'level' => $level] = calculatorFixture();
    $milestone = Milestone::factory()->create(['journey_level_id' => $level->id]);
    DocumentTemplate::factory()->create(['milestone_id' => $milestone->id]);

    expect($this->calculator->calculate($company, 'L3'))->toBe(['score' => 0, 'verified' => 0, 'required' => 1]);
});

it('scores full when every required template at the level is verified', function () {
    ['company' => $company, 'level' => $level] = calculatorFixture();
    $milestone = Milestone::factory()->create(['journey_level_id' => $level->id]);
    $template = DocumentTemplate::factory()->create(['milestone_id' => $milestone->id]);
    Document::factory()->verified()->create([
        'company_id' => $company->id,
        'document_template_id' => $template->id,
    ]);

    $result = $this->calculator->calculate($company, 'L3');
    expect($result['score'])->toBe(100);
});

it('scores proportionally across verified and missing templates', function () {
    ['company' => $company, 'level' => $level] = calculatorFixture();
    $milestone = Milestone::factory()->create(['journey_level_id' => $level->id]);
    $verifiedTemplate = DocumentTemplate::factory()->create(['milestone_id' => $milestone->id]);
    $missingTemplate = DocumentTemplate::factory()->create(['milestone_id' => $milestone->id]);
    Document::factory()->verified()->create([
        'company_id' => $company->id,
        'document_template_id' => $verifiedTemplate->id,
    ]);

    $result = $this->calculator->calculate($company, 'L3');
    expect($result['score'])->toBe(50);
    expect($result['verified'])->toBe(1);
    expect($result['required'])->toBe(2);
});

it('ignores non-required templates', function () {
    ['company' => $company, 'level' => $level] = calculatorFixture();
    $milestone = Milestone::factory()->create(['journey_level_id' => $level->id]);
    $optional = DocumentTemplate::factory()->create(['milestone_id' => $milestone->id, 'is_required' => false]);

    $result = $this->calculator->calculate($company, 'L3');
    expect($result['required'])->toBe(0);
    expect($result['score'])->toBe(0);
});

it('ignores templates at other levels', function () {
    ['company' => $company] = calculatorFixture();
    $otherTemplate = JourneyTemplate::factory()->create();
    $otherLevel = JourneyLevel::factory()->create(['journey_template_id' => $otherTemplate->id, 'code' => 'L2', 'pillar' => 'comply', 'sort_order' => 2]);
    $milestone = Milestone::factory()->create(['journey_level_id' => $otherLevel->id]);
    DocumentTemplate::factory()->create(['milestone_id' => $milestone->id]);

    expect($this->calculator->calculate($company, 'L3'))->toBe(['score' => 0, 'verified' => 0, 'required' => 0]);
});

it('returns zero for a company with no journey', function () {
    $company = Company::factory()->create();

    expect($this->calculator->calculate($company, 'L3'))->toBe(['score' => 0, 'verified' => 0, 'required' => 0]);
});
