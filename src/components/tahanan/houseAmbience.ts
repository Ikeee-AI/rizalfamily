// Procedural ambience for the 3D house — synthesized with Web Audio, no audio files.
//   • a soft breeze (filtered brown noise) — always
//   • birdsong chirps — by day
//   • crickets — in the evening

export class HouseAmbience {
  private ctx: AudioContext;
  private master: GainNode;
  private dayBus: GainNode;
  private nightBus: GainNode;
  private noise: AudioBufferSourceNode;
  private lfo: OscillatorNode;
  private timers: number[] = [];
  private night = false;
  private closed = false;

  constructor() {
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    this.dayBus = ctx.createGain();
    this.nightBus = ctx.createGain();
    this.dayBus.gain.value = 1;
    this.nightBus.gain.value = 0;
    this.dayBus.connect(this.master);
    this.nightBus.connect(this.master);

    // Breeze: brown noise → low-pass, gently swelling.
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.2;
    }
    this.noise = ctx.createBufferSource();
    this.noise.buffer = buf;
    this.noise.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    const breeze = ctx.createGain();
    breeze.gain.value = 0.32;
    this.lfo = ctx.createOscillator();
    this.lfo.frequency.value = 0.07;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.16;
    this.lfo.connect(lfoDepth).connect(breeze.gain);
    this.noise.connect(lp).connect(breeze).connect(this.master);
    this.noise.start();
    this.lfo.start();

    this.scheduleBirds();
    this.scheduleCrickets();
  }

  start() {
    void this.ctx.resume();
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0.5, t, 0.8);
  }

  pause() {
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0, t, 0.3);
  }

  setNight(night: boolean) {
    this.night = night;
    const t = this.ctx.currentTime;
    this.dayBus.gain.setTargetAtTime(night ? 0 : 1, t, 1.2);
    this.nightBus.gain.setTargetAtTime(night ? 1 : 0, t, 1.2);
  }

  dispose() {
    this.closed = true;
    this.timers.forEach((id) => window.clearTimeout(id));
    this.pause();
    window.setTimeout(() => void this.ctx.close(), 600);
  }

  private later(fn: () => void, ms: number) {
    if (this.closed) return;
    this.timers.push(window.setTimeout(fn, ms));
    if (this.timers.length > 64) this.timers.splice(0, 32);
  }

  private panner(x: number) {
    const p = this.ctx.createStereoPanner();
    p.pan.value = x;
    return p;
  }

  /** A short bird phrase: 2–5 quick rising/falling whistles. */
  private scheduleBirds() {
    const phrase = () => {
      if (!this.night && this.ctx.state === 'running') {
        const ctx = this.ctx;
        const out = this.panner(Math.random() * 1.6 - 0.8);
        out.connect(this.dayBus);
        const base = 2300 + Math.random() * 1600;
        const notes = 2 + Math.floor(Math.random() * 4);
        let t = ctx.currentTime + 0.05;
        for (let i = 0; i < notes; i++) {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          const dur = 0.07 + Math.random() * 0.09;
          const f0 = base * (0.9 + Math.random() * 0.25);
          osc.frequency.setValueAtTime(f0, t);
          osc.frequency.exponentialRampToValueAtTime(f0 * (Math.random() > 0.5 ? 1.35 : 0.75), t + dur);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.045, t + 0.015);
          g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
          osc.connect(g).connect(out);
          osc.start(t);
          osc.stop(t + dur + 0.02);
          t += dur + 0.04 + Math.random() * 0.08;
        }
      }
      this.later(phrase, 2200 + Math.random() * 5200);
    };
    this.later(phrase, 1200);
  }

  /** Crickets: bursts of rapid pulses on a high carrier, a few voices panned around. */
  private scheduleCrickets() {
    const voices = [-0.6, 0.15, 0.7].map((pan, i) => ({ pan, pitch: 4300 + i * 260, rate: 0.55 + i * 0.13 }));
    for (const v of voices) {
      const chirp = () => {
        if (this.night && this.ctx.state === 'running') {
          const ctx = this.ctx;
          const out = this.panner(v.pan);
          out.connect(this.nightBus);
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = v.pitch;
          g.gain.value = 0;
          osc.connect(g).connect(out);
          const t0 = ctx.currentTime + 0.02;
          const pulses = 3 + Math.floor(Math.random() * 2);
          for (let k = 0; k < pulses; k++) {
            const t = t0 + k * 0.034;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.022, t + 0.006);
            g.gain.linearRampToValueAtTime(0, t + 0.024);
          }
          osc.start(t0);
          osc.stop(t0 + pulses * 0.034 + 0.05);
        }
        this.later(chirp, v.rate * 1000 * (0.85 + Math.random() * 0.3));
      };
      this.later(chirp, Math.random() * 600);
    }
  }
}
