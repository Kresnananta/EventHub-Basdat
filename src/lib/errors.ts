export function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message) return error.message

  if (error && typeof error === "object") {
    const maybeError = error as { message?: unknown; error_description?: unknown; details?: unknown }

    if (typeof maybeError.message === "string" && maybeError.message) return maybeError.message
    if (typeof maybeError.error_description === "string" && maybeError.error_description) {
      return maybeError.error_description
    }
    if (typeof maybeError.details === "string" && maybeError.details) return maybeError.details
  }

  return fallbackMessage
}
