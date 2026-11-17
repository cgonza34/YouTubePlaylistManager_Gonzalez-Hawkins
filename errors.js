/**
 * Shared error types across architecture layers. This file has no imports, so
 * any layer may import it without causing dependency tangles.
 */

/**
 * The user is not signed-in (e.g. the token expired, was rejected).
 */
export class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * The YT API answered with an error status.
 */
export class ApiError extends Error {
  constructor(status, reason, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.reason = reason;     // e.g. quotaExceeded, accessNotConfigured
  }
}