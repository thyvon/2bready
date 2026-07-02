<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Journey Levels
    |--------------------------------------------------------------------------
    | Defines the compliance journey level codes and their minimum score
    | thresholds required to unlock each level.
    */
    'journey_levels' => [
        'L1' => ['code' => 'L1', 'name' => 'Comply',   'min_score' => 0],
        'L2' => ['code' => 'L2', 'name' => 'Build',    'min_score' => 25],
        'L3' => ['code' => 'L3', 'name' => 'Scale',    'min_score' => 50],
        'L4' => ['code' => 'L4', 'name' => 'Lead',     'min_score' => 80],
    ],

    /*
    |--------------------------------------------------------------------------
    | Score Thresholds
    |--------------------------------------------------------------------------
    | Compliance score bands used for dashboard indicators and audit routing.
    */
    'score_thresholds' => [
        'critical' => 25,
        'warning' => 50,
        'good' => 75,
        'excellent' => 90,
    ],

    /*
    |--------------------------------------------------------------------------
    | Document Settings
    |--------------------------------------------------------------------------
    */
    'documents' => [
        'max_upload_size_mb' => 25,
        'signed_url_ttl_minutes' => 60,
        'allowed_mime_types' => [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
    ],
];
