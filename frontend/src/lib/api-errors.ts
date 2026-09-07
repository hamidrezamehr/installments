import axios from "axios";

/** Standardized error message extraction from any error thrown by the API layer */
export function getApiErrorMessage(
  err: unknown,
  fallback = "مشکلی پیش آمده است",
): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; detail?: string; errors?: Record<string, string[]> }
      | undefined;

    // Validation errors (422) — flatten all field errors
    if (data?.errors) {
      return Object.values(data.errors).flat().join("\n");
    }

    // API error with message
    if (data?.message) {
      return data.detail ? `${data.message} (${data.detail})` : data.message;
    }

    // HTTP status text fallback
    if (err.response?.status === 401) {
      return "احراز هویت ناموفق. لطفاً دوباره وارد شوید.";
    }

    if (err.response?.status === 404) {
      return "موردی یافت نشد.";
    }

    if (err.response?.statusText) {
      return `${err.response.status} - ${err.response.statusText}`;
    }
  }

  if (err instanceof Error) {
    return err.message;
  }

  return fallback;
}
