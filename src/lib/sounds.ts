class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled = true;

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
}

export const soundManager = new SoundManager();
