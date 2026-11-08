'use client';

import { useRef, useState } from 'react';

export default function AmbientHum() {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainRef = useRef<GainNode | null>(null);

  function start() {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.value = 0;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;

    gain.connect(filter);
    filter.connect(ctx.destination);

    const freqs = [98, 110.5, 146.8];
    const oscillators = freqs.map((f) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      osc.connect(gain);
      osc.start();
      return osc;
    });

    gain.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 1.5);

    ctxRef.current = ctx;
    oscillatorsRef.current = oscillators;
    gainRef.current = gain;
  }

  function stop() {
    const ctx = ctxRef.current;
    const gain = gainRef.current;
    const oscillators = oscillatorsRef.current;
    if (!ctx || !gain) return;

    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
    setTimeout(() => {
      oscillators.forEach((o) => o.stop());
      ctx.close();
      ctxRef.current = null;
      oscillatorsRef.current = [];
      gainRef.current = null;
    }, 900);
  }

  function toggle() {
    if (on) {
      stop();
    } else {
      start();
    }
    setOn(!on);
  }

  return (
    <button
      type="button"
      className="hum-toggle"
      onClick={toggle}
      aria-pressed={on}
      aria-label="Toggle ambient sound"
    >
      {on ? '♪ Sound On' : '♪ Sound Off'}
    </button>
  );
}