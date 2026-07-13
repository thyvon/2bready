<?php

declare(strict_types=1);

namespace App\Domain\Journey\Models;

use App\Domain\Journey\Enums\MilestoneCompletionTrigger;
use App\Domain\User\Models\User;
use App\Support\Concerns\BelongsToCompany;
use App\Support\Concerns\HasUlid;
use Database\Factories\MilestoneCompletionFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property MilestoneCompletionTrigger $trigger
 *
 * @use HasFactory<MilestoneCompletionFactory>
 */
class MilestoneCompletion extends Model
{
    /** @use HasFactory<MilestoneCompletionFactory> */
    use BelongsToCompany, HasFactory, HasUlid, SoftDeletes;

    /** @return Factory<MilestoneCompletion> */
    protected static function newFactory(): Factory
    {
        return MilestoneCompletionFactory::new();
    }

    protected $fillable = [
        'company_id',
        'milestone_id',
        'completed_at',
        'completed_by_user_id',
        'trigger',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
            'trigger' => MilestoneCompletionTrigger::class,
        ];
    }

    /** @return BelongsTo<Milestone, $this> */
    public function milestone(): BelongsTo
    {
        return $this->belongsTo(Milestone::class);
    }

    /** @return BelongsTo<User, $this> */
    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by_user_id');
    }
}
