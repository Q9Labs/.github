// Draws the waveform on the kiosk illustration's screen. The canvas covers art pixels x 196–288,
// y 166–326 of kiosk.webp (464×760), repaints the screen over the static waveform, and draws bars
// that rest in the art's shape and move while the kiosk speaks. The bars lean with the screen.
const BOX_W = 92;
const CENTER = [46.5, 82];
const SHEAR_X = 0.055;
const SHEAR_Y = 0.035;
const SPACING = 7.85;
const BAR_W = 3;
const REST = [9, 32, 22, 51, 68, 105, 61, 37, 17, 29, 9];
const PEAK = [34, 52, 66, 84, 102, 118, 102, 84, 66, 52, 34];
const SCREEN = 'rgb(17,33,38)';

export function createKioskScreen(canvas, readVoiceLevels) {
  const context = canvas.getContext('2d');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const heights = REST.slice();
  const levels = new Float32Array(6);
  let mode = 'rest';
  let frame = 0;
  let startedAt = 0;
  let scale = 1;

  new ResizeObserver(() => {
    const box = canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(box.width * ratio);
    canvas.height = Math.round(box.height * ratio);
    scale = canvas.width / BOX_W;
    draw();
  }).observe(canvas);

  function draw() {
    const { width, height } = canvas;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);
    // Screen colour with soft edges: only the blurred shadow of an off-canvas rect lands here.
    const feather = 5 * scale;
    context.shadowColor = SCREEN;
    context.shadowBlur = feather;
    context.shadowOffsetX = width * 2;
    context.fillRect(feather - width * 2, feather, width - feather * 2, height - feather * 2);
    context.shadowOffsetX = 0;
    context.setTransform(scale, SHEAR_Y * scale, SHEAR_X * scale, scale, CENTER[0] * scale, CENTER[1] * scale);
    // A wide teal halo first, then the bright bar cores, like the glow in the art.
    for (const [fill, glow, blur, widen] of [['rgba(6,170,190,.2)', 'rgba(6,203,222,.45)', 10, 2.4], ['#90ffff', 'rgba(6,203,222,.95)', 3, 1]]) {
      const w = BAR_W * widen;
      context.fillStyle = fill;
      context.shadowColor = glow;
      context.shadowBlur = blur * scale;
      context.beginPath();
      heights.forEach((barHeight, index) => {
        const h = Math.max(barHeight, w);
        context.roundRect((index - 5) * SPACING - w / 2, -h / 2, w, h, w / 2);
      });
      context.fill();
    }
    context.shadowBlur = 0;
  }

  function targetFor(index, seconds) {
    if (mode === 'rest') return REST[index];
    const band = Math.abs(index - 5);
    if (mode === 'live') return PEAK[index] * (0.12 + 0.95 * levels[band]);
    const syllables = 0.3 + 0.7 * Math.abs(Math.sin(seconds * 5.3)) * (0.55 + 0.45 * Math.sin(seconds * 1.7 + 0.6));
    const wobble = 0.72 + 0.28 * Math.sin(seconds * (6.5 + index * 1.15) + index * 1.9);
    return PEAK[index] * syllables * wobble;
  }

  function tick(now) {
    if (mode === 'live' && !readVoiceLevels(levels)) levels.fill(0);
    const seconds = (now - startedAt) / 1000;
    let moving = mode !== 'rest';
    heights.forEach((current, index) => {
      const target = targetFor(index, seconds);
      const next = current + (target - current) * (target > current ? 0.45 : 0.16);
      heights[index] = next;
      if (Math.abs(target - next) > 0.3) moving = true;
    });
    draw();
    frame = moving ? requestAnimationFrame(tick) : 0;
  }

  function run() {
    if (!frame) frame = requestAnimationFrame(tick);
  }

  return {
    speak(kind) {
      if (reducedMotion.matches) return;
      mode = kind;
      startedAt = performance.now();
      run();
    },
    quiet(immediately = false) {
      mode = 'rest';
      if (!immediately && !reducedMotion.matches) return run();
      cancelAnimationFrame(frame);
      frame = 0;
      REST.forEach((value, index) => { heights[index] = value; });
      draw();
    }
  };
}
