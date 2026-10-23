import { describe, expect, it } from "vitest";
import { deviceById } from "@/lib/data";
import { askableQuestions, emptyState, isPreCamera, judgeVoltage, nextPreCameraQuestion, nextQuestion, pendingTests, rank, remaining, setAnswer } from "@/lib/diagnosis";

const tv = deviceById("tv_remote")!;
const garage = deviceById("garage_remote")!;
const pad = deviceById("game_controller")!;

describe("diagnosis engine", () => {
  it("starts from the most common failure", () => {
    expect(rank(tv, emptyState())[0].cause.id).toBe("dead_battery");
  });

  it("probabilities sum to 1", () => {
    const sum = rank(tv, emptyState()).reduce((a, r) => a + r.p, 0);
    expect(sum).toBeCloseTo(1);
  });

  it("asks questions in order and respects ask_if", () => {
    const s = emptyState();
    expect(nextQuestion(tv, s)?.id).toBe("response");
    s.answers.response = "none";
    expect(nextQuestion(tv, s)?.id).toBe("battery_age");
    s.answers.battery_age = "just_now";
    s.answers.wet_or_dropped = "neither";
    s.answers.contacts_look = "unsure";
    expect(nextQuestion(tv, s)).toBeNull(); // pad_feel only when some buttons work
    s.answers.response = "some";
    expect(nextQuestion(tv, s)?.id).toBe("pad_feel");
  });

  it("demo path: no flash + fresh batteries + corrosion photo → corroded contacts", () => {
    const s = emptyState();
    s.answers = { response: "none", battery_age: "just_now", wet_or_dropped: "neither", contacts_look: "unsure" };
    s.tests.ir_camera = "no_flash";
    s.findings.push({ defect: "corrosion", confidence: 0.9 });
    const top = rank(tv, s);
    expect(top[0].cause.id).toBe("corroded_contacts");
  });

  it("a visible IR flash points away from the remote's power and LED", () => {
    const s = emptyState();
    s.answers = { response: "none", battery_age: "recent", wet_or_dropped: "neither", contacts_look: "shiny" };
    s.tests.ir_camera = "flash";
    expect(rank(tv, s)[0].cause.id).toBe("tv_side");
  });

  it("some buttons working points to worn pads", () => {
    const s = emptyState();
    s.answers = { response: "some", pad_feel: "yes" };
    expect(rank(tv, s)[0].cause.id).toBe("worn_pads");
  });

  it("tried fixes are removed and the next cause comes up", () => {
    const s = emptyState();
    const first = rank(tv, s)[0].cause.id;
    s.tried.push(first);
    const r = remaining(tv, s);
    expect(r.map((x) => x.cause.id)).not.toContain(first);
    expect(r[0].p).toBeGreaterThan(0);
  });

  it("garage remote: LED lights after a power cut → re-pairing", () => {
    const s = emptyState();
    s.answers = { led_lights: "yes", which_buttons: "all", what_changed: "power_cut", close_range: "no", wet_or_dropped: "neither" };
    expect(rank(garage, s)[0].cause.id).toBe("lost_pairing");
    expect(pendingTests(garage, s).map((t) => t.id)).toContain("pairing_check");
  });

  it("controller: drift answer → stick module", () => {
    const s = emptyState();
    s.answers = { main_problem: "drift", age: "old", wet_or_dropped: "neither" };
    expect(rank(pad, s)[0].cause.id).toBe("joystick_drift");
    expect(pendingTests(pad, s).map((t) => t.id)).toEqual(["drift_test"]);
  });

  it("controller: loose plug → USB port", () => {
    const s = emptyState();
    s.answers = { main_problem: "charge", swollen: "no", other_cable: "no", loose_plug: "yes", age: "old", wet_or_dropped: "dropped" };
    expect(rank(pad, s)[0].cause.id).toBe("usb_port");
  });

  it("an unsure visual finding moves scores less than a confident one", () => {
    const sure = emptyState();
    sure.findings.push({ defect: "corrosion", confidence: 1 });
    const unsure = emptyState();
    unsure.findings.push({ defect: "corrosion", confidence: 0.2 });
    const p = (s: ReturnType<typeof emptyState>) => rank(tv, s).find((r) => r.cause.id === "corroded_contacts")!.p;
    expect(p(sure)).toBeGreaterThan(p(unsure));
  });

  it("judges multimeter readings in code", () => {
    expect(judgeVoltage(2.9, { min: 2.6, max: 3.4 })).toBe("ok");
    expect(judgeVoltage(2.1, { min: 2.6, max: 3.4 })).toBe("low");
    expect(judgeVoltage(9.2, { min: 2.6, max: 3.4 })).toBe("high");
  });
});

