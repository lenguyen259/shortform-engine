import { AbsoluteFill, Audio, Loop, interpolate, useCurrentFrame } from "remotion";
import { FPS, planLines, templateLabel, type Line, type Plan, type TemplateId, type TimedLine } from "../lib/plan";

export type ShortProps = {
  lines: Line[];
  template: TemplateId;
};

const BED_FRAMES = FPS * 4;
const SAFE_X = 96;
const SANS = "Arial, Helvetica, sans-serif";
const DISPLAY = "Georgia, 'Times New Roman', serif";

export function Short({ lines, template }: ShortProps) {
  const frame = useCurrentFrame();
  const plan = planLines(lines);
  const theme = themeFor(template);
  const placed = place(plan, frame);
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <AbsoluteFill style={{ background: theme.bg, color: theme.ink, fontFamily: SANS, overflow: "hidden" }}>
      <Loop durationInFrames={BED_FRAMES}>
        <Audio src="/bed.wav" volume={0.18} />
      </Loop>
      <Backdrop template={template} frame={reduced ? 0 : frame} theme={theme} />
      <div style={{ position: "absolute", top: 120, left: SAFE_X, right: SAFE_X, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ letterSpacing: "0.22em", fontSize: 22, fontWeight: 700 }}>{templateLabel(template).toUpperCase()}</span>
        <span style={{ fontSize: 22, letterSpacing: "0.08em", opacity: 0.72 }}>{String((placed?.index ?? 0) + 1).padStart(2, "0")}</span>
      </div>
      {placed ? (
        <Stage placed={placed} frame={frame} theme={theme} template={template} reduced={reduced} />
      ) : frame < (plan.lines[0]?.start ?? 24) ? (
        <TitleCard template={template} theme={theme} />
      ) : (
        <EndCard theme={theme} />
      )}
      <div style={{ position: "absolute", left: SAFE_X, right: SAFE_X, bottom: 72, height: 6, background: "rgba(255,255,255,0.16)" }}>
        <div style={{ width: `${Math.min(100, (frame / Math.max(plan.durationInFrames, 1)) * 100)}%`, height: "100%", background: theme.accent }} />
      </div>
    </AbsoluteFill>
  );
}

type Placed = { line: TimedLine; index: number; wordIndex: number };

function place(plan: Plan, frame: number): Placed | null {
  const index = plan.lines.findIndex((line) => frame >= line.start && frame < line.end);
  if (index < 0) return null;
  const line = plan.lines[index];
  const local = frame - line.start;
  const wordIndex = Math.max(0, line.words.findIndex((word) => local >= word.start && local < word.end));
  return { line, index, wordIndex };
}

