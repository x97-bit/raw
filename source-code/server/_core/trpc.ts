import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { logSystemError } from "./logger";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error, type, path, input, ctx }) {
    // Log unexpected or internal server errors
    if (error.code === 'INTERNAL_SERVER_ERROR' && !error.message.includes("UNAUTHORIZED")) {
      void logSystemError(`tRPC Error: [${type}] ${path}`, error, {
        input,
        userId: ctx?.user?.id,
      });
    }
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    console.log("adminProcedure ctx.user:", ctx.user);
    console.log("Is !ctx.user:", !ctx.user);
    console.log("Is ctx.user.role !== 'admin':", ctx.user ? ctx.user.role !== "admin" : true);

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  })
);
