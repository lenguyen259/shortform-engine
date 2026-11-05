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

export function planLines(lines: Line[]): Plan {
  let cursor = 12;
  const timed: TimedLine[] = lines
    .map((line) => ({ ...line, text: line.text.trim() }))
    .filter((line) => line.text.length > 0)
    .map((line) => {
      const tokens = line.text.split(/\s+/);
      const weights = tokens.map((token) => Math.max(1, token.length));
      const weightSum = weights.reduce((total, weight) => total + weight, 0);
      const frames = Math.max(FPS, Math.round(tokens.length * 0.42 * FPS));
      let wordCursor = 0;
      const words = tokens.map((token, index) => {
        const share = Math.max(4, Math.round(frames * (weights[index] / weightSum)));
        const start = wordCursor;
        wordCursor += share;
        return { text: token, start, end: wordCursor };
      });
      if (words.length > 0) words[words.length - 1].end = frames;
      const start = cursor;
      cursor += frames + 8;
      return { ...line, words, start, end: start + frames };
    });
  return { lines: timed, durationInFrames: Math.max(FPS * 2, cursor + 18) };
}
