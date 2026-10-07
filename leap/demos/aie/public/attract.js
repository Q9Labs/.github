// Attract mode for the stand laptop: after a quiet spell, spotlight one product at a time, swap the
// hero word, and let the kiosk speak its line. Any visitor input stops it at once.
import { initSound, canSpeak, cue, loadVoice, playVoice, stopAll, voiceLevels, pauseSound, resumeSound } from './sound.js';
import { createKioskScreen } from './kiosk-screen.js';

const IDLE_MS = 20_000;
const FIRST_START_MS = 4_000;
// Speak one full round in every SPOKEN_ROUND_EVERY rounds; the rounds between are motion only,
// so the people working the stand don't hear the script on repeat all day.
const SPOKEN_ROUND_EVERY = 2;
const STEP_MS = 7_000;
const ROUND_REST_MS = 10_000;
const BUBBLE_SWAP_MS = 220;
const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'];

export function startAttract({ root, products }) {
  const words = [...root.querySelectorAll('.hero-word [data-word]')];
  const cards = [...root.querySelectorAll('.product-card[data-key]')];
  const bubble = root.querySelector('.kiosk-bubble');
  const bubbleIcon = bubble.querySelector('.bubble-icon');
  const bubbleName = bubble.querySelector('.bubble-name');
  const bubbleLine = bubble.querySelector('.bubble-line');
  const screen = createKioskScreen(root.querySelector('.kiosk-wave'), voiceLevels);
  initSound(root.querySelector('#sound-toggle'));

  let script = null;
  let position = 0;
  let round = 0;
  let run = null;
  let idleTimer = 0;
  let flushTimer = 0;
  let bubbleTimer = 0;
  let currentWord = 'everyone';
  let lastActivity = performance.now();
  const idleCallbacks = [];

  function showWord(word) {
    if (word === currentWord) return;
    for (const element of words) {
      element.classList.toggle('is-leaving', element.dataset.word === currentWord);
      element.classList.toggle('is-current', element.dataset.word === word);
    }
    currentWord = word;
  }

  function spotlight(key) {
    for (const card of cards) card.classList.toggle('is-spotlit', card.dataset.key === key);
  }

  function showBubble(line, product) {
    clearTimeout(bubbleTimer);
    if (!line.text) return hideBubble();
    const fill = () => {
      bubbleName.textContent = line.name;
      bubbleLine.textContent = line.text;
      bubbleLine.lang = line.lang || 'en';
      bubbleLine.dir = line.lang === 'ar' ? 'rtl' : 'ltr';
      bubbleLine.classList.toggle('arabic', line.lang === 'ar');
      bubbleIcon.hidden = !product;
      if (product) bubbleIcon.src = `/assets/art/icon-${product.icon || product.key}.webp`;
      bubble.classList.add('is-visible');
    };
    if (!bubble.classList.contains('is-visible')) return fill();
    bubble.classList.remove('is-visible');
    bubbleTimer = setTimeout(fill, BUBBLE_SWAP_MS);
  }

  function hideBubble() {
    clearTimeout(bubbleTimer);
    bubble.classList.remove('is-visible');
  }

  async function loadScript() {
    try {
      const response = await fetch('/assets/voice/voice-lines.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()).lines;
    } catch (error) {
      console.warn('Voice lines unavailable, so attract mode runs without the kiosk lines', error);
      return [{ key: 'intro' }, ...products.map(product => ({ key: product.key })), { key: 'outro' }];
    }
  }

  async function playLine(line, session, spokenRound) {
    const started = performance.now();
    const product = products.find(item => item.key === line.key);
    const speak = spokenRound && Boolean(line.file) && canSpeak();
    const voice = speak ? loadVoice(`/assets/voice/${line.file}`) : null;
    showWord(product ? product.word : 'everyone');
    spotlight(product?.key);
    if (speak && product) cue('tick');
    showBubble(line, product);
    await session.wait(450);
    if (session.cancelled) return;
    let buffer = null;
    if (speak) {
      await session.wait(cue(line.key) * 1000);
      buffer = await voice.catch(error => { console.warn(`Voice line ${line.file} could not load`, error); return null; });
      if (session.cancelled) return;
    }
    if (buffer && canSpeak()) {
      screen.speak('live');
      await playVoice(buffer);
    } else if (line.text) {
      screen.speak('synthetic');
      await session.wait((line.seconds || 3.5) * 1000);
    }
    if (session.cancelled) return;
    screen.quiet();
    await session.wait(Math.max(900, STEP_MS - (performance.now() - started)));
  }

  async function loop(session) {
    script ??= await loadScript();
    while (!session.cancelled) {
      await playLine(script[position], session, round % SPOKEN_ROUND_EVERY === 0);
      if (session.cancelled) return;
      position = (position + 1) % script.length;
      if (position === 0) {
        spotlight(null);
        await session.wait(ROUND_REST_MS);
        round += 1;
      }
    }
  }

  function startLoop() {
    if (run || document.hidden) return;
    run = createSession();
    loop(run).catch(error => console.error('Attract mode stopped', error));
  }

  function stopLoop() {
    if (!run) return;
    run.cancel();
    run = null;
    stopAll();
    screen.quiet(true);
    showWord('everyone');
    spotlight(null);
    hideBubble();
  }

  function scheduleIdle(ms) {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(onIdle, ms);
  }

  function onIdle() {
    if (document.hidden) return;
    flushIdleCallbacks();
    startLoop();
  }

  function flushIdleCallbacks() {
    if (!idleCallbacks.length || document.hidden) return;
    const wait = IDLE_MS - (performance.now() - lastActivity);
    clearTimeout(flushTimer);
    if (wait > 0) flushTimer = setTimeout(flushIdleCallbacks, wait);
    else for (const callback of idleCallbacks.splice(0)) callback();
  }

  function onActivity(event) {
    if (event.type === 'pointermove' && !event.movementX && !event.movementY) return;
    lastActivity = performance.now();
    stopLoop();
    scheduleIdle(IDLE_MS);
  }

  for (const type of ACTIVITY_EVENTS) addEventListener(type, onActivity, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopLoop();
      clearTimeout(idleTimer);
      pauseSound();
    } else {
      resumeSound();
      scheduleIdle(IDLE_MS);
      flushIdleCallbacks();
    }
  });
  if (!document.hidden) scheduleIdle(FIRST_START_MS);

  return {
    // Runs `callback` once nobody has touched the page for IDLE_MS and the tab is visible.
    whenIdle(callback) {
      idleCallbacks.push(callback);
      flushIdleCallbacks();
    }
  };
}

// A cancellable run of the loop: cancel() wakes every pending wait so the loop can exit cleanly.
function createSession() {
  const pending = new Set();
  const session = {
    cancelled: false,
    wait(ms) {
      return new Promise(resolve => {
        if (session.cancelled) return resolve();
        const entry = { resolve, timer: setTimeout(() => { pending.delete(entry); resolve(); }, ms) };
        pending.add(entry);
      });
    },
    cancel() {
      session.cancelled = true;
      for (const { timer, resolve } of pending) { clearTimeout(timer); resolve(); }
      pending.clear();
    }
  };
  return session;
}
