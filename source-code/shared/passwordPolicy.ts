export const PASSWORD_MIN_LENGTH = 8;

const UPPERCASE_REGEX = /[A-Z]/;
const LOWERCASE_REGEX = /[a-z]/;
const DIGIT_REGEX = /\d/;

export function isStrongPassword(password: string): boolean {
  return (
    typeof password === "string" &&
    password.length >= PASSWORD_MIN_LENGTH &&
    UPPERCASE_REGEX.test(password) &&
    LOWERCASE_REGEX.test(password) &&
    DIGIT_REGEX.test(password)
  );
}
