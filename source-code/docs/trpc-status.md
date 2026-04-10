# tRPC Status

## Current State

- `tRPC` is still wired on the server through `/api/trpc`.
- The active surface area is small: `systemRouter` plus the `auth.logout` mutation and `auth.me` query in [server/routers.ts](../server/routers.ts).
- The React app currently talks to the business API through REST `fetch` calls, not a generated `tRPC` client.

## Recommended Path

- Keep `tRPC` for now because it still powers authenticated system/auth flows and has regression coverage.
- Do not spread it gradually into the business routes unless we commit to a full client migration plan.
- If we want a leaner production footprint later, remove `tRPC` only after:
  1. replacing the remaining `system` and `auth` procedures with REST equivalents,
  2. deleting the `/api/trpc` middleware from the server bootstrap,
  3. removing `@trpc/server` and related helpers,
  4. updating the regression tests that currently call `appRouter.createCaller(...)`.

## Why This Decision

- A partial migration in either direction adds maintenance cost without much product value.
- The highest-value work for this app remains financial correctness, security, and operational stability.
