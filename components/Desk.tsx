"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { Short } from "../remotion/Short";
import { FPS, planLines, preset, templateLabel, type Line, type TemplateId } from "../lib/plan";
import { FrameVoice, type SpokenWord } from "../lib/voice";

const TEMPLATES: TemplateId[] = ["hook", "list", "story"];

export function Desk() {
  const [template, setTemplate] = useState<TemplateId>("hook");
  const [lines, setLines] = useState<Line[]>(() => preset("hook"));
  const [note, setNote] = useState("Play with voice moves the frame onto each spoken word.");
  const player = useRef<PlayerRef>(null);
  const voice = useRef(new FrameVoice());
  const plan = useMemo(() => planLines(lines), [lines]);
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

  function choose(next: TemplateId) {
    voice.current.stop();
    setTemplate(next);
    setLines(preset(next));
    setNote("Play with voice moves the frame onto each spoken word.");
  }

  function update(id: string, text: string) {
    voice.current.stop();
    setLines((current) => current.map((line) => (line.id === id ? { ...line, text } : line)));
  }

  function playWithVoice() {
    const words: SpokenWord[] = plan.lines.flatMap((line) =>
      line.words.map((word) => ({
        text: word.text,
        start: (line.start + word.start) / FPS,
        end: (line.start + word.end) / FPS,
      })),
    );
    if (words.length === 0) {
      setNote("Add a line before playing.");
      return;
    }
    if (!("speechSynthesis" in window)) {
      setNote("This browser has no speech synthesis.");
      return;
    }
    player.current?.pause();
    player.current?.seekTo(Math.round(words[0].start));
    voice.current.onEnded = (time) => {
      player.current?.seekTo(Math.min(plan.durationInFrames - 1, Math.round(time * FPS)));
      setNote("The last word landed on its frame.");
    };
    voice.current.start(words, words[0].start - 0.01);
    setNote("Voice is the clock. The active word is the word you hear.");
  }

  return (
    <main className="desk">
      <section className="editor">
        <p className="eyebrow">Agent 02</p>
        <h1>Shortform</h1>
        <p className="lede">A vertical cut from a script. Remotion paints the frames. The voice is free and local.</p>
        <ul className="chips">
          <li><span>ElevenLabs</span><b>speechSynthesis</b></li>
          <li><span>Premiere templates</span><b>Remotion</b></li>
          <li><span>Licensed music</span><b>Original bed</b></li>
        </ul>
        <div className="templates">
          {TEMPLATES.map((id) => (
            <button key={id} type="button" className={id === template ? "on" : ""} onClick={() => choose(id)}>
              {templateLabel(id)}
            </button>
          ))}
        </div>
        <div className="lines">
          {lines.map((line, index) => (
            <label key={line.id}>
              <span>Line {index + 1}</span>
              <textarea value={line.text} rows={3} onChange={(event) => update(line.id, event.target.value)} />
            </label>
          ))}
        </div>
        <button type="button" className="primary" onClick={playWithVoice}>
          Play with voice
        </button>
        <p className="meta">{(plan.durationInFrames / FPS).toFixed(1)}s · {plan.lines.reduce((total, line) => total + line.words.length, 0)} words</p>
        {note ? <p className="note">{note}</p> : null}
      </section>
      <section className="stage">
        <div className="phone">
          <Player
            ref={player}
            component={Short}
            inputProps={{ lines, template }}
            durationInFrames={plan.durationInFrames}
            fps={FPS}
            compositionWidth={1080}
            compositionHeight={1920}
            style={{ width: "100%", height: "100%" }}
            controls
            loop
          />
        </div>
      </section>
    </main>
  );
}
