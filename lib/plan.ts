export const FPS = 30;

export type TemplateId = "hook" | "list" | "story";

export type Line = {
  id: string;
  text: string;
};

export type TimedWord = {
  text: string;
  start: number;
  end: number;
};

export type TimedLine = Line & {
  words: TimedWord[];
  start: number;
  end: number;
};

export type Plan = {
  lines: TimedLine[];
  durationInFrames: number;
};

const TEMPLATES: Record<TemplateId, { label: string; lines: string[] }> = {
  hook: {
    label: "Hook",
    lines: [
      "Stop editing the short by hand.",
      "One script becomes a vertical cut.",
      "Captions, bed, and the end card are already timed.",
    ],
  },
  list: {
    label: "List",
    lines: [
      "Write the line.",
      "Let the clock land on each word.",
      "Swap the template and publish again.",
    ],
  },
  story: {
    label: "Story",
    lines: [
      "The draft used to sit in a timeline.",
      "Now the same sentences render in the browser.",
      "No voice API. The speech engine is already on this machine.",
    ],
  },
};

export function templateLabel(id: TemplateId): string {
  switch (id) {
    case "hook":
    case "list":
    case "story":
      return TEMPLATES[id].label;
    default: {
      const unexpected: never = id;
      return unexpected;
    }
  }
}

export function preset(id: TemplateId): Line[] {
  return TEMPLATES[id].lines.map((text, index) => ({ id: `${id}-${index}`, text }));
}

export function scriptDocument(id: TemplateId): string {
  return JSON.stringify({ template: id, lines: TEMPLATES[id].lines }, null, 2);
}

const MIN_FRAMES = 30 * FPS;
const MAX_FRAMES = 60 * FPS;
const TARGET_FRAMES = 45 * FPS;
const LEAD_FRAMES = 3 * FPS;
const TAIL_FRAMES = 3 * FPS;
const GAP_FRAMES = 8;

export function parseScript(source: string): { template: TemplateId; lines: Line[] } {
  const trimmed = source.trim();
  if (!trimmed) throw new Error("Paste a script or JSON file.");
  if (trimmed.startsWith("{")) return parseJsonScript(trimmed);
  return parseTextScript(trimmed);
}

export function planLines(lines: Line[]): Plan {
  const cleaned = lines.map((line) => ({ ...line, text: line.text.trim() })).filter((line) => line.text.length > 0);
  if (cleaned.length === 0) return { lines: [], durationInFrames: FPS * 2 };
  const drafts = cleaned.map((line) => {
    const tokens = line.text.split(/\s+/).filter(Boolean);
    const natural = Math.max(FPS, tokens.length, Math.round(tokens.length * 0.42 * FPS));
    return { line, tokens, natural };
  });
  const gaps = GAP_FRAMES * Math.max(0, drafts.length - 1);
  const naturalBody = drafts.reduce((total, draft) => total + draft.natural, 0);
  const desiredBody = Math.max(drafts.length, TARGET_FRAMES - LEAD_FRAMES - TAIL_FRAMES - gaps);
  let frames = drafts.map((draft) => Math.max(draft.tokens.length, Math.round(draft.natural * (desiredBody / naturalBody))));
  const drift = desiredBody - frames.reduce((total, count) => total + count, 0);
  const last = frames.length - 1;
  frames[last] = Math.max(drafts[last]?.tokens.length ?? 1, frames[last] + drift);
  let cursor = LEAD_FRAMES;
  const timed: TimedLine[] = drafts.map((draft, index) => {
    const lineFrames = frames[index] ?? draft.natural;
    const words = timeWords(draft.tokens, lineFrames);
    const start = cursor;
    cursor += lineFrames;
    if (index < drafts.length - 1) cursor += GAP_FRAMES;
    return { ...draft.line, words, start, end: start + lineFrames };
  });
  let durationInFrames = cursor + TAIL_FRAMES;
  if (durationInFrames < MIN_FRAMES || durationInFrames > MAX_FRAMES) {
    const fitted = fitDuration(timed, durationInFrames);
    return fitted;
  }
  return { lines: timed, durationInFrames };
}

function parseJsonScript(source: string): { template: TemplateId; lines: Line[] } {
  let data: { template?: unknown; lines?: unknown };
  try {
    data = JSON.parse(source) as { template?: unknown; lines?: unknown };
  } catch {
    throw new Error("That JSON could not be read.");
  }
  if (typeof data.template !== "string" || !Array.isArray(data.lines)) {
    throw new Error("JSON needs a template and a lines array.");
  }
  const template = asTemplate(data.template);
  const lines = data.lines.map((line, index) => {
    if (typeof line !== "string") throw new Error("Each line must be text.");
    return { id: `${template}-${index}`, text: line };
  });
  if (lines.every((line) => line.text.trim().length === 0)) throw new Error("Add at least one line.");
  return { template, lines };
}

function parseTextScript(source: string): { template: TemplateId; lines: Line[] } {
  const rows = source.split(/\r?\n/);
  let template: TemplateId = "hook";
  let start = 0;
  const header = /^template\s*:\s*(hook|list|story)\s*$/i.exec(rows[0]?.trim() ?? "");
  if (header?.[1]) {
    template = asTemplate(header[1].toLowerCase());
    start = 1;
  }
  const lines = rows
    .slice(start)
    .map((row) => row.trim())
    .filter((row) => row.length > 0)
    .map((text, index) => ({ id: `${template}-${index}`, text }));
  if (lines.length === 0) throw new Error("Add at least one line.");
  return { template, lines };
}

function asTemplate(value: string): TemplateId {
  switch (value) {
    case "hook":
    case "list":
    case "story":
      return value;
    default:
      throw new Error(`Unknown template "${value}". Use hook, list, or story.`);
  }
}

function timeWords(tokens: string[], frames: number): TimedWord[] {
  const safe = Math.max(frames, tokens.length);
  const base = Math.floor(safe / tokens.length);
  let extra = safe - base * tokens.length;
  let used = 0;
  return tokens.map((token) => {
    const share = base + (extra > 0 ? 1 : 0);
    if (extra > 0) extra -= 1;
    const start = used;
    used += share;
    return { text: token, start, end: used };
  });
}

function fitDuration(lines: TimedLine[], durationInFrames: number): Plan {
  const span = Math.min(MAX_FRAMES, Math.max(MIN_FRAMES, durationInFrames));
  if (span === durationInFrames || lines.length === 0) return { lines, durationInFrames: span };
  const last = lines[lines.length - 1];
  if (!last) return { lines, durationInFrames: span };
  const delta = span - durationInFrames;
  const nextFrames = Math.max(last.words.length, last.end - last.start + delta);
  const words = timeWords(
    last.words.map((word) => word.text),
    nextFrames,
  );
  const fitted = lines.map((line, index) =>
    index === lines.length - 1 ? { ...line, words, end: line.start + nextFrames } : line,
  );
  const tail = span - (fitted[fitted.length - 1]?.end ?? 0);
  return { lines: fitted, durationInFrames: (fitted[fitted.length - 1]?.end ?? 0) + Math.max(0, tail) };
}
