/**
 * The LEAP 2026 lead domain: what a submission is, how a raw form body becomes
 * one, and how a lead is rendered for humans. Pure TypeScript — no runtime,
 * no DOM, no env.
 */

import { jsonArray, jsonString } from "./json";

export const PRODUCT_IDS = ["ava", "nura", "flow", "chalk", "track", "edli", "mesa", "terminal"] as const;

export type ProductId = (typeof PRODUCT_IDS)[number];

export const PRODUCT_LABELS: Record<ProductId, string> = {
  ava: "Ava",
  nura: "Nura",
  flow: "Flow",
  chalk: "Chalk",
  track: "Track",
  edli: "Edli",
  mesa: "Mesa World",
  terminal: "Terminal World"
};

/** Set when the capsule verified with Google, could not reach it, or never tried. */
export type RecaptchaStatus = "verified" | "unverified" | "skipped";

export type LeadSubmission = {
  fullName: string;
  company: string;
  businessEmail: string;
  phoneWhatsapp: string;
  productInterest: ProductId[];
  utmSource: string;
  utmMedium: string;
  utmContent: string;
  pageUrl: string;
  recaptchaToken: string;
};

/** A submission plus everything the server decided about it. */
export type LeadRecord = LeadSubmission & {
  receivedAt: string;
  recaptcha: RecaptchaStatus;
  duplicate: boolean;
};

export type LeadValidation =
  | { ok: true; lead: LeadSubmission }
  | { ok: false; errors: string[] };

export type DashboardAccess = "guest" | "bootstrap" | "forbidden" | "ready";

/** Row shape the owner dashboard renders. */
export type LeadView = {
  id: string;
  receivedAt: string;
  fullName: string;
  company: string;
  businessEmail: string;
  phoneWhatsapp: string;
  products: string;
  utmMedium: string;
  utmContent: string;
  recaptcha: string;
  duplicate: boolean;
  confirmationEmail: string;
  notificationEmail: string;
  teamPing: string;
};

export type DashboardState = {
  access: DashboardAccess;
  leads: LeadView[];
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const WHITESPACE_PATTERN = /\s+/;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000;
const MAX_FIELD_LENGTH = 200;
const MAX_URL_LENGTH = 500;
const MAX_TOKEN_LENGTH = 4000;

function isProductId(value: unknown): value is ProductId {
  return typeof value === "string" && PRODUCT_IDS.some((id) => id === value);
}

function readRequired<TKey extends string>(body: unknown, key: TKey, errors: string[]): string {
  const value = jsonString(body, key);
  if (!value) {
    errors.push(`${key} is required`);
    return "";
  }
  if (value.length > MAX_FIELD_LENGTH) {
    errors.push(`${key} must be ${MAX_FIELD_LENGTH} characters or fewer`);
    return "";
  }
  return value;
}

function readOptional<TKey extends string>(body: unknown, key: TKey, limit: number, errors: string[]): string {
  const value = jsonString(body, key);
  if (value.length > limit) {
    errors.push(`${key} must be ${limit} characters or fewer`);
    return "";
  }
  return value;
}

function readProducts(body: unknown, errors: string[]): ProductId[] {
  const raw = jsonArray(body, "product_interest");
  if (!raw) {
    errors.push("product_interest must be an array");
    return [];
  }
  if (raw.some((entry) => !isProductId(entry))) {
    errors.push(`product_interest accepts only: ${PRODUCT_IDS.join(", ")}`);
    return [];
  }
  // Filtering the canonical list dedupes and fixes the order in one pass.
  const selected = PRODUCT_IDS.filter((id) => raw.some((entry) => entry === id));
  if (selected.length === 0) {
    errors.push("product_interest must name at least one product");
  }
  return selected;
}

/**
 * Validates a raw form body. Unknown keys are ignored; every known field is
 * checked, and all failures are reported together so the form can show them all.
 */
export function parseLeadSubmission(body: unknown): LeadValidation {
  const errors: string[] = [];

  const fullName = readRequired(body, "full_name", errors);
  const company = readRequired(body, "company", errors);
  const businessEmail = readRequired(body, "business_email", errors);
  const phoneWhatsapp = readRequired(body, "phone_whatsapp", errors);

  if (businessEmail && !EMAIL_PATTERN.test(businessEmail)) {
    errors.push("business_email must be a valid email address");
  }

  const productInterest = readProducts(body, errors);
  const utmSource = readOptional(body, "utm_source", MAX_FIELD_LENGTH, errors);
  const utmMedium = readOptional(body, "utm_medium", MAX_FIELD_LENGTH, errors);
  const utmContent = readOptional(body, "utm_content", MAX_FIELD_LENGTH, errors);
  const pageUrl = readOptional(body, "page_url", MAX_URL_LENGTH, errors);
  const recaptchaToken = readOptional(body, "recaptcha_token", MAX_TOKEN_LENGTH, errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    lead: {
      fullName,
      company,
      businessEmail,
      phoneWhatsapp,
      productInterest,
      utmSource,
      utmMedium,
      utmContent,
      pageUrl,
      recaptchaToken
    }
  };
}

export function firstName(fullName: string): string {
  const [first] = fullName.trim().split(WHITESPACE_PATTERN);
  return first || fullName;
}

export function formatProductList(products: ProductId[]): string {
  return products.map((id) => PRODUCT_LABELS[id]).join(", ");
}

/** Product ids survive the database as a comma-separated string. */
export function encodeProducts(products: ProductId[]): string {
  return products.join(",");
}

export function decodeProducts(encoded: string): ProductId[] {
  return PRODUCT_IDS.filter((id) => encoded.split(",").some((entry) => entry === id));
}

/**
 * Riyadh is UTC+3 year-round, so the offset is arithmetic rather than a
 * timezone database lookup.
 */
export function formatRiyadhTime(isoTimestamp: string): string {
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) {
    return isoTimestamp;
  }
  const riyadh = new Date(parsed.getTime() + RIYADH_OFFSET_MS);
  const day = riyadh.getUTCDate();
  const month = MONTH_NAMES[riyadh.getUTCMonth()];
  const year = riyadh.getUTCFullYear();
  const hours = String(riyadh.getUTCHours()).padStart(2, "0");
  const minutes = String(riyadh.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${minutes} AST`;
}
