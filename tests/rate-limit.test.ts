import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { allowRequest, isSameSite, LIMIT_PER_MINUTE } = await import("@/lib/rate-limit");

const req = (headers: Record<string, string>) => new Request("https://electroquest.pages.dev/api/ai", { method: "POST", headers });

describe("AI route protection", () => {
  it("only accepts calls from our own pages", () => {
    expect(isSameSite(req({ origin: "https://electroquest.pages.dev" }))).toBe(true);
    expect(isSameSite(req({ origin: "https://electroquest.brkh1222.workers.dev" }))).toBe(true);
    expect(isSameSite(req({ origin: "http://localhost:3000" }))).toBe(true);
    expect(isSameSite(req({ referer: "https://electroquest.pages.dev/fix/tv_remote" }))).toBe(true);
    expect(isSameSite(req({ origin: "https://evil.example.com" }))).toBe(false);
    expect(isSameSite(req({ origin: "https://electroquest.pages.dev.evil.com" }))).toBe(false);
    expect(isSameSite(req({}))).toBe(false); // curl with no origin
  });

  it("limits each visitor per minute", async () => {
    const a = { "cf-connecting-ip": "203.0.113.7" };
    for (let i = 0; i < LIMIT_PER_MINUTE; i++) expect(await allowRequest(req(a))).toBe(true);
    expect(await allowRequest(req(a))).toBe(false);
    expect(await allowRequest(req({ "cf-connecting-ip": "203.0.113.8" }))).toBe(true); // others unaffected
  });

  it("ignores a forged proxy IP header without the secret", async () => {
    const forged = { "cf-connecting-ip": "203.0.113.7", "x-eq-client-ip": "198.51.100.1", "x-eq-proxy-key": "guess" };
    expect(await allowRequest(req(forged))).toBe(false); // still counted as 203.0.113.7, already over the limit
  });
});