describe("camera screen", () => {
  it("asks only the question other questions depend on before the camera", () => {
    expect(nextPreCameraQuestion(tv, emptyState())?.id).toBe("response");
    expect(nextPreCameraQuestion(garage, emptyState())?.id).toBe("led_lights");
    expect(nextPreCameraQuestion(pad, emptyState())?.id).toBe("main_problem");
    expect(nextPreCameraQuestion(tv, setAnswer(tv, emptyState(), "response", "none"))).toBeNull();
  });

  it("shows the rest beside the camera, following ask_if", () => {
    const s = setAnswer(tv, emptyState(), "response", "some");
    expect(askableQuestions(tv, s).filter((q) => !isPreCamera(tv, q)).map((q) => q.id)).toEqual(["battery_age", "wet_or_dropped", "contacts_look", "pad_feel"]);
  });

  it("changing an answer drops answers that no longer apply", () => {
    let s = setAnswer(tv, emptyState(), "response", "some");
    s = setAnswer(tv, s, "pad_feel", "yes");
    s = setAnswer(tv, s, "battery_age", "recent");
    s = setAnswer(tv, s, "response", "none");
    expect(s.answers).toEqual({ response: "none", battery_age: "recent" });
  });

  it("changing an answer drops test results that no longer apply", () => {
    let s = setAnswer(garage, emptyState(), "led_lights", "yes");
    s = { ...s, tests: { pairing_check: "still_fails", other_remote: "fails" } };
    s = setAnswer(garage, s, "led_lights", "no");
    expect(s.tests).toEqual({ other_remote: "fails" });
  });
});

describe("demo script", () => {
  it("second remote: burnt chip → unfixable → salvage", () => {
    const s = emptyState();
    s.answers = { response: "none", battery_age: "just_now", wet_or_dropped: "neither", contacts_look: "shiny" };
    s.tests.ir_camera = "no_flash";
    s.findings.push({ defect: "burn_mark", confidence: 0.85 });
    const top = rank(tv, s)[0].cause;
    expect(top.id).toBe("dead_chip");
    expect(top.unfixable).toBe(true);
  });
});

describe("evidence", () => {
  it("explains the top cause with the strongest signals first", async () => {
    const { evidenceFor } = await import("@/lib/diagnosis");
    const s = emptyState();
    s.answers = { response: "none", battery_age: "just_now", wet_or_dropped: "neither", contacts_look: "unsure" };
    s.tests.ir_camera = "no_flash";
    s.findings.push({ defect: "corrosion", confidence: 0.9 });
    const ev = evidenceFor(tv, s, "corroded_contacts");
    expect(ev[0].kind).toBe("finding");
    expect(ev.some((e) => e.kind === "test")).toBe(true);
  });
});

describe("live-answer regressions", () => {
  it("the same defect seen twice counts once", () => {
    const once = emptyState();
    once.findings.push({ defect: "corrosion", confidence: 0.85 });
    const twice = emptyState();
    twice.findings.push({ defect: "corrosion", confidence: 0.85 }, { defect: "corrosion", confidence: 0.75 });
    expect(rank(tv, twice)[0].p).toBeCloseTo(rank(tv, once)[0].p);
  });

  it("second remote with Claude's real (less confident) answers still ends in salvage", () => {
    // Recorded live: defect check burn_mark 0.6; golden compare misread it as liquid_residue 0.75.
    const s = emptyState();
    s.answers = { response: "none", battery_age: "just_now", wet_or_dropped: "neither", contacts_look: "shiny" };
    s.tests.ir_camera = "no_flash";
    s.findings.push({ defect: "burn_mark", confidence: 0.6 }, { defect: "liquid_residue", confidence: 0.75 });
    expect(rank(tv, s)[0].cause.id).toBe("dead_chip");
  });

  it("first remote with Claude's real answers → corroded contacts", () => {
    const s = emptyState();
    s.answers = { response: "none", battery_age: "just_now", wet_or_dropped: "neither", contacts_look: "unsure" };
    s.tests.ir_camera = "no_flash";
    s.findings.push({ defect: "corrosion", confidence: 0.9 }, { defect: "corrosion", confidence: 0.85 }, { defect: "cracked_joint", confidence: 0.6 });
    expect(rank(tv, s)[0].cause.id).toBe("corroded_contacts");
  });
});

describe("bluetooth speaker", () => {
  const sp = deviceById("bluetooth_speaker")!;
  const top = (answers: Record<string, string>, tests: Record<string, string> = {}, findings: { defect: "burn_mark" | "cracked_joint"; confidence: number }[] = []) => {
    const s = emptyState();
    s.answers = answers;
    s.tests = tests;
    s.findings = findings;
    return rank(sp, s)[0].cause.id;
  };

  it("old speaker that dies fast → worn battery", () => {
    expect(top({ main_problem: "dies_fast", swollen: "no", charge_light: "yes", loose_plug: "no", age: "old", wet_or_dropped: "neither" })).toBe("battery_worn");
  });
  it("silent after a drop, aux silent too → broken speaker wire", () => {
    expect(top({ main_problem: "no_sound", aux_works: "no", age: "old", wet_or_dropped: "dropped" })).toBe("speaker_wire");
  });
  it("plays over aux but not Bluetooth → pairing", () => {
    expect(top({ main_problem: "no_bluetooth", aux_works: "yes", age: "old", wet_or_dropped: "neither" })).toBe("lost_pairing");
  });
  it("dead, but turns on after a long charge → flat battery", () => {
    expect(top({ main_problem: "no_power", swollen: "no", charge_light: "yes", loose_plug: "no", age: "old", wet_or_dropped: "neither" }, { charge_test: "on" })).toBe("battery_flat");
  });
  it("dead with a loose plug and no charge light → USB port", () => {
    expect(top({ main_problem: "no_power", swollen: "no", charge_light: "no", loose_plug: "yes", age: "old", wet_or_dropped: "dropped" })).toBe("usb_port");
  });
  it("first question is the gating one for the camera screen", () => {
    expect(sp.questions[0].id).toBe("main_problem");
  });
});
