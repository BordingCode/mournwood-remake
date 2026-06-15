// Procedural Web Audio: tactile SFX + region-themed musical beds. No files (fully offline
// PWA-safe). Everything runs through a soft reverb + gentle compressor so it stays warm and
// never harsh: slow detuned drone pads, a sparse pentatonic motif, and a soft heartbeat pulse,
// each region with its own mood (Wealdedge → Sloughfen → Blackheart).

// Region palettes: drones (Hz), a minor-pentatonic motif (Hz), motif timbre + pacing.
const REGIONS = [
  { // 0 — Wealdedge: green edge, grim but not yet hopeless
    drones: [110.0, 164.81, 220.0], detune: 0.05,
    motif: [220.0, 261.63, 293.66, 329.63, 392.0], wave: 'triangle',
    every: 2.6, mgain: 0.10, mdur: 1.1, pulse: 0.0,
  },
  { // 1 — The Sloughfen: murk, rot, sunken
    drones: [87.31, 116.54, 130.81], detune: 0.12,
    motif: [174.61, 207.65, 233.08, 261.63, 311.13], wave: 'sine',
    every: 3.2, mgain: 0.09, mdur: 1.5, pulse: 0.5,
  },
  { // 2 — The Blackheart: darkest, tense, sparse eerie bells
    drones: [73.42, 110.0, 146.83], detune: 0.18,
    motif: [587.33, 698.46, 783.99, 880.0, 1046.5], wave: 'triangle',
    every: 3.8, mgain: 0.06, mdur: 2.2, pulse: 0.7,
  },
];

export class Audio {
  constructor() { this.ctx = null; this.muted = false; this.music = null; this.bus = null; this.verb = null; }

