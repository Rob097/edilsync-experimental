const encoder = new TextEncoder();

const DISALLOWED_CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class InputValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "InputValidationError";
    this.status = status;
  }
}

export function getErrorStatus(error: unknown, fallback = 500) {
  return error instanceof InputValidationError ? error.status : fallback;
}

export async function parseJsonBody(req: Request, { maxBytes = 16 * 1024, allowEmptyObject = false } = {}) {
  const contentType = (req.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("application/json")) {
    throw new InputValidationError("Content-Type must be application/json", 415);
  }

  const declaredLength = Number(req.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new InputValidationError(`Request body too large. Max ${maxBytes} bytes`, 413);
  }

  const raw = await req.text();
  const actualLength = encoder.encode(raw).byteLength;
  if (actualLength > maxBytes) {
    throw new InputValidationError(`Request body too large. Max ${maxBytes} bytes`, 413);
  }

  if (!raw.trim()) {
    if (allowEmptyObject) {
      return {};
    }
    throw new InputValidationError("Request body is required");
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new InputValidationError("Malformed JSON body");
  }

  if (!isPlainObject(payload)) {
    throw new InputValidationError("JSON body must be an object");
  }

  return payload;
}

export function assertNoUnexpectedKeys(payload: Record<string, unknown>, allowedKeys: string[]) {
  const unexpectedKeys = Object.keys(payload).filter((key) => !allowedKeys.includes(key));
  if (unexpectedKeys.length > 0) {
    throw new InputValidationError(`Unexpected fields: ${unexpectedKeys.join(", ")}`);
  }
}

export function requireObject(value: unknown, field: string) {
  if (!isPlainObject(value)) {
    throw new InputValidationError(`${field} must be an object`);
  }

  return value as Record<string, unknown>;
}

export function optionalBoolean(value: unknown, field: string) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "boolean") {
    throw new InputValidationError(`${field} must be a boolean`);
  }

  return value;
}

export function requiredText(value: unknown, options: TextOptions) {
  const normalized = normalizeText(value, options, false);
  if (normalized === null) {
    throw new InputValidationError(`${options.field} is required`);
  }
  return normalized;
}

export function optionalText(value: unknown, options: TextOptions) {
  return normalizeText(value, options, true);
}

export function requiredEmail(value: unknown, field: string) {
  const email = requiredText(value, {
    field,
    maxLength: 254,
    collapseWhitespace: true,
  }).toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    throw new InputValidationError(`${field} must be a valid email address`);
  }

  return email;
}

export function optionalEmail(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return requiredEmail(value, field);
}

export function requiredUuid(value: unknown, field: string) {
  const uuid = requiredText(value, {
    field,
    maxLength: 36,
    collapseWhitespace: true,
    pattern: UUID_PATTERN,
    patternMessage: `${field} must be a valid UUID`,
  });

  if (!UUID_PATTERN.test(uuid)) {
    throw new InputValidationError(`${field} must be a valid UUID`);
  }

  return uuid;
}

export function optionalUuid(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return requiredUuid(value, field);
}

export function requiredEnum(value: unknown, field: string, allowedValues: string[]) {
  const normalized = requiredText(value, {
    field,
    maxLength: Math.max(...allowedValues.map((item) => item.length), 1),
    collapseWhitespace: true,
  });

  if (!allowedValues.includes(normalized)) {
    throw new InputValidationError(`${field} must be one of: ${allowedValues.join(", ")}`);
  }

  return normalized;
}

export function optionalEnum(value: unknown, field: string, allowedValues: string[]) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return requiredEnum(value, field, allowedValues);
}

export function requiredIdentifier(value: unknown, field: string, maxLength = 80) {
  return requiredText(value, {
    field,
    maxLength,
    collapseWhitespace: true,
    pattern: /^[a-z0-9_:-]+$/i,
    patternMessage: `${field} contains invalid characters`,
  });
}

export function optionalIdentifier(value: unknown, field: string, maxLength = 80) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return requiredIdentifier(value, field, maxLength);
}

export function requiredUrl(value: unknown, field: string, maxLength = 2048) {
  const raw = requiredText(value, {
    field,
    maxLength,
    collapseWhitespace: true,
  });

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new InputValidationError(`${field} must be a valid URL`);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new InputValidationError(`${field} must use http or https`);
  }

  return parsed.toString();
}

export function optionalDate(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return requiredText(value, {
    field,
    maxLength: 10,
    collapseWhitespace: true,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    patternMessage: `${field} must be in YYYY-MM-DD format`,
  });
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type TextOptions = {
  field: string;
  minLength?: number;
  maxLength: number;
  multiline?: boolean;
  collapseWhitespace?: boolean;
  pattern?: RegExp;
  patternMessage?: string;
};

function normalizeText(value: unknown, options: TextOptions, optional: boolean) {
  if (value === undefined || value === null) {
    return optional ? null : null;
  }

  if (typeof value !== "string") {
    throw new InputValidationError(`${options.field} must be a string`);
  }

  let normalized = value.normalize("NFKC").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (DISALLOWED_CONTROL_CHARS.test(normalized)) {
    throw new InputValidationError(`${options.field} contains invalid control characters`);
  }

  normalized = normalized.trim();

  if (!options.multiline && normalized.includes("\n")) {
    throw new InputValidationError(`${options.field} must be a single line`);
  }

  if (options.collapseWhitespace !== false) {
    normalized = options.multiline
      ? normalized.replace(/[^\S\n]+/g, " ")
      : normalized.replace(/\s+/g, " ");
  }

  if (!normalized) {
    return optional ? null : null;
  }

  if (options.minLength && normalized.length < options.minLength) {
    throw new InputValidationError(`${options.field} must be at least ${options.minLength} characters`);
  }

  if (normalized.length > options.maxLength) {
    throw new InputValidationError(`${options.field} must be at most ${options.maxLength} characters`);
  }

  if (options.pattern && !options.pattern.test(normalized)) {
    throw new InputValidationError(options.patternMessage || `${options.field} is malformed`);
  }

  return normalized;
}

function isPlainObject(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}