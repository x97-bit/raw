import { ENV } from "./env";

const MIN_SECRET_LENGTH = 32;

export function getSessionSecret(): Uint8Array {
  const secret = ENV.cookieSecret?.trim();

  if (!secret) {
    throw new Error("JWT_SECRET is required to sign and verify session tokens.");
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters long.`);
  }

  return new TextEncoder().encode(secret);
}