  _c() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      // master bus: soft compressor → destination, plus a reverb send for warmth
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.knee.value = 24; comp.ratio.value = 3; comp.attack.value = 0.005; comp.release.value = 0.25;
      comp.connect(this.ctx.destination);
      this.bus = this.ctx.createGain(); this.bus.gain.value = 0.9; this.bus.connect(comp);
      // gentle reverb (generated impulse) on a parallel send
      const conv = this.ctx.createConvolver(); conv.buffer = this._impulse(1.8, 2.4);
      const send = this.ctx.createGain(); send.gain.value = 0.22;
      this.bus.connect(send).connect(conv).connect(comp);
      this.verb = send;
    }
    return this.ctx;
  }
  _impulse(dur, decay) {
    const c = this.ctx, len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return buf;
  }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
  setMuted(m) { this.muted = m; if (m) this.stopMusic(); }

  _tone({ type = 'sine', from, to, dur = 0.2, gain = 0.2, delay = 0 }) {
    if (this.muted) return;
    const c = this._c(), t = c.currentTime + delay;
    const o = c.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(from, t);
    if (to) o.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.bus); o.start(t); o.stop(t + dur + 0.02);
  }
  _noise({ dur = 0.18, gain = 0.25, lp = 1400, delay = 0 }) {
    if (this.muted) return;
    const c = this._c(), t = c.currentTime + delay;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp;
    const g = c.createGain(); g.gain.value = gain;
    s.connect(f).connect(g).connect(this.bus); s.start(t);
  }

  /* ---------------- SFX ---------------- */
  card()   { this._tone({ type: 'triangle', from: 300, to: 520, dur: 0.12, gain: 0.16 }); this._noise({ dur: 0.05, gain: 0.05, lp: 5000 }); }
  hit()    { this._noise({ dur: 0.16, gain: 0.3, lp: 1200 }); this._tone({ type: 'sine', from: 160, to: 70, dur: 0.18, gain: 0.25 }); }
  crit()   { this._noise({ dur: 0.22, gain: 0.34, lp: 1700 }); this._tone({ type: 'sawtooth', from: 240, to: 90, dur: 0.24, gain: 0.2 }); this._tone({ type: 'triangle', from: 660, to: 880, dur: 0.18, gain: 0.08, delay: 0.02 }); }
  bleed()  { this._tone({ type: 'sine', from: 520, to: 360, dur: 0.16, gain: 0.12 }); }
  block()  { this._tone({ type: 'square', from: 220, to: 320, dur: 0.12, gain: 0.12 }); this._noise({ dur: 0.1, gain: 0.12, lp: 800 }); }
  bark()   { this._tone({ type: 'sawtooth', from: 420, to: 140, dur: 0.16, gain: 0.22 }); }
  hurt()   { this._tone({ type: 'sawtooth', from: 200, to: 60, dur: 0.26, gain: 0.26 }); this._noise({ dur: 0.12, gain: 0.14, lp: 600 }); }
  growl()  { this._tone({ type: 'sawtooth', from: 90, to: 50, dur: 0.5, gain: 0.22 }); }
  deploy() { this._tone({ type: 'square', from: 140, to: 220, dur: 0.14, gain: 0.14 }); this._noise({ dur: 0.08, gain: 0.1, lp: 2200 }); }
  fanfare(win) {
    const notes = win ? [294, 392, 494, 587] : [330, 277, 220, 165];
    notes.forEach((f, i) => this._tone({ type: 'triangle', from: f, to: f, dur: 0.5, gain: 0.18, delay: i * 0.16 }));
    if (win) this._tone({ type: 'triangle', from: 784, to: 784, dur: 0.6, gain: 0.10, delay: 0.64 });
  }

  /* ---------------- region-themed music bed ---------------- */
  startMusic(region = 0) {
    if (this.muted || this.music) return;
    const c = this._c(), t = c.currentTime;
    const R = REGIONS[Math.max(0, Math.min(REGIONS.length - 1, region | 0))];
    const master = c.createGain(); master.gain.value = 0.0001; master.connect(this.bus);
    master.gain.exponentialRampToValueAtTime(0.07, t + 3); // slow fade-in
    const voices = [];
    // slow detuned drone pad with a gentle swell LFO each
    R.drones.forEach((f, i) => {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f * (1 + (i - 1) * R.detune * 0.02);
      const lfo = c.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.04 + i * 0.025;
      const lg = c.createGain(); lg.gain.value = f * R.detune; lfo.connect(lg).connect(o.frequency);
      const g = c.createGain(); g.gain.value = i === 0 ? 0.8 : 0.45;
      o.connect(g).connect(master); o.start(t); lfo.start(t);
      voices.push(o, lfo);
    });
    // sparse pentatonic motif on a timer (soft envelopes → never jarring)
    let last = -1;
    const playMotif = () => {
      if (this.muted || !this.music) return;
      let n; do { n = R.motif[Math.floor(Math.random() * R.motif.length)]; } while (n === last && R.motif.length > 1);
      last = n;
      const cc = this.ctx, tt = cc.currentTime;
      const o = cc.createOscillator(); o.type = R.wave; o.frequency.value = n;
      const g = cc.createGain(); g.gain.setValueAtTime(0.0001, tt);
      g.gain.exponentialRampToValueAtTime(R.mgain, tt + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, tt + R.mdur);
      o.connect(g).connect(master); o.start(tt); o.stop(tt + R.mdur + 0.05);
    };
    const motifTimer = setInterval(playMotif, R.every * 1000);
    setTimeout(playMotif, 1500);
    // soft heartbeat pulse for the darker regions
    let pulseTimer = null;
    if (R.pulse > 0) {
      const thump = () => {
        if (this.muted || !this.music) return;
        const cc = this.ctx, tt = cc.currentTime;
        const o = cc.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(70, tt); o.frequency.exponentialRampToValueAtTime(38, tt + 0.22);
        const g = cc.createGain(); g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.05 * R.pulse, tt + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.3);
        o.connect(g).connect(master); o.start(tt); o.stop(tt + 0.34);
      };
      pulseTimer = setInterval(thump, 2400);
    }
    this.music = { master, voices, timers: [motifTimer, pulseTimer].filter(Boolean) };
  }
  stopMusic() {
    if (!this.music) return;
    const m = this.music; this.music = null;
    m.timers.forEach((id) => clearInterval(id));
    try {
      const t = this.ctx.currentTime;
      m.master.gain.cancelScheduledValues(t); m.master.gain.setValueAtTime(m.master.gain.value, t);
      m.master.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); // fade out
      m.voices.forEach((v) => v.stop(t + 0.7));
    } catch (e) {}
  }
}
