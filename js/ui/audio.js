// Procedural Web Audio: tactile SFX + a low, dark ambient bed. No files (CC0 music lands in M5).
// Kept warm/soft, never harsh.
export class Audio {
  constructor() { this.ctx = null; this.music = null; this.muted = false; }
  _c() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); return this.ctx; }
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
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
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
    s.connect(f).connect(g).connect(c.destination); s.start(t);
  }

  card()   { this._tone({ type: 'triangle', from: 300, to: 520, dur: 0.12, gain: 0.16 }); }
  hit()    { this._noise({ dur: 0.16, gain: 0.3, lp: 1200 }); this._tone({ type: 'sine', from: 160, to: 70, dur: 0.18, gain: 0.25 }); }
  crit()   { this._noise({ dur: 0.22, gain: 0.34, lp: 1700 }); this._tone({ type: 'sawtooth', from: 240, to: 90, dur: 0.24, gain: 0.2 }); }
  bleed()  { this._tone({ type: 'sine', from: 520, to: 360, dur: 0.16, gain: 0.12 }); }
  block()  { this._tone({ type: 'square', from: 220, to: 320, dur: 0.12, gain: 0.12 }); this._noise({ dur: 0.1, gain: 0.12, lp: 800 }); }
  bark()   { this._tone({ type: 'sawtooth', from: 420, to: 140, dur: 0.16, gain: 0.22 }); }
  hurt()   { this._tone({ type: 'sawtooth', from: 200, to: 60, dur: 0.26, gain: 0.26 }); }
  growl()  { this._tone({ type: 'sawtooth', from: 90, to: 50, dur: 0.5, gain: 0.22 }); }
  fanfare(win) {
    const notes = win ? [294, 392, 494, 587] : [330, 277, 220, 165];
    notes.forEach((f, i) => this._tone({ type: 'triangle', from: f, to: f, dur: 0.45, gain: 0.18, delay: i * 0.16 }));
  }

  startMusic() {
    if (this.muted || this.music) return;
    const c = this._c(), t = c.currentTime;
    const master = c.createGain(); master.gain.value = 0.06; master.connect(c.destination);
    const voices = [];
    // two slow detuned drones (a minor-ish drone bed)
    [110, 164.81].forEach((f, i) => {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const lfo = c.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.05 + i * 0.03;
      const lg = c.createGain(); lg.gain.value = 1.5; lfo.connect(lg).connect(o.frequency);
      const g = c.createGain(); g.gain.value = i ? 0.5 : 0.8;
      o.connect(g).connect(master); o.start(t); lfo.start(t);
      voices.push(o, lfo);
    });
    this.music = { master, voices };
  }
  stopMusic() {
    if (!this.music) return;
    try { this.music.voices.forEach((v) => v.stop()); } catch (e) {}
    this.music = null;
  }
}
