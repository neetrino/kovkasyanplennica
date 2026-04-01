/**
 * Vacancy cover images must be stored in Cloudflare R2 via the admin upload endpoint.
 * Rejects embedded data URLs and URLs that are not served from this project's R2 public base.
 */

const R2_PUBLIC_BASE = process.env.R2_PUBLIC_URL?.replace(/\/$/, "") ?? "";

const VALIDATION_ERROR_TYPE = "https://api.shop.am/problems/validation-error";

function validationError(detail: string): never {
  throw {
    status: 400,
    type: VALIDATION_ERROR_TYPE,
    title: "Validation Error",
    detail,
  };
}

/**
 * Returns `null` for empty input, or a trimmed URL that points at R2 storage.
 * @throws plain object with `status: 400` for invalid values
 */
export function normalizeVacancyImageUrlForStorage(
  input: string | null | undefined
): string | null {
  if (input === undefined || input === null) {
    return null;
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("data:")) {
    validationError(
      "Vacancy image must be uploaded to R2 (use file upload in admin). Embedded data URLs are not allowed."
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    validationError("Invalid image URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    validationError("Image URL must use http or https.");
  }

  if (R2_PUBLIC_BASE) {
    if (!trimmed.startsWith(`${R2_PUBLIC_BASE}/`)) {
      validationError(
        "Vacancy image must use the project R2 public URL (upload the file via admin)."
      );
    }
  } else if (!parsed.pathname.includes("/vacancies/")) {
    validationError(
      "Vacancy image path must include the vacancies/ prefix (upload via admin to R2)."
    );
  }

  return trimmed;
}
