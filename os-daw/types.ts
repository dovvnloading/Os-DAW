

export enum Waveform {
  Sine = 'sine',
  Square = 'square',
  Sawtooth = 'sawtooth',
  Triangle = 'triangle',
}

export interface OscillatorParams {
  id: number;
  enabled: boolean;
  waveform: Waveform;
  detune: number; // cents
  semitone: number; // semitone offset
  gain: number; // 0-1
  shape: number; // 0-1 (PWM for Square, Unison for Saw, Fold for Tri/Sine)
}

export enum FilterType {
  LowPass = 'lowpass',
  HighPass = 'highpass',
  BandPass = 'bandpass',
  Notch = 'notch',
}

export enum LfoTarget {
  None = 'none',
  Pitch = 'pitch',
  Filter = 'filter',
  Amp = 'amp',
}

export interface LfoParams {
  enabled: boolean;
  rate: number; // Hz
  depth: number; // 0-1
  waveform: Waveform;
  target: LfoTarget;
}

export interface FxParams {
  distortion: number; // 0-1 (Drive)
  bitCrush: number; // 0-1 (Lo-Fi)
  noise: number; // 0-1
  // Modulation
  chorusMix: number; // 0-1
  chorusRate: number; // Hz
  chorusDepth: number; // 0-1
  // Time/Space
  reverbMix: number; // 0-1
  delayTime: number; // 0-1s
  delayFeedback: number; // 0-1
  delayMix: number; // 0-1
  // EQ
  eqLow: number; // dB -12 to +12
  eqMid: number; // dB
  eqHigh: number; // dB
}

export interface SynthParams {
  oscillators: OscillatorParams[];
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterCutoff: number;
  filterResonance: number;
  filterType: FilterType;
  masterGain: number;
  lfo: LfoParams;
  fx: FxParams;
}

export enum TrackType {
  Synth = 'synth',
  Sampler = 'sampler',
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  muted: boolean;
  solo: boolean;
  volume: number;
  pan: number;
  color: string;
  // If synth
  synthParams?: SynthParams;
  // If sampler
  sampleUrl?: string;
  sampleBuffer?: AudioBuffer | null;
  playbackRate?: number; // 1.0 is normal speed
  // FX for Sampler (Synth uses synthParams.fx)
  fx?: FxParams;
}

export interface Pattern {
  id: string;
  name: string;
  steps: Record<string, boolean[]>; // Map trackId -> boolean[] (16 steps)
}

export interface TimelineBlock {
  id: string;
  patternId: string;
  startStep: number; // Global step position
  trackIndex: number; // Visual vertical lane index
}

export interface ProjectState {
  bpm: number;
  isPlaying: boolean;
  isMetronomeOn: boolean;
  currentStep: number;
  tracks: Track[];
  patterns: Pattern[];
  timeline: TimelineBlock[];
  currentPatternId: string;
  selectedTrackId: string | null;
  theme: 'dark' | 'light';
  playMode: 'PAT' | 'SONG';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}