const DEFAULT_REDIRECT = "/dashboard";

export function getSafeInternalRedirect(
  value: string | null | undefined,
  fallback = DEFAULT_REDIRECT,
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  if (/[\\\r\n\u0000-\u001f\u007f]/.test(value)) {
    return fallback;
  }

  return value;
}

