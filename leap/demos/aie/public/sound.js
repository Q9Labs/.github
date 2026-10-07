// Stand sound: the header toggle, synthesized cues, and voice playback with an analyser for the
// kiosk waveform. Browsers block audio until a gesture, so the toggle starts off on a new device.
import { icon } from './ui.js';

const STORAGE_KEY = 'q9-aie-sound';
const VOICE_GAIN = 0.9;
const SFX_GAIN = 0.7;
const LABELS = { off: 'Sound off', on: 'Sound on', blocked: 'Tap for sound' };

let enabled = readPreference();
let context = null;
let sfxBus = null;
let analyser = null;
let bins = null;
let button = null;
let pausedForHiddenPage = false;
let unlockedByThisGesture = false;
const active = new Set();
const buffers = new Map();

function readPreference() {
  try { return localStorage.getItem(STORAGE_KEY) === 'on'; }
  catch { return false; } // Storage can be blocked; sound then stays off until clicked.
}

function savePreference() {
  try { localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off'); }
  catch (error) { console.warn('Could not remember the sound choice', error); }
}

export function initSound(toggle) {
  button = toggle;
  if (enabled) ensureContext();
  render();
  button.addEventListener('click', onToggle);
  for (const type of ['pointerdown', 'pointerup', 'keydown']) document.addEventListener(type, unlock, { capture: true, passive: true });
  document.addEventListener('click', () => { unlockedByThisGesture = false; });
}

function ensureContext() {
  if (context) return context;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  context = new AudioContextClass();
  const master = context.createGain();
  master.connect(context.destination);
  sfxBus = context.createGain();
  sfxBus.gain.value = SFX_GAIN;
  sfxBus.connect(master);
  analyser = context.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.5;
  bins = new Uint8Array(analyser.frequencyBinCount);
  const voiceBus = context.createGain();
  voiceBus.gain.value = VOICE_GAIN;
  analyser.connect(voiceBus).connect(master);
  context.addEventListener('statechange', render);
  return context;
}

function unlock() {
  if (!enabled || !context || context.state === 'running') return;
  unlockedByThisGesture = true;
  context.resume().catch(error => console.warn('Sound could not start', error));
}

function onToggle() {
  if (unlockedByThisGesture || (enabled && context?.state !== 'running')) {
    unlockedByThisGesture = false;
    unlock();
    return;
  }
  enabled = !enabled;
  savePreference();
  if (enabled) {
    ensureContext()?.resume().then(() => cue('confirm'), error => console.warn('Sound could not start', error));
  } else {
    stopAll();
    context?.suspend();
  }
  render();
}

function render() {
  if (!button) return;
  const state = !enabled ? 'off' : context?.state === 'running' || pausedForHiddenPage ? 'on' : 'blocked';
  button.dataset.state = state;
  button.setAttribute('aria-pressed', String(enabled));
  button.innerHTML = `${icon(enabled ? 'volumeHigh' : 'volumeMute', 18)}<span>${LABELS[state]}</span>`;
}

export const canSpeak = () => enabled && context?.state === 'running';

export function pauseSound() {
  stopAll();
  if (!context || context.state !== 'running') return;
  pausedForHiddenPage = true;
  context.suspend();
}

export function resumeSound() {
  if (!pausedForHiddenPage) return;
  pausedForHiddenPage = false;
  if (enabled) context.resume().catch(error => console.warn('Sound could not resume', error));
  render();
}

export function loadVoice(url) {
  if (!buffers.has(url)) {
    const loading = fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
        return response.arrayBuffer();
      })
      .then(data => context.decodeAudioData(data));
    loading.catch(() => buffers.delete(url));
    buffers.set(url, loading);
  }
  return buffers.get(url);
}

// Resolves when the line ends or stopAll() cuts it off.
export function playVoice(buffer) {
  const source = context.createBufferSource();
  source.buffer = buffer;
  const envelope = context.createGain();
  source.connect(envelope).connect(analyser);
  const entry = { source, envelope };
  active.add(entry);
  return new Promise(resolve => {
    source.addEventListener('ended', () => { active.delete(entry); resolve(); }, { once: true });
    source.start();
  });
}

