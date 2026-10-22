import { describe, expect, it } from "vitest";
import { earnedBadges, unlockedLevels } from "@/lib/progression";

describe("progression", () => {
  it("unlocks levels in order", () => {
    expect([...unlockedLevels([])]).toEqual([1]);
    expect(unlockedLevels([{ id: "led-basic", completedAt: 1 }]).has(2)).toBe(true);
    const two = [{ id: "led-basic", completedAt: 1 }, { id: "night-light", completedAt: 2 }, { id: "fade-out", completedAt: 3 }];
    expect(unlockedLevels(two).has(3)).toBe(true);
    expect([...unlockedLevels([], true)].sort()).toEqual([1, 2, 3]);
  });
  it("awards badges", () => {
    const b = earnedBadges([{ id: "arduino-blink", completedAt: 1 }], [{ id: "r", deviceId: "tv_remote", startedAt: 0, outcome: "fixed", state: { answers: {}, tests: {}, findings: [], tried: [] } }]);
    expect([...b].sort()).toEqual(["arduino", "first_circuit", "first_repair", "saved_device"]);
  });
});
