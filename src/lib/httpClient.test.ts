import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpClientError, request } from "@/lib/httpClient";

describe("httpClient request", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed JSON for 200 responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const data = await request<{ ok: boolean }>("/api/example");

    expect(data).toEqual({ ok: true });
  });

  it("throws unified HttpClientError for 4xx", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: "invalid_init_data", message: "Invalid init data" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(request("/api/leaderboard")).rejects.toMatchObject({
      name: "HttpClientError",
      status: 401,
      code: "invalid_init_data",
      message: "Invalid init data",
    });
  });

  it("throws default 5xx error for empty response body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(request("/api/leaderboard")).rejects.toEqual(
      expect.objectContaining<HttpClientError>({
        status: 500,
        code: "http_500",
        message: "HTTP error 500",
      })
    );
  });

  it("returns null for successful empty response body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const data = await request<null>("/api/no-content");

    expect(data).toBeNull();
  });
});
