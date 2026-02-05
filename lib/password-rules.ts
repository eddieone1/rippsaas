/**
 * Shared password rules for the SaaS.
 * Passwords must be at least 8 characters and include at least one special character.
 */

export const PASSWORD_MIN_LENGTH = 8;

/** Characters that count as "special" (non-alphanumeric, not space). */
const SPECIAL_CHAR_REGEX = /[^a-zA-Z0-9\s]/;

/** User-facing description of password requirements (use in hints and errors). */
export const PASSWORD_RULES_TEXT =
  "At least 8 characters, including one special character (e.g. !@#$%^&*)";

export interface PasswordValidation {
  valid: boolean;
  message?: string;
}

/**
 * Validates a password against app rules.
 * Returns { valid: true } or { valid: false, message: "..." }.
 */
export function validatePassword(password: string): PasswordValidation {
  if (!password || typeof password !== "string") {
    return { valid: false, message: "Password is required" };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    };
  }
  if (!SPECIAL_CHAR_REGEX.test(password)) {
    return {
      valid: false,
      message: "Password must include at least one special character (e.g. !@#$%^&*)",
    };
  }
  return { valid: true };
}
