

import { OscillatorParams, SynthParams, Track, TrackType, Waveform, Pattern, FilterType, LfoTarget, FxParams } from './types';

export const DEFAULT_BPM = 120;
export const STEPS_PER_BAR = 16;
export const LOOKAHEAD_MS = 25.0; // Scheduler lookahead
export const SCHEDULE_AHEAD_TIME = 0.1; // How far ahead to schedule audio (sec)

export const DEFAULT_OSC: OscillatorParams = {
  id: 0,
  enabled: true,
  waveform: Waveform.Sawtooth,
  detune: 0,
  semitone: 0,
  gain: 0.5,
  shape: 0, // Default 0 (no morph)
};

export const DEFAULT_FX: FxParams = {
  distortion: 0,
  bitCrush: 0,
  noise: 0,
  chorusMix: 0,
  chorusRate: 1.5,
  chorusDepth: 0.5,
  reverbMix: 0,
  delayTime: 0.3,
  delayFeedback: 0.3,
  delayMix: 0,
  eqLow: 0,
  eqMid: 0,
  eqHigh: 0
};

export const DEFAULT_SYNTH: SynthParams = {
  oscillators: [
    { ...DEFAULT_OSC, id: 0, enabled: true, gain: 0.6 },
    { ...DEFAULT_OSC, id: 1, enabled: true, waveform: Waveform.Square, detune: 10, gain: 0.4 },
    { ...DEFAULT_OSC, id: 2, enabled: false, waveform: Waveform.Sine, semitone: -12, gain: 0.8 }, // Sub
  ],
  attack: 0.01,
  decay: 0.1,
  sustain: 0.5,
  release: 0.3,
  filterCutoff: 2000,
  filterResonance: 1,
  filterType: FilterType.LowPass,
  masterGain: 0.7,
  lfo: {
    enabled: false,
    rate: 2,
    depth: 0.5,
    waveform: Waveform.Sine,
    target: LfoTarget.None
  },
  fx: DEFAULT_FX
};

export const SAMPLE_PRESETS = [
  { id: 'kick-808', label: '808 Kick', category: 'Kick' },
  { id: 'kick-punch', label: 'Punchy Kick', category: 'Kick' },
  { id: 'snare-trap', label: 'Trap Snare', category: 'Snare' },
  { id: 'snare-acoustic', label: 'Tight Snare', category: 'Snare' },
  { id: 'hat-closed', label: 'Closed Hat', category: 'HiHat' },
  { id: 'hat-open', label: 'Open Hat', category: 'HiHat' },
  { id: 'clap', label: 'Clap', category: 'Perc' },
  { id: 'crash', label: 'Crash', category: 'Cymbal' },
];

// Grayscale Palette
export const TRACK_COLORS = [
  '#FFFFFF', // White
  '#CCCCCC', // Light Gray
  '#999999', // Medium Gray
  '#666666', // Dark Gray
];

export const INITIAL_TRACKS: Track[] = [
  {
    id: 't-1',
    name: 'Main Lead',
    type: TrackType.Synth,
    muted: false,
    solo: false,
    volume: 0.8,
    pan: 0,
    color: TRACK_COLORS[0], 
    synthParams: DEFAULT_SYNTH,
  },
  {
    id: 't-2',
    name: 'Kick',
    type: TrackType.Sampler, 
    muted: false,
    solo: false,
    volume: 1.0,
    pan: 0,
    playbackRate: 1.0,
    color: TRACK_COLORS[0],
    fx: DEFAULT_FX
  },
  {
    id: 't-3',
    name: 'Hi-Hats',
    type: TrackType.Sampler,
    muted: false,
    solo: false,
    volume: 0.6,
    pan: 0.2,
    playbackRate: 1.0,
    color: TRACK_COLORS[1],
    fx: DEFAULT_FX
  },
  {
    id: 't-4',
    name: 'Bass',
    type: TrackType.Synth,
    muted: false,
    solo: false,
    volume: 0.8,
    pan: 0,
    color: TRACK_COLORS[2],
    synthParams: {
      ...DEFAULT_SYNTH,
      oscillators: [
        { ...DEFAULT_OSC, id: 0, waveform: Waveform.Triangle, semitone: -24, gain: 1 },
        { ...DEFAULT_OSC, id: 1, waveform: Waveform.Sine, semitone: -12, gain: 0.5 },
        { ...DEFAULT_OSC, id: 2, enabled: false },
      ],
      filterCutoff: 400,
      filterType: FilterType.LowPass
    },
  },
];

export const INITIAL_PATTERNS: Pattern[] = [
  {
    id: 'p-1',
    name: 'Pattern 1',
    steps: {
      't-1': [true, false, false, true, false, false, true, false, true, false, false, true, false, true, false, false],
      't-2': [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      't-3': [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      't-4': [true, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false],
    }
  }
];