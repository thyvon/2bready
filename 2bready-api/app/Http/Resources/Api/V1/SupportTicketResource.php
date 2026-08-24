<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Company\Models\Company;
use App\Domain\Support\Models\SupportTicket;
use App\Domain\User\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin SupportTicket
 */
class SupportTicketResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'company' => $this->whenLoaded('company', function () {
                /** @var Company $company */
                $company = $this->company;

                return ['id' => $company->id, 'name' => $company->name];
            }),
            'created_by' => $this->created_by,
            'creator_name' => $this->whenLoaded('creator', function () {
                /** @var User $creator */
                $creator = $this->creator;

                return $creator->name;
            }),
            'assigned_to' => $this->assigned_to,
            'assignee_name' => $this->whenLoaded('assignee', function () {
                /** @var User|null $assignee */
                $assignee = $this->assignee;

                return $assignee?->name;
            }),
            'category' => $this->category->value,
            'subject' => $this->subject,
            'status' => $this->status->value,
            // Reply count for the queue list — only loaded where the
            // controller asks for it (withCount), null otherwise.
            'messages_count' => $this->whenCounted('messages'),
            'messages' => SupportTicketMessageResource::collection($this->whenLoaded('messages')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
