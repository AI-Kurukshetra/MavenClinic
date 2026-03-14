export function stripHtmlTags(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function sanitizeText(value?: string | null) {
  if (typeof value !== "string") {
    return value ?? "";
  }

  return stripHtmlTags(value);
}

export function sanitizeNullableText(value?: string | null) {
  if (typeof value !== "string") {
    return null;
  }

  const sanitized = sanitizeText(value);
  return sanitized.length ? sanitized : null;
}