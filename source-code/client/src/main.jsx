import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { applyTheme, readInitialTheme, ThemeProvider } from "./contexts/ThemeContext";
import "./index.css";
import LoadingSpinner from "./components/LoadingSpinner";

const MerchantPortalRoot = lazy(() => import("./features/portal/MerchantPortalRoot"));
const LandingPage = lazy(() => import("./features/landing/LandingPage"));

applyTheme(readInitialTheme());

// ─── Route Detection ──────────────────────────────────────────────────────────
// | Layer              | Path                    |
// |--------------------|-------------------------|
// | Marketing Website  | /                       |
// | Merchant Portal    | /merchants              |
// | Admin Panel        | /admin                  |
// ──────────────────────────────────────────────────────────────────────────────

const path = window.location.pathname;
const isMerchantRoute = path.startsWith("/merchant");
const isAdminRoute = path.startsWith("/admin");
const isLandingRoute = path === "/" || path === "";

// ─── Security: Clear admin session when navigating away from /admin ───────────
// When the user leaves the admin panel (navigates to landing page, merchant
// portal, or any non-admin route), we must invalidate the admin session so that
// returning to /admin later requires a fresh login.
if (!isAdminRoute) {
  try {
    // Clear admin access token from sessionStorage
    const adminToken = window.sessionStorage.getItem("token");
    window.sessionStorage.removeItem("token");
    // Also clear any legacy localStorage token
    window.localStorage.removeItem("token");

    // Call server-side logout to clear the httpOnly refresh cookie.
    // Use sendBeacon for reliability during navigation, with fetch as fallback.
    if (adminToken) {
      const logoutUrl = "/api/auth/logout";
      const beaconSent =
        typeof navigator.sendBeacon === "function" &&
        navigator.sendBeacon(logoutUrl);
      if (!beaconSent) {
        fetch(logoutUrl, {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
          keepalive: true,
        }).catch(() => {});
      }
    }
  } catch {
    // Ignore errors during cleanup
  }
}

// Determine which app to render
let appElement;

if (isMerchantRoute) {
  // Merchant Portal
  appElement = (
    <ThemeProvider>
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <MerchantPortalRoot />
      </Suspense>
    </ThemeProvider>
  );
} else if (isLandingRoute && !isAdminRoute) {
  // Marketing Landing Page (only on exact "/" path)
  appElement = (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <LandingPage />
    </Suspense>
  );
} else {
  // Admin Panel (all other routes including /admin/*)
  appElement = <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {appElement}
  </React.StrictMode>
);
