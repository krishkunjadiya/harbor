import { describe, expect, it } from "vitest";

import { getRequestId } from "./request-id";

describe("getRequestId", () => {
  it("returns an existing request id header when present", () => {
    const headers = new Headers({ "x-request-id": "req-123", "x-correlation-id": "corr-456" });

    expect(getRequestId({ headers })).toBe("req-123");
  });

  it("falls back to correlation id when request id is missing", () => {
    const headers = new Headers({ "x-correlation-id": "corr-456" });

    expect(getRequestId({ headers })).toBe("corr-456");
  });

  it("generates a non-empty id when no headers are present", () => {
    const headers = new Headers();
    const requestId = getRequestId({ headers });

    expect(requestId).toMatch(/[0-9a-f-]{36}/i);
  });
});
