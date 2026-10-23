import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";

describe("shared class list", () => {
  it("matches the training notebooks", () => {
    const out = execFileSync("node", [path.join(__dirname, "../scripts/check-classes.mjs")], { encoding: "utf8" });
    expect(out).toMatch(/OK/);
  });
});
