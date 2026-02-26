/**
 * Standard API response shapes.
 * All backend responses follow { success, data?, error? } convention.
 */

// ---------------------------------------------------------------------------
// Success envelopes
// ---------------------------------------------------------------------------

export interface ApiEnvelope<T> {
  success: true;
  data: T;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiPaginatedEnvelope<T> {
  success: true;
  data: T[];
  meta: PaginatedMeta;
}

// ---------------------------------------------------------------------------
// Error envelope
// ---------------------------------------------------------------------------

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown[];
}

export interface ApiErrorEnvelope {
  success: false;
  error: ApiErrorBody;
}

// ---------------------------------------------------------------------------
// Union type: any response from the API
// ---------------------------------------------------------------------------

export type ApiResponse<T> = ApiEnvelope<T> | ApiErrorEnvelope;

// ---------------------------------------------------------------------------
// Backward-compatible re-exports
// ---------------------------------------------------------------------------

/** @deprecated Use ApiErrorEnvelope instead */
export type ApiError = ApiErrorEnvelope;

/** @deprecated Use ApiPaginatedEnvelope instead */
export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
