<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Journey\Enums\MilestoneCompletionTrigger;
use App\Domain\Journey\Models\Journey;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\JourneyTemplate;
use App\Domain\Journey\Models\Milestone;
use App\Domain\Journey\Models\MilestoneCompletion;
use App\Domain\Journey\Services\MilestoneUnlockRuleEngine;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/** @return array{company: Company, milestone: Milestone} */
function engineFixture(bool $bypassed = false): array
{
    $company = Company::factory()->create([
        'bypass_flags' => $bypassed ? ['company_internal_rules' => true] : [],
    ]);
    $template = JourneyTemplate::factory()->create();
    Journey::factory()->create(['company_id' => $company->id, 'journey_template_id' => $template->id]);
    $level = JourneyLevel::factory()->create(['journey_template_id' => $template->id, 'code' => 'L1', 'pillar' => 'comply', 'sort_order' => 1]);
    $milestone = Milestone::factory()->create(['journey_level_id' => $level->id, 'sort_order' => 1]);
    DocumentTemplate::factory()->create([
        'milestone_id' => $milestone->id,
        'name' => 'Company Internal Rules',
        'bypass_key' => 'company_internal_rules',
        'is_required' => true,
    ]);

    return compact('company', 'milestone');
}

it('treats a milestone as satisfied when a company holds a completion record', function () {
    ['company' => $company, 'milestone' => $milestone] = engineFixture();
    MilestoneCompletion::create([
        'company_id' => $company->id,
        'milestone_id' => $milestone->id,
        'completed_at' => now(),
        'trigger' => MilestoneCompletionTrigger::AdminSignoff,
    ]);

    expect(app(MilestoneUnlockRuleEngine::class)->isMilestoneSatisfied($milestone, $company))->toBeTrue();
});

it('treats a fully-bypassed milestone as satisfied without any completion record', function () {
    ['company' => $company, 'milestone' => $milestone] = engineFixture(bypassed: true);

    expect(app(MilestoneUnlockRuleEngine::class)->isMilestoneSatisfied($milestone, $company))->toBeTrue();
});

it('does not treat a non-bypassed company milestone as satisfied without a completion', function () {
    ['company' => $company, 'milestone' => $milestone] = engineFixture();

    expect(app(MilestoneUnlockRuleEngine::class)->isMilestoneSatisfied($milestone, $company))->toBeFalse();
});

it('does not bypass a milestone when the company has the flag but the document is not bypassable', function () {
    $company = Company::factory()->create(['bypass_flags' => ['company_internal_rules' => true]]);
    $template = JourneyTemplate::factory()->create();
    Journey::factory()->create(['company_id' => $company->id, 'journey_template_id' => $template->id]);
    $level = JourneyLevel::factory()->create(['journey_template_id' => $template->id, 'code' => 'L1', 'pillar' => 'comply', 'sort_order' => 1]);
    $milestone = Milestone::factory()->create(['journey_level_id' => $level->id, 'sort_order' => 1]);
    // A required doc that has no bypass_key — never waivable.
    DocumentTemplate::factory()->create([
        'milestone_id' => $milestone->id,
        'name' => 'MoC Registration',
        'bypass_key' => null,
        'is_required' => true,
    ]);

    expect(app(MilestoneUnlockRuleEngine::class)->isMilestoneSatisfied($milestone, $company))->toBeFalse();
});

it('does not bypass when the document is waivable but the company does not hold the flag', function () {
    ['company' => $company, 'milestone' => $milestone] = engineFixture();

    expect(app(MilestoneUnlockRuleEngine::class)->isMilestoneSatisfied($milestone, $company))->toBeFalse();
});

it('ignores non-required templates when evaluating a bypass', function () {
    $company = Company::factory()->create(['bypass_flags' => ['company_internal_rules' => true]]);
    $template = JourneyTemplate::factory()->create();
    Journey::factory()->create(['company_id' => $company->id, 'journey_template_id' => $template->id]);
    $level = JourneyLevel::factory()->create(['journey_template_id' => $template->id, 'code' => 'L1', 'pillar' => 'comply', 'sort_order' => 1]);
    $milestone = Milestone::factory()->create(['journey_level_id' => $level->id, 'sort_order' => 1]);
    DocumentTemplate::factory()->create([
        'milestone_id' => $milestone->id,
        'name' => 'Company Internal Rules',
        'bypass_key' => 'company_internal_rules',
        'is_required' => true,
    ]);
    // Optional doc with no bypass — must not block the waived milestone.
    DocumentTemplate::factory()->create([
        'milestone_id' => $milestone->id,
        'name' => 'Optional Annex',
        'bypass_key' => null,
        'is_required' => false,
    ]);

    expect(app(MilestoneUnlockRuleEngine::class)->isMilestoneSatisfied($milestone, $company))->toBeTrue();
});
