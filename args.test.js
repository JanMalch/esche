import { test } from "node:test";
import assert from "node:assert";
import { parseArgs } from "./args.js";

test("detect numbers", () => {
  assert.deepEqual(parseArgs(["--x", "1"]), {
    x: 1,
  });
});

test("detect booleans", () => {
  assert.deepEqual(parseArgs(["--x", "--no-y"]), {
    x: true,
    y: false,
  });
});

test("detect =", () => {
  assert.deepEqual(parseArgs(["--x=a", "--y", "b"]), {
    x: "a",
    y: "b",
  });
});

test("detect args", () => {
  assert.deepEqual(parseArgs(["--x=a", "b"]), {
    x: "a",
    _: "b",
  });
});

test("detect stop parsing", () => {
  assert.deepEqual(parseArgs(["--x=a", "--", "b"]), {
    x: "a",
    _: "b",
  });
});

test("complex input with stop parsing", () => {
  assert.deepEqual(parseArgs(["--x=a", "--no-y", "--", "b"]), {
    x: "a",
    y: false,
    _: "b",
  });
});

test("example from docs", () => {
  assert.deepEqual(
    parseArgs([
      "--a",
      "--no-b",
      "--c=1",
      "--d=foobar",
      "--e=foo",
      "--e",
      "bar",
    ]),
    {
      a: true,
      b: false,
      c: 1,
      d: "foobar",
      e: ["foo", "bar"],
    },
  );
});
