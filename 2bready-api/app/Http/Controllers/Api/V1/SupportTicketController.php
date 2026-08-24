<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Company\Models\Company;
use App\Domain\Support\Actions\AssignSupportTicketAction;
use App\Domain\Support\Actions\CreateSupportTicketAction;
use App\Domain\Support\Actions\ReplySupportTicketAction;
use App\Domain\Support\Actions\UpdateSupportTicketStatusAction;
use App\Domain\Support\Models\SupportTicket;
use App\Domain\User\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Support\AssignSupportTicketRequest;
use App\Http\Requests\Api\V1\Support\StoreSupportTicketMessageRequest;
use App\Http\Requests\Api\V1\Support\StoreSupportTicketRequest;
use App\Http\Requests\Api\V1\Support\UpdateSupportTicketStatusRequest;
use App\Http\Resources\Api\V1\SupportTicketMessageResource;
use App\Http\Resources\Api\V1\SupportTicketResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * One endpoint set serving both portals: company users see their own
 * tickets (BelongsToCompany scope), admin/staff see the whole queue and get
 * the extra assign/status powers via the policy.
 */
class SupportTicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', SupportTicket::class);

        $query = SupportTicket::query()
            ->with(['company', 'creator', 'assignee'])
            ->withCount('messages')
            ->latest();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        // Internal-only narrowing (the back-office "one company's tickets"
        // view) — same deliberate-filter pattern as PaymentController::index.
        if ($companyId = $request->query('company_id')) {
            $query->where('company_id', $companyId);
        }

        return ApiResponse::success(SupportTicketResource::collection($query->get()));
    }

    public function store(StoreSupportTicketRequest $request, CreateSupportTicketAction $action): JsonResponse
    {
        $this->authorize('create', SupportTicket::class);

        $ticket = $action->execute(
            Company::findOrFail($request->user()->current_company_id),
            $request->user(),
            $request->validated('category'),
            $request->validated('subject'),
            $request->validated('message'),
        );

        return ApiResponse::created(new SupportTicketResource($ticket));
    }

    public function show(Request $request, SupportTicket $ticket): JsonResponse
    {
        $this->authorize('view', $ticket);

        $ticket->load([
            'creator',
            'assignee',
            'messages.author.roles',
        ]);

        return ApiResponse::success(new SupportTicketResource($ticket));
    }

    public function reply(StoreSupportTicketMessageRequest $request, SupportTicket $ticket, ReplySupportTicketAction $action): JsonResponse
    {
        $this->authorize('reply', $ticket);

        $reply = $action->execute($ticket, $request->user(), $request->validated('message'));

        // A reply is a creation — 201 like every other POST resource here.
        return ApiResponse::created(new SupportTicketMessageResource($reply->load('author.roles')));
    }

    public function assign(AssignSupportTicketRequest $request, SupportTicket $ticket, AssignSupportTicketAction $action): JsonResponse
    {
        $this->authorize('manage', SupportTicket::class);

        $assignee = $request->validated('assigned_to')
            ? User::findOrFail($request->validated('assigned_to'))
            : null;

        return ApiResponse::success(new SupportTicketResource(
            $action->execute($ticket, $assignee)->load(['company', 'creator', 'assignee']),
        ));
    }

    public function updateStatus(UpdateSupportTicketStatusRequest $request, SupportTicket $ticket, UpdateSupportTicketStatusAction $action): JsonResponse
    {
        $this->authorize('close', $ticket);

        return ApiResponse::success(new SupportTicketResource(
            $action->execute($ticket, $request->validated('status'), $request->user())
                ->load(['company', 'creator', 'assignee']),
        ));
    }
}
