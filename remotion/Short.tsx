import { AbsoluteFill, Audio, Loop, interpolate, useCurrentFrame } from "remotion";
import { FPS, planLines, templateLabel, type Line, type Plan, type TemplateId, type TimedLine } from "../lib/plan";

export type ShortProps = {
  lines: Line[];
  template: TemplateId;
};

const BED_FRAMES = FPS * 4;

export function Short({ lines, template }: ShortProps) {
  const frame = useCurrentFrame();
  const plan = planLines(lines);
  const theme = themeFor(template);
  const placed = place(plan, frame);

  return (
    <AbsoluteFill style={{ background: theme.bg, color: theme.ink, fontFamily: "Georgia, 'Iowan Old Style', serif", overflow: "hidden" }}>
      <Loop durationInFrames={BED_FRAMES}>
        <Audio src="/bed.wav" volume={0.18} />
      </Loop>
      <Backdrop template={template} frame={frame} theme={theme} />
      <div style={{ position: "absolute", top: 96, left: 72, right: 72, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "Segoe UI, sans-serif", letterSpacing: "0.22em", fontSize: 26, fontWeight: 700 }}>{templateLabel(template).toUpperCase()}</span>
        <span style={{ fontFamily: "Segoe UI, sans-serif", fontSize: 26, opacity: 0.7 }}>{String((placed?.index ?? 0) + 1).padStart(2, "0")}</span>
      </div>
      {placed ? <Stage placed={placed} frame={frame} theme={theme} template={template} /> : frame < (plan.lines[0]?.start ?? 12) ? <TitleCard template={template} theme={theme} /> : <EndCard theme={theme} />}
      <div style={{ position: "absolute", left: 72, right: 72, bottom: 72, height: 8, background: "rgba(255,255,255,0.16)", borderRadius: 99 }}>
        <div style={{ width: `${Math.min(100, (frame / Math.max(plan.durationInFrames, 1)) * 100)}%`, height: "100%", background: theme.accent, borderRadius: 99 }} />
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

function Stage({ placed, frame, theme, template }: { placed: Placed; frame: number; theme: Theme; template: TemplateId }) {
  const local = frame - placed.line.start;
  const word = placed.line.words[placed.wordIndex];
  const wordStart = word?.start ?? 0;
  const pop = interpolate(local - wordStart, [0, 6], [0.92, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (template === "list") return <ListCard placed={placed} theme={theme} pop={pop} />;
  if (template === "story") return <StoryCard placed={placed} theme={theme} pop={pop} />;
  return <HookCard placed={placed} theme={theme} pop={pop} />;
}

function HookCard({ placed, theme, pop }: { placed: Placed; theme: Theme; pop: number }) {
  const word = placed.line.words[placed.wordIndex]?.text ?? "";
  return (
    <div style={{ position: "absolute", left: 72, right: 72, top: 420 }}>
      <div style={{ width: 84, height: 10, background: theme.accent, marginBottom: 36 }} />
      <div style={{ fontSize: 168, lineHeight: 0.86, fontWeight: 700, letterSpacing: "-0.045em", transform: `scale(${pop})`, transformOrigin: "left center" }}>
        {word.replace(/[^\p{L}\p{N}'’-]+/gu, "")}
      </div>
      <p style={{ margin: "36px 0 0", fontFamily: "Segoe UI, sans-serif", fontSize: 42, lineHeight: 1.25, color: "rgba(246,240,230,0.72)" }}>
        {placed.line.words.map((item, index) => (
          <span key={`${item.text}-${item.start}`} style={{ color: index === placed.wordIndex ? theme.accent : "inherit" }}>
            {item.text}{" "}
          </span>
        ))}
      </p>
    </div>
  );
}

function ListCard({ placed, theme, pop }: { placed: Placed; theme: Theme; pop: number }) {
  return (
    <div style={{ position: "absolute", left: 72, right: 72, top: 360 }}>
      <div style={{ fontSize: 220, lineHeight: 0.8, fontWeight: 700, color: theme.accent, opacity: 0.95 }}>{String(placed.index + 1).padStart(2, "0")}</div>
      <p style={{ margin: "12px 0 0", fontSize: 72, lineHeight: 1.05, fontWeight: 700, transform: `scale(${pop})`, transformOrigin: "left center" }}>
        {placed.line.words.map((item, index) => (
          <span key={`${item.text}-${item.start}`} style={{ color: index === placed.wordIndex ? theme.ink : "rgba(244,247,239,0.45)" }}>
            {item.text}{" "}
          </span>
        ))}
      </p>
    </div>
  );
}

function StoryCard({ placed, theme, pop }: { placed: Placed; theme: Theme; pop: number }) {
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 560 }}>
      <div style={{ height: 220, background: "rgba(8,10,18,0.55)" }} />
      <div style={{ position: "absolute", left: 72, right: 72, top: 36, transform: `scale(${pop})`, transformOrigin: "left center" }}>
        <p style={{ margin: 0, fontSize: 58, lineHeight: 1.12, fontWeight: 700 }}>
          {placed.line.words.map((item, index) => (
            <span key={`${item.text}-${item.start}`} style={{ color: index === placed.wordIndex ? theme.accent : theme.ink }}>
              {item.text}{" "}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

function TitleCard({ template, theme }: { template: TemplateId; theme: Theme }) {
  return (
    <div style={{ position: "absolute", left: 72, right: 72, top: 620 }}>
      <p style={{ margin: 0, fontSize: 108, lineHeight: 0.88, fontWeight: 700 }}>{templateLabel(template)}</p>
      <p style={{ margin: "28px 0 0", fontFamily: "Segoe UI, sans-serif", fontSize: 36, color: theme.accent }}>From a script</p>
    </div>
  );
}

function EndCard({ theme }: { theme: Theme }) {
  return (
    <div style={{ position: "absolute", left: 72, right: 72, top: 680 }}>
      <p style={{ margin: 0, fontSize: 96, lineHeight: 0.92, fontWeight: 700 }}>Cut locked.</p>
      <p style={{ margin: "24px 0 0", fontFamily: "Segoe UI, sans-serif", fontSize: 34, color: theme.accent }}>Rendered in the browser</p>
    </div>
  );
}

function Backdrop({ template, frame, theme }: { template: TemplateId; frame: number; theme: Theme }) {
  const drift = interpolate(frame % 180, [0, 180], [0, 40]);
  if (template === "list") {
    return <AbsoluteFill style={{ background: `radial-gradient(circle at ${20 + drift / 4}% 80%, rgba(198,242,109,0.2), transparent 42%)` }} />;
  }
  if (template === "story") {
    return (
      <AbsoluteFill>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 140, background: "#07080d" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 180, background: "#07080d" }} />
        <AbsoluteFill style={{ background: theme.glow }} />
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill style={{ background: `radial-gradient(circle at 50% ${18 + drift / 10}%, rgba(255,92,28,0.42), transparent 46%)` }} />;
}

type Theme = { bg: string; glow: string; ink: string; accent: string };

function themeFor(template: TemplateId): Theme {
  switch (template) {
    case "hook":
      return { bg: "#120e0c", glow: "transparent", ink: "#f6f0e6", accent: "#ff5c1c" };
    case "list":
      return { bg: "#10160f", glow: "transparent", ink: "#f4f7ef", accent: "#c6f26d" };
    case "story":
      return { bg: "#171b2e", glow: "radial-gradient(circle at 80% 20%, rgba(232,214,176,0.16), transparent 36%)", ink: "#f7f1e6", accent: "#e8d6b0" };
    default: {
      const unexpected: never = template;
      return unexpected;
    }
  }
}
