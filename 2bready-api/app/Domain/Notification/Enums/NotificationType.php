<?php

declare(strict_types=1);

namespace App\Domain\Notification\Enums;

enum NotificationType: string
{
    case PaymentConfirmed = 'payment_confirmed';
    case PaymentRejected = 'payment_rejected';
    case AuditApproved = 'audit_approved';
    case DocumentVerified = 'document_verified';
    case DocumentExpired = 'document_expired';
    case SubscriptionCancelled = 'subscription_cancelled';

    public function label(): string
    {
        return match ($this) {
            self::PaymentConfirmed => 'Payment Confirmed',
            self::PaymentRejected => 'Payment Rejected',
            self::AuditApproved => 'Audit Approved',
            self::DocumentVerified => 'Document Verified',
            self::DocumentExpired => 'Document Expired',
            self::SubscriptionCancelled => 'Subscription Cancelled',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::PaymentConfirmed => 'payment',
            self::PaymentRejected => 'payment',
            self::AuditApproved => 'audit',
            self::DocumentVerified => 'document',
            self::DocumentExpired => 'document',
            self::SubscriptionCancelled => 'subscription',
        };
    }
}
