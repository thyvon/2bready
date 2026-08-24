<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Support\Models\SupportTicketMessage;
use App\Domain\User\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin SupportTicketMessage
 */
class SupportTicketMessageResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'support_ticket_id' => $this->support_ticket_id,
            'user_id' => $this->user_id,
            // The thread UI distinguishes company replies from team replies.
            'author_name' => $this->whenLoaded('author', function () {
                /** @var User $author */
                $author = $this->author;

                return $author->name;
            }),
            'author_is_team' => $this->whenLoaded('author', function () {
                /** @var User $author */
                $author = $this->author;

                return ! $author->hasAnyRole(['company_owner', 'company_member']);
            }),
            'message' => $this->message,
            'created_at' => $this->created_at,
        ];
    }
}
