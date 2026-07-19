/**
 * Ambient Synthesizer using Web Audio API
 * Generates soft, calming lo-fi ambient pad chords and gentle melodic notes
 * 100% client-side with no external audio file dependencies.
 */

export class AmbientSynth {
  private ctx: AudioContext | null = null;
  private mainGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private isPlaying: boolean = false;
  private timerId: number | null = null;
  private onNoteCallback: ((noteName: string, freq: number) => void) | null = null;

  // Gentle, warm pentatonic/ambient scale frequencies
  // Chords: Cmaj7 (C3, E3, G3, B3), Fmaj7 (F3, A3, C4, E4), G6 (G3, B3, D4, E4), Am7 (A3, C4, E4, G4)
  private chords = [
    { name: 'Cmaj7', notes: [130.81, 164.81, 196.00, 246.94] }, // C3, E3, G3, B3
    { name: 'Am7', notes: [110.00, 130.81, 164.81, 196.00] },   // A2, C3, E3, G3
    { name: 'Fmaj7', notes: [174.61, 220.00, 261.63, 329.63] }, // F3, A3, C4, E4
    { name: 'G6', notes: [196.00, 246.94, 293.66, 329.63] }     // G3, B3, D4, E4
  ];

  private currentChordIndex = 0;

  constructor() {}

  public init() {
    if (this.ctx) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    this.mainGain = this.ctx.createGain();
    this.filter = this.ctx.createBiquadFilter();

    // Create a very warm sound with a low-pass filter
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(450, this.ctx.currentTime); // low frequency cuts high hiss
    this.filter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    // Chain: Synth -> Filter -> MainGain -> Destination
    this.filter.connect(this.mainGain);
    this.mainGain.connect(this.ctx.destination);
    
    // Default soft volume
    this.mainGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
  }

  public registerOnNote(callback: (noteName: string, freq: number) => void) {
    this.onNoteCallback = callback;
  }

  public async start() {
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.isPlaying = true;
    this.playLoop();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public setVolume(volume: number) {
    if (this.mainGain && this.ctx) {
      this.mainGain.gain.linearRampToValueAtTime(volume * 0.15, this.ctx.currentTime + 0.1);
    }
  }

  private playLoop = () => {
    if (!this.isPlaying || !this.ctx || !this.filter) return;

    const chord = this.chords[this.currentChordIndex];
    const startTime = this.ctx.currentTime;

    // Trigger notes in the chord with subtle random arpeggiation offsets
    chord.notes.forEach((freq, idx) => {
      const noteDelay = idx * 0.35 + Math.random() * 0.1;
      this.playNote(freq, startTime + noteDelay, 3.5);
    });

    if (this.onNoteCallback) {
      this.onNoteCallback(chord.name, chord.notes[0]);
    }

    // Move to next chord
    this.currentChordIndex = (this.currentChordIndex + 1) % this.chords.length;

    // Schedule next chord in 6 seconds
    this.timerId = window.setTimeout(this.playLoop, 6000);
  };

  private playNote(frequency: number, startTime: number, duration: number) {
    if (!this.ctx || !this.filter) return;

    // Oscillator
    const osc = this.ctx.createOscillator();
    // Use a soft triangle wave instead of harsh saw/square
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, startTime);

    // Subtle detune for a beautiful chorus-like pad effect
    osc.detune.setValueAtTime((Math.random() - 0.5) * 15, startTime);

    // Individual Note Gain Node for Attack/Decay envelope
    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0, startTime);
    
    // Slow Attack: fade in over 1.2 seconds
    noteGain.gain.linearRampToValueAtTime(0.15, startTime + 1.2);
    
    // Slow Release: fade out slowly
    noteGain.gain.setValueAtTime(0.15, startTime + duration - 1.5);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    // Connect
    osc.connect(noteGain);
    noteGain.connect(this.filter);

    // Play and stop
    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}
