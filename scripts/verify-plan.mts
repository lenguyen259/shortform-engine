import assert from "node:assert/strict";
import { planLines, preset } from "../lib/plan.ts";

for (const id of ["hook", "list", "story"] as const) {
  const plan = planLines(preset(id));
  assert.ok(plan.lines.length === 3, id);
  assert.ok(plan.durationInFrames > 90, id);
  for (const line of plan.lines) {
    assert.ok(line.words.length > 0);
    assert.equal(line.words[0]?.start, 0);
    assert.equal(line.words[line.words.length - 1]?.end, line.end - line.start);
    assert.ok(line.end > line.start);
  }
}

const empty = planLines([{ id: "x", text: "   " }]);
assert.equal(empty.lines.length, 0);
assert.ok(empty.durationInFrames >= 60);
console.log("verify-plan: ok");
