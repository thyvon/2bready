<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\DataRoom\Models\DataRoomLink;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The one-time plaintext PIN is never stored on the model (only pin_hash
 * is), so it can't come from $this->pin the way every other field does —
 * it's passed in explicitly by DataRoomController::store() right after
 * CreateDataRoomLinkAction returns it, and left null everywhere else
 * (GET/DELETE construct this resource with one argument, so `pin` stays
 * absent from those responses).
 *
 * A constructor param — not JsonResource::additional(), which
 * jsonSerialize() never merges unless Laravel itself builds the top-level
 * HTTP response for the resource, and ApiResponse::created() nests this
 * inside response()->json(['data' => ...]) instead — keeps the whole shape
 * inside toArray(). That in turn is what lets Scramble's static analysis
 * infer a real object schema for the create response instead of falling
 * back to an opaque `mixed`, which is what happened when this used to be a
 * hand-merged array assembled in the controller.
 *
 * @mixin DataRoomLink
 */
class DataRoomLinkResource extends JsonResource
{
    public function __construct($resource, private readonly ?string $pin = null)
    {
        parent::__construct($resource);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'token' => $this->token,
            'url' => rtrim((string) config('app.frontend_url'), '/').'/data-room/'.$this->token,
            'expires_at' => $this->expires_at,
            'status' => $this->status()->value,
            'pin' => $this->when($this->pin !== null, fn (): string => (string) $this->pin),
        ];
    }
}
