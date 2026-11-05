import assert from "node:assert/strict";
import { FPS, parseScript, planLines, preset, scriptDocument } from "../lib/plan.ts";

for (const id of ["hook", "list", "story"] as const) {
  const plan = planLines(preset(id));
  const seconds = plan.durationInFrames / FPS;
  assert.ok(plan.lines.length === 3, id);
  assert.ok(seconds >= 30 && seconds <= 60, `${id} rendered ${seconds.toFixed(2)}s`);
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

const parsed = parseScript(scriptDocument("story"));
assert.equal(parsed.template, "story");
const fromScript = planLines(parsed.lines);
const scriptSeconds = fromScript.durationInFrames / FPS;
assert.ok(scriptSeconds >= 30 && scriptSeconds <= 60, `script ${scriptSeconds.toFixed(2)}s`);
console.log("verify-plan: ok");
