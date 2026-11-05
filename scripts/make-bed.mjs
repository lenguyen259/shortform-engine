import { writeFileSync } from "node:fs";

const sampleRate = 22050;
const seconds = 4;
const samples = sampleRate * seconds;
const pcm = Buffer.alloc(samples * 2);
const notes = [196, 247, 294, 392];

for (let index = 0; index < samples; index += 1) {
  const time = index / sampleRate;
  const beat = Math.floor(time * 2) % notes.length;
  const note = notes[beat];
  const envelope = Math.sin(Math.PI * ((time * 2) % 1)) ** 1.4;
  const tone = Math.sin(2 * Math.PI * note * time) * 0.55 + Math.sin(2 * Math.PI * note * 2 * time) * 0.15;
  const value = Math.max(-1, Math.min(1, tone * envelope * 0.35));
  pcm.writeInt16LE(Math.round(value * 32767), index * 2);
}

const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + pcm.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(sampleRate * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(pcm.length, 40);
writeFileSync(new URL("../public/bed.wav", import.meta.url), Buffer.concat([header, pcm]));
