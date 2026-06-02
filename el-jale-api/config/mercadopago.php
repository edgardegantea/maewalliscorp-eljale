<?php

return [
    'access_token'       => env('MP_ACCESS_TOKEN'),
    'public_key'         => env('MP_PUBLIC_KEY'),
    'webhook_secret'     => env('MP_WEBHOOK_SECRET'),
    'platform_fee_pct'   => (float) env('MP_PLATFORM_FEE_PERCENT', 10),
    'success_url'        => env('MP_SUCCESS_URL'),
    'failure_url'        => env('MP_FAILURE_URL'),
    'pending_url'        => env('MP_PENDING_URL'),
];
