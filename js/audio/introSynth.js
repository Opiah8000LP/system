/* js/audio/introSynth.js — the intro's drone, synthesised live (no audio files).
   update(m): m = 0 → dissonant cluster + noise, m = 1 → warm major-seventh pad. */
export class IntroSynth {
  constructor(ctx) {
    this.ctx = ctx;
    this.nodes = [];
    this.out = ctx.createGain(); this.out.gain.value = 0; this.out.connect(ctx.destination);

    /* dissonant bed: minor 2nd + tritone clusters through a low-pass */
    this.dis = ctx.createGain(); this.dis.gain.value = 1; this.dis.connect(this.out);
    this.lp = ctx.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 600; this.lp.connect(this.dis);
    [55, 58.27, 77.78, 82.41].forEach(f => this._osc('sawtooth', f, 0.22, this.lp));

    /* breathy noise */
    const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const ns = ctx.createBufferSource(); ns.buffer = buf; ns.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.8;
    this.noise = ctx.createGain(); this.noise.gain.value = 0.15;
    ns.connect(bp); bp.connect(this.noise); this.noise.connect(this.out); ns.start();
    this.nodes.push(ns);

    /* resolution: Cmaj7 pad + shimmer */
    this.pad = ctx.createGain(); this.pad.gain.value = 0; this.pad.connect(this.out);
    [130.81, 164.81, 196, 246.94, 392, 523.25, 659.25].forEach((f, i) => this._osc('sine', f, 0.2 / (1 + i * 0.18), this.pad));
  }
  _osc(type, f, g, dest) {
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = f;
    const gn = this.ctx.createGain(); gn.gain.value = g;
    o.connect(gn); gn.connect(dest); o.start(); this.nodes.push(o);
  }
  start() { this.out.gain.setTargetAtTime(0.14, this.ctx.currentTime, 0.7); }
  update(m) {
    const t = this.ctx.currentTime;
    this.dis.gain.setTargetAtTime(Math.max(0, 1 - m * 1.15), t, 0.2);
    this.lp.frequency.setTargetAtTime(500 + m * 500, t, 0.3);
    this.noise.gain.setTargetAtTime(0.15 * (1 - m), t, 0.3);
    this.pad.gain.setTargetAtTime(Math.max(0, m - 0.2) * 1.3, t, 0.5);
  }
  stop(sec = 1.6) {
    this.out.gain.setTargetAtTime(0, this.ctx.currentTime, sec / 3);
    setTimeout(() => this.nodes.forEach(o => { try { o.stop(); } catch (e) {} }), sec * 1000 + 300);
  }
}
