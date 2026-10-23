import { describe, expect, it } from "vitest";
import { mentionsMains } from "@/lib/safety";

describe("mains detection", () => {
  it.each(["my microwave is broken", "it plugs into the wall", "220V power board", "розеткэнд залгадаг", "богино долгионы зуух", "ханын залгуураас тэжээгддэг"])(
    "flags %s",
    (s) => expect(mentionsMains(s)).toBe(true),
  );
  it.each(["the remote has 2 AAA batteries", "USB порт сул байна", "батарейн залгуурыг салгасан", "I have a soldering iron"])(
    "does not flag %s",
    (s) => expect(mentionsMains(s)).toBe(false),
  );
});