function Stage({
  placed,
  frame,
  theme,
  template,
  reduced,
}: {
  placed: Placed;
  frame: number;
  theme: Theme;
  template: TemplateId;
  reduced: boolean;
}) {
  const local = frame - placed.line.start;
  const word = placed.line.words[placed.wordIndex];
  const wordStart = word?.start ?? 0;
  const pop = reduced ? 1 : interpolate(local - wordStart, [0, 6], [0.98, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  switch (template) {
    case "list":
      return <ListCard placed={placed} theme={theme} pop={pop} />;
    case "story":
      return <StoryCard placed={placed} theme={theme} pop={pop} />;
    case "hook":
      return <HookCard placed={placed} theme={theme} pop={pop} />;
    default: {
      const unexpected: never = template;
      return unexpected;
    }
  }
}

function LineWords({ placed, active, idle }: { placed: Placed; active: string; idle: string }) {
  return (
    <>
      {placed.line.words.map((item, index) => (
        <span key={`${item.text}-${item.start}`} style={{ color: index === placed.wordIndex ? active : idle }}>
          {item.text}{" "}
        </span>
      ))}
    </>
  );
}

function HookCard({ placed, theme, pop }: { placed: Placed; theme: Theme; pop: number }) {
  return (
    <div style={{ position: "absolute", left: SAFE_X, right: SAFE_X, top: 640 }}>
      <div style={{ width: 72, height: 8, background: theme.accent, marginBottom: 28 }} />
      <p style={{ margin: 0, fontSize: 78, lineHeight: 1.02, fontWeight: 800, letterSpacing: "-0.035em", transform: `scale(${pop})`, transformOrigin: "left center" }}>
        <LineWords placed={placed} active={theme.accent} idle={theme.ink} />
      </p>
    </div>
  );
}

function ListCard({ placed, theme, pop }: { placed: Placed; theme: Theme; pop: number }) {
  return (
    <div style={{ position: "absolute", left: SAFE_X, right: SAFE_X, top: 520 }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 180, lineHeight: 0.8, fontWeight: 700, color: theme.accent }}>{String(placed.index + 1).padStart(2, "0")}</div>
      <p style={{ margin: "28px 0 0", fontSize: 64, lineHeight: 1.08, fontWeight: 800, transform: `scale(${pop})`, transformOrigin: "left center" }}>
        <LineWords placed={placed} active={theme.ink} idle="rgba(244,247,239,0.42)" />
      </p>
    </div>
  );
}

function StoryCard({ placed, theme, pop }: { placed: Placed; theme: Theme; pop: number }) {
  return (
    <div style={{ position: "absolute", left: SAFE_X, right: SAFE_X, bottom: 240 }}>
      <div style={{ height: 6, width: 72, background: theme.accent, marginBottom: 22 }} />
      <p style={{ margin: 0, fontSize: 52, lineHeight: 1.16, fontWeight: 750, transform: `scale(${pop})`, transformOrigin: "left center" }}>
        <LineWords placed={placed} active={theme.accent} idle={theme.ink} />
      </p>
    </div>
  );
}

function TitleCard({ template, theme }: { template: TemplateId; theme: Theme }) {
  return (
    <div style={{ position: "absolute", left: SAFE_X, right: SAFE_X, top: 700 }}>
      <div style={{ width: 72, height: 8, background: theme.accent, marginBottom: 28 }} />
      <p style={{ margin: 0, fontFamily: DISPLAY, fontSize: 108, lineHeight: 0.9, fontWeight: 700 }}>{templateLabel(template)}</p>
      <p style={{ margin: "28px 0 0", fontSize: 32, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.accent }}>From a script</p>
    </div>
  );
}

function EndCard({ theme }: { theme: Theme }) {
  return (
    <div style={{ position: "absolute", left: SAFE_X, right: SAFE_X, top: 720 }}>
      <div style={{ width: 72, height: 8, background: theme.accent, marginBottom: 28 }} />
      <p style={{ margin: 0, fontFamily: DISPLAY, fontSize: 92, lineHeight: 0.92, fontWeight: 700 }}>Cut locked.</p>
      <p style={{ margin: "24px 0 0", fontSize: 30, letterSpacing: "0.12em", textTransform: "uppercase", color: theme.accent }}>Rendered in the browser</p>
    </div>
  );
}

function Backdrop({ template, frame, theme }: { template: TemplateId; frame: number; theme: Theme }) {
  const drift = interpolate(frame % 180, [0, 180], [0, 24]);
  switch (template) {
    case "list":
      return <AbsoluteFill style={{ background: `radial-gradient(circle at ${18 + drift / 8}% 78%, rgba(215,255,74,0.14), transparent 42%)` }} />;
    case "story":
      return (
        <AbsoluteFill>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 160, background: "#07080d" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 200, background: "#07080d" }} />
          <AbsoluteFill style={{ background: theme.glow }} />
        </AbsoluteFill>
      );
    case "hook":
      return <AbsoluteFill style={{ background: `radial-gradient(circle at 50% ${16 + drift / 12}%, rgba(245,196,81,0.2), transparent 46%)` }} />;
    default: {
      const unexpected: never = template;
      return unexpected;
    }
  }
}

type Theme = { bg: string; glow: string; ink: string; accent: string };

function themeFor(template: TemplateId): Theme {
  switch (template) {
    case "hook":
      return { bg: "#0c0c0c", glow: "transparent", ink: "#f4f1ea", accent: "#f5c451" };
    case "list":
      return { bg: "#101311", glow: "transparent", ink: "#f4f7ef", accent: "#d7ff4a" };
    case "story":
      return { bg: "#0e1016", glow: "radial-gradient(circle at 80% 18%, rgba(240,226,196,0.12), transparent 36%)", ink: "#f7f1e6", accent: "#f0e2c4" };
    default: {
      const unexpected: never = template;
      return unexpected;
    }
  }
}
