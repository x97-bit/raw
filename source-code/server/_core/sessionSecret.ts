import { ENV } from "./env";

const MIN_SECRET_LENGTH = 32;

function encodeSecret(secret: string | undefined, label: string): Uint8Array {
  const normalizedSecret = secret?.trim();

  if (!normalizedSecret) {
    throw new Error(`${label} is required to sign and verify session tokens.`);
  }

  if (normalizedSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `${label} must be at least ${MIN_SECRET_LENGTH} characters long.`
    );
  }

  return new TextEncoder().encode(normalizedSecret);
}

export function getSessionSecret(): Uint8Array {
  return encodeSecret(
    ENV.sessionCookieSecret,
    "SESSION_COOKIE_SECRET (or JWT_SECRET)"
  );
}

export function getAppAccessTokenSecret(): Uint8Array {
  return encodeSecret(
    ENV.appAccessTokenSecret,
    "APP_ACCESS_TOKEN_SECRET (or JWT_SECRET)"
  );
}

export function getAppRefreshTokenSecret(): Uint8Array {
  return encodeSecret(
    ENV.appRefreshTokenSecret,
    "APP_REFRESH_TOKEN_SECRET (or JWT_SECRET)"
  );
}
