import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

function getToken() {
  if (typeof window === "undefined") return null;
  return (
    window.sessionStorage.getItem("token") ||
    window.localStorage.getItem("token")
  );
}

/**
 * @type {import('@trpc/client').CreateTRPCClient<import('../../../server/routers').AppRouter>}
 */
export const trpc = createTRPCClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        const token = getToken();
        return {
          ...(token && { Authorization: `Bearer ${token}` }),
        };
      },
    }),
  ],
});
