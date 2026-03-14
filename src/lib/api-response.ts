import { NextResponse } from "next/server";

const RATE_LIMIT = 100;

function buildHeaders(init?: HeadersInit) {
  const headers = new Headers(init);
  headers.set("X-RateLimit-Limit", String(RATE_LIMIT));
  headers.set("X-RateLimit-Remaining", String(RATE_LIMIT - 1));
  headers.set("Cache-Control", "no-store");
  return headers;
}

export function apiError(status: number, code: string, error: string, init?: ResponseInit) {
  return NextResponse.json(
    { error, code, status },
    {
      status,
      headers: buildHeaders(init?.headers),
    },
  );
}

export function apiSuccess<T extends Record<string, unknown>>(body: T, init?: ResponseInit) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: buildHeaders(init?.headers),
  });
}