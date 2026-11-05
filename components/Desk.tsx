"use client";

import { useMemo, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { Short } from "../remotion/Short";
import { FPS, planLines, preset, templateLabel, type Line, type TemplateId } from "../lib/plan";

const TEMPLATES: TemplateId[] = ["hook", "list", "story"];

export function Desk() {
  const [template, setTemplate] = useState<TemplateId>("hook");
  const [lines, setLines] = useState<Line[]>(() => preset("hook"));
  const [note, setNote] = useState("");
  const player = useRef<PlayerRef>(null);
  const plan = useMemo(() => planLines(lines), [lines]);

  function choose(next: TemplateId) {
    setTemplate(next);
    setLines(preset(next));
    setNote("");
  }

  function update(id: string, text: string) {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, text } : line)));
  }

  function playWithVoice() {
    const text = lines.map((line) => line.text.trim()).filter(Boolean).join(". ");
    if (!text) {
      setNote("Add a line before playing.");
      return;
    }
    if (!("speechSynthesis" in window)) {
      setNote("This browser has no speech synthesis.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
    player.current?.seekTo(0);
    player.current?.play();
    setNote("Voice is the browser speech engine. Captions stay on the timeline.");
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
