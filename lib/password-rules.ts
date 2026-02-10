/**
 * Password validation and rules text for signup/change-password flows.
 */

export const PASSWORD_RULES_TEXT =
  "At least 8 characters, with one uppercase letter, one lowercase letter, and one number.";

const MIN_LENGTH = 8;
const HAS_UPPER = /[A-Z]/;
const HAS_LOWER = /[a-z]/;
const HAS_NUMBER = /\d/;

export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < MIN_LENGTH) {
    return { valid: false, message: "Password must be at least 8 characters." };
  }
  if (!HAS_UPPER.test(password)) {
    return { valid: false, message: "Password must include at least one uppercase letter." };
  }
  if (!HAS_LOWER.test(password)) {
    return { valid: false, message: "Password must include at least one lowercase letter." };
  }
  if (!HAS_NUMBER.test(password)) {
    return { valid: false, message: "Password must include at least one number." };
  }
  return { valid: true };
}
