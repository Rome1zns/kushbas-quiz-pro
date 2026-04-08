class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled = true;
  private backgroundMusicOsc: OscillatorNode | null = null;
  private backgroundMusicGain: GainNode | null = null;
  private backgroundMusicTimeouts: NodeJS.Timeout[] = [];

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.3) {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }

  tick() {
    this.playTone(800, 0.05, "square", 0.1);
  }

  correct() {
    this.playTone(523, 0.15, "sine", 0.3);
    setTimeout(() => this.playTone(659, 0.15, "sine", 0.3), 150);
    setTimeout(() => this.playTone(784, 0.3, "sine", 0.3), 300);
  }

  incorrect() {
    this.playTone(200, 0.3, "sawtooth", 0.2);
    setTimeout(() => this.playTone(150, 0.4, "sawtooth", 0.2), 300);
  }

  fanfare() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.4, "sine", 0.3), i * 200);
    });
  }

  countdown() {
    this.playTone(440, 0.1, "square", 0.15);
  }

  startBackgroundMusic() {
    if (!this.enabled || this.backgroundMusicOsc) return;
    try {
      const ctx = this.getContext();
      this.backgroundMusicGain = ctx.createGain();
      this.backgroundMusicGain.gain.setValueAtTime(0.08, ctx.currentTime);
      this.backgroundMusicGain.connect(ctx.destination);

      // Simple 4-bar melody loop: ascending/descending pattern at ~120 BPM
      const playMelody = () => {
        if (!this.backgroundMusicGain || !this.enabled) return;
        const frequencies = [262, 294, 330, 349, 392, 349, 330, 294]; // C D E F G F E D
        const noteDuration = 0.25; // 250ms per note = 240 BPM (4 beats per second)

        frequencies.forEach((freq, i) => {
          const timeout = setTimeout(() => {
            if (!this.backgroundMusicGain || !this.enabled) return;
            const osc = ctx.createOscillator();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            const noteGain = ctx.createGain();
            noteGain.gain.setValueAtTime(0.05, ctx.currentTime);
            noteGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + noteDuration);
            osc.connect(noteGain);
            noteGain.connect(this.backgroundMusicGain!);
            osc.start();
            osc.stop(ctx.currentTime + noteDuration);
          }, i * noteDuration * 1000);
          this.backgroundMusicTimeouts.push(timeout);
        });

        // Loop after melody completes (8 notes * 250ms = 2000ms)
        const loopTimeout = setTimeout(() => playMelody(), 2000);
        this.backgroundMusicTimeouts.push(loopTimeout);
      };

      playMelody();
    } catch {}
  }

  stopBackgroundMusic() {
    // Cancel all pending timeouts
    this.backgroundMusicTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.backgroundMusicTimeouts = [];

    if (this.backgroundMusicGain) {
      try {
        const ctx = this.getContext();
        this.backgroundMusicGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      } catch {}
      this.backgroundMusicGain = null;
    }
    this.backgroundMusicOsc = null;
  }
}

export const soundManager = new SoundManager();
