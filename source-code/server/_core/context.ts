import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { extractBearerToken, loadAuthenticatedAppUser, verifyToken } from "./appAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  const token = extractBearerToken(opts.req.headers.authorization);

  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      const dbUser = await loadAuthenticatedAppUser(payload.userId);
      if (dbUser) {
        user = dbUser as unknown as User;
      }
    }
  }

  console.log("TRPC createContext -> user:", user);

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
