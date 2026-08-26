<?php

declare(strict_types=1);

namespace App\Domain\SignOff\Actions;

use App\Domain\Company\Models\Company;
use App\Domain\SignOff\Models\SignoffDocument;
use App\Domain\SignOff\Models\SignoffDocumentUser;
use App\Domain\SignOff\Notifications\SignoffDocumentSharedNotification;
use App\Domain\User\Models\User;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Facades\DB;

/**
 * Emails a verified document to the selected staff members and tracks each
 * delivery. Only NEW assignments are emailed — re-sending to someone
 * already on the list never re-spams them, and their signed state is kept.
 */
class SendSignoffDocumentToStaffAction
{
    /**
     * @param  list<string>  $userIds
     * @return EloquentCollection<int, SignoffDocumentUser> all staff rows for the document
     */
    /**
     * @param  list<string>  $userIds
     * @return EloquentCollection<int, SignoffDocumentUser>
     */
    public function execute(SignoffDocument $document, Company $company, array $userIds, User $sentBy): EloquentCollection
    {
        return DB::transaction(function () use ($document, $company, $userIds, $sentBy) {
            $signoffUrl = rtrim((string) config('app.frontend_url'), '/').'/signoff-documents';

            foreach ($userIds as $userId) {
                /** @var SignoffDocumentUser|null $row */
                $row = SignoffDocumentUser::query()
                    ->where('signoff_document_id', $document->id)
                    ->where('user_id', $userId)
                    ->first();

                if ($row !== null) {
                    continue; // already assigned — keep state, stay silent
                }

                /** @var User $staff */
                $staff = User::query()->findOrFail($userId);

                $row = SignoffDocumentUser::create([
                    'signoff_document_id' => $document->id,
                    'company_id' => $company->id,
                    'user_id' => $staff->id,
                    'emailed_at' => now(),
                ]);

                $staff->notify(new SignoffDocumentSharedNotification(
                    companyName: $company->name,
                    categoryLabel: ucfirst($document->category->value),
                    title: $document->title,
                    senderName: $sentBy->name,
                    signoffUrl: $signoffUrl,
                ));
            }

            return $document->users()->with('user')->get();
        });
    }
}
