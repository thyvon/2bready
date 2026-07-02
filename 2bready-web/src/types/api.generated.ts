/**
 * AUTO-GENERATED — DO NOT EDIT
 *
 * Generated from the backend OpenAPI spec via:
 *   npm run generate:types
 *
 * To regenerate:
 *   1. Export the spec from the API:  sail artisan scramble:export --path=public/openapi.json
 *   2. Run from this repo:            npm run generate:types
 */

export type ApiResponse<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiError = {
  message: string;
  errors?: Record<string, string[]>;
};
