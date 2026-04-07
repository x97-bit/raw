import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // OAuth is not used - the app uses local username/password auth via /api/auth/*
  // tRPC context always returns null user since the app doesn't use tRPC auth
  return {
    req: opts.req,
    res: opts.res,
    user: null,
  };
}
