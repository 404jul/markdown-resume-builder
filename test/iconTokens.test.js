import test from "node:test";
import assert from "node:assert/strict";
import { splitIconTokens } from "../src/iconTokens.js";

test("splits known resume icons without consuming unknown tokens", () => {
  assert.deepEqual(splitIconTokens("{github} Work · {MAIL} me · {golang}"), [
    { type: "icon", name: "github" },
    { type: "text", value: " Work · " },
    { type: "icon", name: "email" },
    { type: "text", value: " me · {golang}" },
  ]);
});
