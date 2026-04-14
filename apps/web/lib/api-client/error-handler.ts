import { ApiError } from "./types";

/**
 * Check if error should be logged (skip 401 and 404 errors)
 * 401 - authentication errors are expected
 * 404 - resource not found is expected (e.g., product doesn't exist)
 */
export function shouldLogError(status: number): boolean {
  return status !== 401 && status !== 404;
}

/**
 * Check if error should be logged as warning (404 Not Found)
 */
export function shouldLogWarning(status: number): boolean {
  return status === 404;
}

/**
 * Parse error response from API
 */
export async function parseErrorResponse(response: Response): Promise<{
  errorText: string;
  errorData: unknown;
}> {
  let errorText = '';
  let errorData: unknown = null;
  
  try {
    const text = await response.text();
    errorText = text || '';
    
    // Try to parse as JSON
    if (errorText && errorText.trim().startsWith('{')) {
      try {
        errorData = JSON.parse(errorText);
      } catch {
        // If JSON parse fails, use text as is
      }
    }
  } catch {
    // If reading response fails, use empty values
  }
  
  return { errorText, errorData };
}

function stringifyDetailPart(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Build a readable message from Problem+JSON / ad-hoc API bodies (detail can be string | object | array).
 */
function messageFromErrorPayload(errorData: unknown, fallbackText: string, response: Response): string {
  if (errorData && typeof errorData === 'object' && !Array.isArray(errorData)) {
    const o = errorData as Record<string, unknown>;

    const detail = o.detail;
    if (typeof detail === 'string' && detail.trim()) return detail.trim();
    if (Array.isArray(detail)) {
      const joined = detail.map(stringifyDetailPart).filter(Boolean).join('; ');
      if (joined) return joined;
    }
    if (detail !== null && detail !== undefined && typeof detail === 'object') {
      const s = stringifyDetailPart(detail);
      if (s && s !== '{}') return s;
    }

    if (typeof o.message === 'string' && o.message.trim()) return o.message.trim();
    if (typeof o.title === 'string' && o.title.trim()) return o.title.trim();
  }

  const trimmed = fallbackText?.trim() ?? '';
  if (trimmed) return trimmed;

  return `API Error: ${response.status} ${response.statusText || ''}`.trim();
}

/**
 * Create API error from response
 */
export function createApiError(
  response: Response,
  errorText: string,
  errorData: unknown
): ApiError {
  const errorMessage = messageFromErrorPayload(errorData, errorText, response);

  return new ApiError(
    errorMessage,
    response.status,
    response.statusText || '',
    errorData
  );
}








