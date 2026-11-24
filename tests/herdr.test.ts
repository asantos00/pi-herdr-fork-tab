import { describe, expect, test } from "bun:test";
import {
  findTabName,
  forkChoices,
  forkTabName,
  parseHerdrLocation,
  tabNewArguments,
} from "../src/herdr.ts";

describe("parseHerdrLocation", () => {
  test("reads the current space and tab labels", () => {
    expect(parseHerdrLocation(JSON.stringify({
      labels: { "herdr.space": "sp1", "herdr.tab": "tb1" },
    }))).toEqual({ spaceId: "sp1", tabId: "tb1" });
  });

  test("rejects terminals outside the Herdr document", () => {
    expect(() => parseHerdrLocation(JSON.stringify({ labels: {} }))).toThrow("not attached");
  });
});

describe("forkChoices", () => {
  test("lists user messages newest first and forks before each selected prompt", () => {
    const entries = [
      { id: "setup", parentId: null, type: "model_change" },
      { id: "u1", parentId: "setup", type: "message", message: { role: "user", content: "First idea" } },
      { id: "a1", parentId: "u1", type: "message", message: { role: "assistant", content: "Answer" } },
      {
        id: "u2",
        parentId: "a1",
        type: "message",
        message: { role: "user", content: [{ type: "text", text: "Try another path" }] },
      },
    ];

    expect(forkChoices(entries)).toEqual([
      { label: "02 · Try another path", forkFromId: "a1", draft: "Try another path" },
      { label: "01 · First idea", forkFromId: "setup", draft: "First idea" },
    ]);
  });

  test("ignores user entries that cannot be forked before", () => {
    expect(forkChoices([
      { id: "u1", parentId: null, type: "message", message: { role: "user", content: "Root" } },
    ])).toEqual([]);
  });
});

describe("tab metadata", () => {
  test("finds the source tab name", () => {
    const state = JSON.stringify({ spaces: [{ tabs: [{ id: "tb1", name: "Investigate API" }] }] });
    expect(findTabName(state, "tb1")).toBe("Investigate API");
  });

  test("uses an explicit name or derives a fork name", () => {
    expect(forkTabName("Alternative", "Source")).toBe("Alternative");
    expect(forkTabName("", "Source")).toBe("Source · fork");
    expect(forkTabName("", undefined, "Named session")).toBe("Named session · fork");
    expect(forkTabName("")).toBe("Pi session · fork");
  });
});

test("tabNewArguments targets the source space and opens the fork", () => {
  const args = tabNewArguments({
    name: "Source · fork",
    spaceId: "sp1",
    cwd: "/tmp/project",
    sessionFile: "/tmp/session.jsonl",
    task: "Try another path",
  });

  expect(args.slice(0, 2)).toEqual(["do", "tab.new"]);
  expect(JSON.parse(args[2])).toEqual({
    name: "Source · fork",
    space: "sp1",
    folder: "/tmp/project",
    argv: ["pi", "--session", "/tmp/session.jsonl"],
    task: "Try another path",
    focus: true,
  });
});
