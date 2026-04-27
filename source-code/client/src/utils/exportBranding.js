export const TAY_ALRAWI_BRAND_ASSETS = {
  header: "/templates/tayalrawi-full-header.png",
  footer: "/templates/tayalrawi-footer-area-clean.png",
  invoiceFooter: "/templates/tayalrawi-invoice-footer.png",
  logo: "/templates/tayalrawi-logo-trimmed.png",
  logoOnWhite: "/templates/tayalrawi-logo-white-bg.png",
};

export const LOUAY_ALRAWI_BRAND_ASSETS = {
  header: "/templates/louayalrawi-full-header.png",
  footer: "/templates/louayalrawi-footer-area-clean.png",
  invoiceFooter: "/templates/louayalrawi-invoice-footer.png",
  logo: "/templates/louayalrawi-logo-trimmed.png",
  logoOnWhite: "/templates/louayalrawi-logo-white-bg.png",
};

export function resolveBrandAssets({ sectionKey } = {}) {
  if (sectionKey === "special-partner" || sectionKey === "partnership-yaser") {
    return LOUAY_ALRAWI_BRAND_ASSETS;
  }
  return TAY_ALRAWI_BRAND_ASSETS;
}

export const TAY_ALRAWI_BRAND_COLORS = {
  headerNavy: "#1c2b59",
  tableNavy: "#1c2b59",
  accentRed: "#e31e24",
  accentRedDark: "#e31e24",
  footerNavy: "#1c2b59",
  rowTint: "#f9f9f9",
  text: "#000000",
};

function normalizePortIdentifier(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
}

export function shouldUseTayAlRawiBranding({
  sectionKey,
  portId,
  transaction,
} = {}) {
  void sectionKey;
  void portId;
  void transaction;
  return true;
}

export function formatEnglishLongDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
