// Regenerates the attract-loop voice lines from public/assets/voice/voice-lines.json.
// Run: node --env-file=/path/to/.env.local scripts/generate-voice.mjs [--force] [key ...]
// Needs CARTESIA_API_KEY in the environment and ffmpeg on PATH. Writes loudness-matched mono
// 64 kbps MP3s and records each line's length in seconds.
import { readFile, writeFile, access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../public/assets/voice/', import.meta.url));
const scriptPath = dir + 'voice-lines.json';
const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter(arg => !arg.startsWith('--'));
const apiKey = process.env.CARTESIA_API_KEY;
if (!apiKey) throw new Error('CARTESIA_API_KEY is not set. Pass --env-file with the Cartesia key.');

const script = JSON.parse(await readFile(scriptPath, 'utf8'));
const exists = path => access(path).then(() => true, () => false);

for (const line of script.lines) {
  if (only.length && !only.includes(line.key)) continue;
  const out = dir + line.file;
  if (!force && await exists(out)) {
    line.seconds = duration(out);
    continue;
  }
  const response = await fetch('https://api.cartesia.ai/tts/bytes', {
    method: 'POST',
    headers: { 'X-API-Key': apiKey, 'Cartesia-Version': '2025-04-16', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model_id: script.voice.model,
      transcript: line.say || line.text,
      voice: { mode: 'id', id: script.voice.id },
      language: line.lang,
      output_format: { container: 'mp3', sample_rate: 44100, bit_rate: 64000 }
    })
  });
  if (!response.ok) throw new Error(`Cartesia failed for "${line.key}": ${response.status} ${await response.text()}`);
  const raw = `${tmpdir()}/q9-voice-${line.key}.mp3`;
  await writeFile(raw, Buffer.from(await response.arrayBuffer()));
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-af', 'loudnorm=I=-18:TP=-2:LRA=11', '-ac', '1', '-ar', '44100', '-b:a', '64k', out]);
  await rm(raw);
  line.seconds = duration(out);
  console.log(`${line.key}: ${line.seconds}s`);
}
await writeFile(scriptPath, JSON.stringify(script, null, 2) + '\n');

function duration(path) {
  const seconds = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], { encoding: 'utf8' });
  return Math.round(Number(seconds) * 100) / 100;
}
