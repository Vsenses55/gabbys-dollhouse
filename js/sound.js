// Playful UI sounds, synthesised with the Web Audio API — no audio files, nothing to license.
// Browsers only allow sound after the visitor has interacted with the page (a click, tap or
// key press), so the very first hover before any interaction stays silent. That's expected.
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let ctx = null;
  let master = null;

  const unlock = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.22; // overall volume
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach((t) =>
    window.addEventListener(t, unlock, { passive: true }));

  const ready = () => ctx && ctx.state === 'running' && !reduce.matches;

  // A short sine "bloop": pitch slides up, quick fade.
  function bloop(freq = 520, { slide = 1.6, dur = 0.16, gain = 0.6, type = 'sine' } = {}) {
    if (!ready()) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * slide, t + dur * 0.6);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  // Bubble pop: a tiny burst of filtered noise plus a high blip.
  function pop() {
    if (!ready()) return;
    const t = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * 0.06);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2400 + Math.random() * 1200;
    bp.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.value = 0.9;
    noise.connect(bp).connect(g).connect(master);
    noise.start(t);
    bloop(900 + Math.random() * 300, { slide: 2.2, dur: 0.09, gain: 0.35 });
  }

  // Menu: each item gets its own note of a major pentatonic scale, so moving
  // along the bar plays a little melody.
  const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5 D5 E5 G5 A5 C6
  window.gdSound = { bloop, pop, SCALE };
})();
