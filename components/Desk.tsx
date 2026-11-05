"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { Short } from "../remotion/Short";
import { FPS, parseScript, planLines, scriptDocument, templateLabel, type Line, type TemplateId } from "../lib/plan";
import { FrameVoice, type SpokenWord } from "../lib/voice";

export function Desk() {
  const [script, setScript] = useState(() => scriptDocument("hook"));
  const [rendered, setRendered] = useState<{ template: TemplateId; lines: Line[] } | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("One render finishes the short. Nobody opens a timeline.");
  const player = useRef<PlayerRef>(null);
  const voice = useRef(new FrameVoice());
  const plan = useMemo(() => planLines(rendered?.lines ?? []), [rendered]);
  const planRef = useRef(plan);
  planRef.current = plan;

  useEffect(() => {
    let frame = 0;
    const loop = () => {
      const sample = voice.current.sample();
      const duration = planRef.current.durationInFrames;
      if (sample !== null && player.current) {
        const next = Math.max(0, Math.min(duration - 1, Math.round(sample * FPS)));
        player.current.seekTo(next);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      voice.current.stop();
    };
  }, []);

  function renderShort() {
    voice.current.stop();
    try {
      const next = parseScript(script);
      setRendered(next);
      setError("");
      setNote("Rendered. The 9:16 short is finished. Play with voice only reviews the locked frames.");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not read that script.";
      setError(message);
    }
  }

  function playWithVoice() {
    if (!rendered) {
      setNote("Render the script first.");
      return;
    }
    const words: SpokenWord[] = plan.lines.flatMap((line) =>
      line.words.map((word) => ({
        text: word.text,
        start: (line.start + word.start) / FPS,
        end: (line.start + word.end) / FPS,
      })),
    );
    if (words.length === 0) {
      setNote("The script has no spoken lines.");
      return;
    }
    if (!("speechSynthesis" in window)) {
      setNote("This browser has no speech synthesis.");
      return;
    }
    const first = words[0];
    if (!first) return;
    player.current?.pause();
    player.current?.seekTo(Math.round(first.start * FPS));
    voice.current.onEnded = (time) => {
      player.current?.seekTo(Math.min(plan.durationInFrames - 1, Math.round(time * FPS)));
      setNote("The last word landed on its frame.");
    };
    voice.current.start(words, first.start - 0.01);
    setNote("Voice is reviewing the finished short. The active word is the word you hear.");
  }

  const seconds = plan.durationInFrames / FPS;

  return (
    <main className="desk">
      <section className="editor">
        <p className="eyebrow">Zero-touch factory</p>
        <h1>Shortform</h1>
        <p className="lede">A script or JSON file goes in. Remotion returns a finished 9:16 short. Template is data in the script.</p>
        <ul className="chips">
          <li><span>ElevenLabs</span><b>speechSynthesis</b></li>
          <li><span>Premiere templates</span><b>Remotion</b></li>
          <li><span>Licensed music</span><b>Original bed</b></li>
        </ul>
        <label className="script-box">
          <span>Script</span>
          <textarea
            value={script}
            rows={14}
            spellCheck={false}
            onChange={(event) => {
              voice.current.stop();
              setScript(event.target.value);
            }}
          />
        </label>
        <button type="button" className="primary" onClick={renderShort}>
          Render short
        </button>
        <button type="button" className="secondary" onClick={playWithVoice} disabled={!rendered}>
          Play with voice
        </button>
        {rendered ? (
          <p className="meta">
            Finished 9:16 · {seconds.toFixed(1)}s · {templateLabel(rendered.template)} from the script · {plan.lines.reduce((total, line) => total + line.words.length, 0)} words
          </p>
        ) : (
          <p className="meta">Waiting for one render. Target length is 30–60 seconds.</p>
        )}
        {error ? <p className="note">{error}</p> : null}
        {note ? <p className="note">{note}</p> : null}
      </section>
      <section className="stage">
        <div className="phone">
          {rendered ? (
            <Player
              ref={player}
              key={`${rendered.template}-${plan.durationInFrames}-${rendered.lines.map((line) => line.text).join("|")}`}
              component={Short}
              inputProps={{ lines: rendered.lines, template: rendered.template }}
              durationInFrames={plan.durationInFrames}
              fps={FPS}
              compositionWidth={1080}
              compositionHeight={1920}
              style={{ width: "100%", height: "100%" }}
              autoPlay
              controls={false}
              loop
            />
          ) : (
            <div className="hold">
              <p>9:16</p>
              <strong>Finished short lands here</strong>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
