import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { extractBearerToken, loadAuthenticatedAppUser, verifyToken } from "./appAuth";
import type { AppUserRecord } from "../db/schema/dbTypes";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: AppUserRecord | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: AppUserRecord | null = null;
  const token = extractBearerToken(opts.req.headers.authorization);

  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      const dbUser = await loadAuthenticatedAppUser(payload.userId);
      if (dbUser) {
        user = dbUser;
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