export function stopAll() {
  if (!context) return;
  const now = context.currentTime;
  for (const { source, envelope } of active) {
    envelope.gain.cancelScheduledValues(now);
    envelope.gain.setTargetAtTime(0, now, 0.015);
    source.stop(now + 0.08);
  }
}

// Fills `out` with mirrored voice band levels (0–1), quietest band last. False when silent.
export function voiceLevels(out) {
  if (!analyser || !active.size) return false;
  analyser.getByteFrequencyData(bins);
  const bands = [[2, 5], [5, 8], [8, 12], [12, 17], [17, 24], [24, 34]];
  bands.forEach(([from, to], index) => {
    let sum = 0;
    for (let bin = from; bin < to; bin++) sum += bins[bin];
    out[index] = Math.min(1, (sum / (to - from) / 255) * (1.25 + index * 0.25));
  });
  return true;
}

function note(frequency, at, { decay = 0.9, peak = 0.08, type = 'sine', attack = 0.004 } = {}) {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  envelope.gain.setValueAtTime(0, at);
  envelope.gain.linearRampToValueAtTime(peak, at + attack);
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  oscillator.connect(envelope).connect(sfxBus);
  const entry = { source: oscillator, envelope };
  active.add(entry);
  oscillator.addEventListener('ended', () => active.delete(entry), { once: true });
  oscillator.start(at);
  oscillator.stop(at + decay + 0.05);
}

// A soft glass chime: fundamental, a quiet octave, and a short bright overtone.
function chime(frequency, at, peak = 0.07, decay = 1.1) {
  note(frequency, at, { peak, decay });
  note(frequency * 2, at, { peak: peak * 0.22, decay: decay * 0.6 });
  note(frequency * 4.2, at, { peak: peak * 0.06, decay: 0.25 });
}

// A struck bell with inharmonic partials, like a kitchen service bell.
function bell(frequency, at, peak = 0.07) {
  [[1, 1, 1.6], [2.4, 0.38, 1], [3.9, 0.18, 0.6], [5.4, 0.08, 0.35]]
    .forEach(([ratio, level, decay]) => note(frequency * ratio, at, { peak: peak * level, decay, attack: 0.002 }));
}

const CUES = {
  tick: t => { note(1480, t, { peak: 0.025, decay: 0.06, attack: 0.002 }); return 0; },
  confirm: t => { chime(1318.5, t, 0.06); chime(1975.5, t + 0.1, 0.045); return 0.4; },
  intro: t => { [784, 987.8, 1174.7].forEach((f, i) => chime(f, t + i * 0.11, 0.05)); return 0.55; },
  outro: t => { chime(1174.7, t, 0.05); chime(784, t + 0.16, 0.055, 1.4); return 0.5; },
  ring: t => {
    for (const start of [0, 0.55]) for (let i = 0; i < 7; i++) note(i % 2 ? 1568 : 1318.5, t + start + i * 0.055, { peak: 0.035, decay: 0.11 });
    return 1.05;
  },
  bell: t => { bell(1568, t); return 0.55; },
  pa: t => { [523.25, 659.25, 783.99].forEach((f, i) => chime(f, t + i * 0.3, 0.07, 1.5)); return 1.05; },
  handbell: t => { [0, 0.15, 0.3].forEach(start => bell(1760, t + start, 0.035)); return 0.6; },
  chime: (t, base) => { chime(base, t); chime(base * 1.5, t + 0.13, 0.05); return 0.5; }
};
const CUE_FOR = { ava: ['ring'], mesa: ['bell'], terminal: ['pa'], edli: ['handbell'], intro: ['intro'], outro: ['outro'], nura: ['chime', 1046.5], track: ['chime', 1174.7], chalk: ['chime', 1318.5], flow: ['chime', 880], moet: ['chime', 784] };

// Plays a cue and returns how long to wait before the voice line, in seconds.
export function cue(name) {
  if (!canSpeak()) return 0;
  const [kind, base] = CUE_FOR[name] || [name];
  const play = CUES[kind] || CUES.chime;
  return play(context.currentTime + 0.02, base || 1046.5);
}
