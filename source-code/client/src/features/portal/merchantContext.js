import { createContext, useContext } from "react";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

const MERCHANT_TOKEN_KEY = "merchant_token";

// tRPC Client
export const merchantTrpc = createTRPCClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        const token = sessionStorage.getItem(MERCHANT_TOKEN_KEY);
        return {
          ...(token && { Authorization: `Bearer ${token}` }),
        };
      },
    }),
  ],
});

// Auth Context
export const MerchantAuthContext = createContext(null);
export function useMerchantAuth() {
  return useContext(MerchantAuthContext);
}

// Navigation Context
export const MerchantNavigationContext = createContext(null);
export function useMerchantNavigation() {
  return useContext(MerchantNavigationContext);
}
