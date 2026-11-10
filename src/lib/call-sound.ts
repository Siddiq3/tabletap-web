'use client';
import { useCallback, useEffect, useRef } from 'react';

/** Prepare during a user gesture; play only after a successful request/notification. */
export function useCallSound() {
  const audio = useRef<AudioContext | null>(null);
  const prepare = useCallback(async (): Promise<boolean> => {
    try {
      if (!audio.current || audio.current.state === 'closed') audio.current = new AudioContext();
      await audio.current.resume();
      return audio.current.state === 'running';
    } catch { return false; }
  }, []);
  const play = useCallback((kind: 'confirmation' | 'alert' = 'alert'): boolean => {
    const ctx = audio.current;
    if (!ctx || ctx.state !== 'running') return false;
    try {
      const start = ctx.currentTime;
      const notes = kind === 'confirmation' ? [660, 880] : [880, 660, 880];
      notes.forEach((frequency, i) => {
        const tone = ctx.createOscillator();
        const volume = ctx.createGain();
        const at = start + i * .17;
        tone.type = 'sine'; tone.frequency.value = frequency;
        volume.gain.setValueAtTime(0, at);
        volume.gain.linearRampToValueAtTime(.14, at + .012);
        volume.gain.exponentialRampToValueAtTime(.001, at + .15);
        tone.connect(volume); volume.connect(ctx.destination);
        tone.start(at); tone.stop(at + .16);
        tone.onended = () => { tone.disconnect(); volume.disconnect(); };
      });
      return true;
    } catch { return false; }
  }, []);
  useEffect(() => () => { if (audio.current && audio.current.state !== 'closed') void audio.current.close().catch(() => {}); }, []);
  return { prepare, play };
}
