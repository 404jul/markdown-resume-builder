import test from "node:test";
import assert from "node:assert/strict";
import {
  ICON_NAMES,
  iconCompletionAt,
  splitIconTokens,
} from "../src/iconTokens.js";

test("splits known resume icons without consuming unknown tokens", () => {
  assert.deepEqual(splitIconTokens("{github} Work · {MAIL} me · {golang}"), [
    { type: "icon", name: "github" },
    { type: "text", value: " Work · " },
    { type: "icon", name: "email" },
    { type: "text", value: " me · {golang}" },
  ]);
});

test("completes an icon token only at the caret", () => {
  const source = "Work {gi later";

  assert.deepEqual(iconCompletionAt(source, "Work {gi".length), {
    start: "Work ".length,
    names: ["github"],
  });
  assert.deepEqual(iconCompletionAt("{", 1), {
    start: 0,
    names: ICON_NAMES,
  });
  assert.equal(iconCompletionAt(source, source.length), null);
});
