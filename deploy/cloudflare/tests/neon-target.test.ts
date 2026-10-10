import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNeonTarget } from "../../../scripts/neon-target.ts";
test("initialization refuses another host, database, missing TLS or invalid acknowledgement", () => {
  const expected = "ep-own.us-east-2.aws.neon.tech";
  for (const uri of ["postgres://u:p@localhost/aibrief?sslmode=require", `postgres://u:p@${expected}/other?sslmode=require`, `postgres://u:p@${expected}/aibrief`]) assert.throws(() => assertNeonTarget(uri, expected, "aihot-lol"));
  assert.throws(() => assertNeonTarget(`postgres://u:p@${expected}/aibrief?sslmode=require`, expected, "other"));
  assert.doesNotThrow(() => assertNeonTarget(`postgres://u:p@${expected}/aibrief?sslmode=require`, expected, "aihot-lol"));
});
