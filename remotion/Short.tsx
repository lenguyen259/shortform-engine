import { AbsoluteFill, Audio, Loop, interpolate, useCurrentFrame } from "remotion";
import { FPS, planLines, templateLabel, type Line, type TemplateId, type TimedLine } from "../lib/plan";

export type ShortProps = {
  lines: Line[];
  template: TemplateId;
};

const BED_FRAMES = FPS * 4;

export function Short({ lines, template }: ShortProps) {
  const frame = useCurrentFrame();
  const plan = planLines(lines);
  const active = plan.lines.find((line) => frame >= line.start && frame < line.end) ?? null;
  const last = plan.lines[plan.lines.length - 1];
  const finished = last !== undefined && frame >= last.end;
  const theme = themeFor(template);

  return (
    <AbsoluteFill style={{ background: theme.bg, color: theme.ink, fontFamily: "Georgia, serif" }}>
      <Loop durationInFrames={BED_FRAMES}>
        <Audio src="/bed.wav" volume={0.22} />
      </Loop>
      <AbsoluteFill style={{ background: theme.glow }} />
      <div style={{ position: "absolute", top: 88, left: 72, right: 72, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "Segoe UI, sans-serif", letterSpacing: "0.18em", fontSize: 28, fontWeight: 700 }}>
          {templateLabel(template).toUpperCase()}
        </span>
        <span style={{ fontFamily: "Segoe UI, sans-serif", fontSize: 28 }}>{String(activeIndex(plan.lines, frame) + 1).padStart(2, "0")}</span>
      </div>
      {active ? (
        <LineCard line={active} frame={frame} theme={theme} template={template} index={activeIndex(plan.lines, frame)} />
      ) : finished ? (
        <EndCard theme={theme} />
      ) : (
        <TitleCard template={template} theme={theme} />
      )}
      <div style={{ position: "absolute", left: 72, right: 72, bottom: 80, height: 10, background: "rgba(255,255,255,0.18)", borderRadius: 99 }}>
        <div
          style={{
            width: `${Math.min(100, (frame / Math.max(plan.durationInFrames, 1)) * 100)}%`,
            height: "100%",
            background: theme.accent,
            borderRadius: 99,
          }}
        />
      </div>
    </AbsoluteFill>
  );
}

function LineCard({
  line,
  frame,
  theme,
  template,
  index,
}: {
  line: TimedLine;
  frame: number;
  theme: Theme;
  template: TemplateId;
  index: number;
}) {
  const local = frame - line.start;
  const rise = interpolate(local, [0, 10], [36, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = interpolate(local, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const activeWord = line.words.findIndex((word) => local >= word.start && local < word.end);

  return (
    <div style={{ position: "absolute", left: 72, right: 72, top: 280, transform: `translateY(${rise}px)`, opacity }}>
      {template === "list" ? (
        <div style={{ fontSize: 180, lineHeight: 0.8, color: theme.accent, fontWeight: 700 }}>{String(index + 1).padStart(2, "0")}</div>
      ) : null}
      <p style={{ margin: "24px 0 0", fontSize: 86, lineHeight: 1.05, fontWeight: 700 }}>
        {line.words.map((word, wordIndex) => (
          <span key={`${word.text}-${word.start}`} style={{ color: wordIndex === activeWord ? theme.accent : theme.ink }}>
            {word.text}{" "}
          </span>
        ))}
      </p>
    </div>
  );
}

function TitleCard({ template, theme }: { template: TemplateId; theme: Theme }) {
  return (
    <div style={{ position: "absolute", left: 72, right: 72, top: 560 }}>
      <p style={{ margin: 0, fontSize: 104, lineHeight: 0.9, fontWeight: 700 }}>{templateLabel(template)}</p>
      <p style={{ margin: "20px 0 0", fontFamily: "Segoe UI, sans-serif", fontSize: 36, color: theme.accent }}>From a script</p>
    </div>
  );
}

function EndCard({ theme }: { theme: Theme }) {
  return (
    <div style={{ position: "absolute", left: 72, right: 72, top: 620 }}>
      <p style={{ margin: 0, fontSize: 92, lineHeight: 0.95, fontWeight: 700 }}>Cut locked.</p>
      <p style={{ margin: "24px 0 0", fontFamily: "Segoe UI, sans-serif", fontSize: 36, color: theme.accent }}>Rendered in the browser</p>
    </div>
  );
}

type Theme = { bg: string; glow: string; ink: string; accent: string };

function themeFor(template: TemplateId): Theme {
  switch (template) {
    case "hook":
      return { bg: "#16120e", glow: "radial-gradient(circle at 50% 18%, rgba(255,92,28,0.35), transparent 42%)", ink: "#f6f0e6", accent: "#ff5c1c" };
    case "list":
      return { bg: "#10170f", glow: "radial-gradient(circle at 20% 80%, rgba(198,242,109,0.22), transparent 40%)", ink: "#f4f7ef", accent: "#c6f26d" };
    case "story":
      return { bg: "#171b2e", glow: "radial-gradient(circle at 80% 10%, rgba(232,214,176,0.2), transparent 36%)", ink: "#f7f1e6", accent: "#e8d6b0" };
    default: {
      const unexpected: never = template;
      return unexpected;
    }
  }
}

function activeIndex(lines: TimedLine[], frame: number): number {
  const index = lines.findIndex((line) => frame >= line.start && frame < line.end);
  if (index >= 0) return index;
  return Math.max(0, lines.length - 1);
}
