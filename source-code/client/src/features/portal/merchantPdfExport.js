/**
 * Merchant Portal PDF Export Helper
 * 
 * Provides a merchantAuthFetch function that uses the merchant's session token
 * to call the server-side PDF export endpoint.
 */

const MERCHANT_TOKEN_KEY = "merchant_token";

/**
 * Authenticated fetch for merchant portal.
 * Mimics the admin authFetch but uses the merchant token from sessionStorage.
 * The path is prefixed with /api automatically.
 */
export async function merchantAuthFetch(path, options = {}) {
  const token = sessionStorage.getItem(MERCHANT_TOKEN_KEY);
  const url = `/api${path}`;

  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, { ...options, headers });
  return response;
}

/**
 * Export a single transaction as PDF invoice from the merchant portal.
 * Uses the same invoiceHtmlTemplate as the admin portal.
 */
export async function merchantExportInvoicePDF(transaction, { sectionKey } = {}) {
  const { exportInvoiceViaServer } = await import("../../utils/invoiceHtmlTemplate");
  return exportInvoiceViaServer(transaction, {
    sectionKey,
    authFetch: merchantAuthFetch,
  });
}
