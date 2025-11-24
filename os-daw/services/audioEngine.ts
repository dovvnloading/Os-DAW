

import { SynthParams, Track, TrackType, Waveform, LfoTarget, FxParams } from '../types';

class AudioEngine {
  public ctx: AudioContext | null = null;
  public analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private impulseBuffer: AudioBuffer | null = null; // Reverb IR
  private distortionCurves: Map<number, Float32Array> = new Map();
  private bitCrushCurves: Map<number, Float32Array> = new Map();
  private pwmCurve: Float32Array | null = null;
  private foldCurve: Float32Array | null = null;
  private metronomeBuffer: AudioBuffer | null = null;

  // Buffers for samplers
  public sampleBuffers: Map<string, AudioBuffer> = new Map();

  constructor() {
    // Lazy init on user interaction
  }

  public init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    if (!this.ctx) throw new Error("AudioContext not supported");

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;

    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.ratio.value = 12;
    
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048; // Higher resolution for Oscilloscope
    this.analyser.smoothingTimeConstant = 0.8;

    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Pre-generate assets
    this.noiseBuffer = this.createNoiseBuffer(this.ctx);
    this.impulseBuffer = this.createImpulseResponse(this.ctx, 2.0, 2.0); // 2s reverb
    this.metronomeBuffer = this.createMetronomeClick(this.ctx);
  }

  public resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMasterVolume(value: number) {
    if (this.masterGain) {
        this.masterGain.gain.setTargetAtTime(value, this.ctx?.currentTime || 0, 0.1);
    }
  }

  // --- Asset Generation ---

  private createMetronomeClick(ctx: BaseAudioContext): AudioBuffer {
    const osc = new OfflineAudioContext(1, ctx.sampleRate * 0.1, ctx.sampleRate);
    const o = osc.createOscillator();
    const g = osc.createGain();
    o.frequency.value = 1000;
    o.connect(g);
    g.connect(osc.destination);
    o.start(0);
    o.stop(0.05);
    g.gain.setValueAtTime(0.5, 0);
    g.gain.exponentialRampToValueAtTime(0.001, 0.05);
    return osc.startRendering() as unknown as AudioBuffer;
  }

  private createImpulseResponse(ctx: BaseAudioContext, duration: number, decay: number): AudioBuffer {
    const length = ctx.sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    for (let i = 0; i < length; i++) {
        // Simple noise decay
        const n = i < length ? Math.pow(1 - i / length, decay) : 0;
        left[i] = (Math.random() * 2 - 1) * n;
        right[i] = (Math.random() * 2 - 1) * n;
    }
    return impulse;
  }

  // --- Sample Loading & Generation ---

  public async loadSample(trackId: string, file: File): Promise<AudioBuffer | null> {
    if (!this.ctx) this.init();
    if (!this.ctx) return null;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.sampleBuffers.set(trackId, audioBuffer);
      return audioBuffer;
    } catch (e) {
      console.error("Failed to load sample", e);
      return null;
    }
  }

  public async loadPreset(trackId: string, presetId: string): Promise<AudioBuffer | null> {
    if (!this.ctx) this.init();
    if (!this.ctx) return null;

    const buffer = await this.generateProceduralSample(presetId);
    if (buffer) {
      this.sampleBuffers.set(trackId, buffer);
    }
    return buffer;
  }

  private async generateProceduralSample(presetId: string): Promise<AudioBuffer | null> {
     // We use an OfflineAudioContext to render synthetic drums
     const sampleRate = 44100;
     const length = sampleRate * 2; // 2 seconds max
     const offlineCtx = new OfflineAudioContext(1, length, sampleRate);
     
     const gain = offlineCtx.createGain();
     gain.connect(offlineCtx.destination);
     
     const now = 0;

     switch (presetId) {
        case 'kick-808': {
            const osc = offlineCtx.createOscillator();
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
            
            const env = offlineCtx.createGain();
            env.gain.setValueAtTime(1, now);
            env.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
            
            osc.connect(env);
            env.connect(gain);
            osc.start(now);
            break;
        }
        case 'kick-punch': {
            const osc = offlineCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);

            const click = offlineCtx.createOscillator();
            click.type = 'square';
            click.frequency.setValueAtTime(1000, now);
            click.frequency.exponentialRampToValueAtTime(100, now + 0.02);

            const env = offlineCtx.createGain();
            env.gain.setValueAtTime(1, now);
            env.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            const clickEnv = offlineCtx.createGain();
            clickEnv.gain.setValueAtTime(0.5, now);
            clickEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

            osc.connect(env).connect(gain);
            click.connect(clickEnv).connect(gain);
            
            osc.start(now);
            click.start(now);
            break;
        }
        case 'snare-trap': {
            const osc = offlineCtx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(150, now + 0.1);
            
            const noise = offlineCtx.createBufferSource();
            noise.buffer = this.createNoiseBuffer(offlineCtx);
            const noiseFilter = offlineCtx.createBiquadFilter();
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.value = 1000;

            const oscEnv = offlineCtx.createGain();
            oscEnv.gain.setValueAtTime(0.5, now);
            oscEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

            const noiseEnv = offlineCtx.createGain();
            noiseEnv.gain.setValueAtTime(0.8, now);
            noiseEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            osc.connect(oscEnv).connect(gain);
            noise.connect(noiseFilter).connect(noiseEnv).connect(gain);
            
            osc.start(now);
            noise.start(now);
            break;
        }
        case 'hat-closed': {
            const noise = offlineCtx.createBufferSource();
            noise.buffer = this.createNoiseBuffer(offlineCtx);
            
            const filter = offlineCtx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 8000;
            
            const env = offlineCtx.createGain();
            env.gain.setValueAtTime(0.6, now);
            env.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            noise.connect(filter).connect(env).connect(gain);
            noise.start(now);
            break;
        }
        case 'hat-open': {
             const noise = offlineCtx.createBufferSource();
            noise.buffer = this.createNoiseBuffer(offlineCtx);
            
            const filter = offlineCtx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 6000;
            
            const env = offlineCtx.createGain();
            env.gain.setValueAtTime(0.6, now);
            env.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

            noise.connect(filter).connect(env).connect(gain);
            noise.start(now);
            break;
        }
        case 'clap': {
            const noise = offlineCtx.createBufferSource();
            noise.buffer = this.createNoiseBuffer(offlineCtx);
            const filter = offlineCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 1200;
            filter.Q.value = 1;

            const env = offlineCtx.createGain();
            env.gain.setValueAtTime(0, now);
            // Simulate multiple claps
            env.gain.linearRampToValueAtTime(0.8, now + 0.01);
            env.gain.linearRampToValueAtTime(0, now + 0.02);
            env.gain.linearRampToValueAtTime(0.8, now + 0.03);
            env.gain.linearRampToValueAtTime(0, now + 0.04);
            env.gain.linearRampToValueAtTime(1, now + 0.05);
            env.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            noise.connect(filter).connect(env).connect(gain);
            noise.start(now);
            break;
        }
        default: {
             const osc = offlineCtx.createOscillator();
             osc.frequency.value = 440;
             osc.start(now);
             osc.stop(now + 0.1);
             osc.connect(gain);
        }
     }

     return await offlineCtx.startRendering();
  }

  private createNoiseBuffer(ctx: BaseAudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private getDistortionCurve(amount: number): Float32Array {
     if (this.distortionCurves.has(amount)) {
         return this.distortionCurves.get(amount)!;
     }
     const k = amount * 100;
     const n_samples = 44100;
     const curve = new Float32Array(n_samples);
     const deg = Math.PI / 180;
     for (let i = 0; i < n_samples; ++i) {
       const x = i * 2 / n_samples - 1;
       curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
     }
     this.distortionCurves.set(amount, curve);
     return curve;
  }

  // Staircase function for bitcrushing (bit-depth reduction)
  private getBitCrushCurve(amount: number): Float32Array {
      // Amount 0-1. 0 = 16 bit, 1 = 1 bit
      const bits = 16 * (1 - amount) + 1; // Map to 1-16 bits
      const steps = Math.pow(2, bits);
      
      const key = Math.round(bits * 100); // Cache key
      if (this.bitCrushCurves.has(key)) return this.bitCrushCurves.get(key)!;

      const n_samples = 44100;
      const curve = new Float32Array(n_samples);
      for(let i=0; i<n_samples; i++) {
          const x = (i / n_samples) * 2 - 1;
          curve[i] = Math.round(x * steps) / steps;
      }
      this.bitCrushCurves.set(key, curve);
      return curve;
  }

  private getPWMCurve(): Float32Array {
    if (this.pwmCurve) return this.pwmCurve;
    const n_samples = 256;
    const curve = new Float32Array(n_samples);
    for (let i = 0; i < n_samples; i++) {
        curve[i] = (i / (n_samples - 1)) < 0.5 ? -1 : 1;
    }
    this.pwmCurve = curve;
    return curve;
  }

  private getFoldCurve(): Float32Array {
      if (this.foldCurve) return this.foldCurve;
      const n_samples = 4096;
      const curve = new Float32Array(n_samples);
      for(let i=0; i<n_samples; i++) {
          const x = (i / n_samples) * 2 - 1;
          curve[i] = Math.sin(x * Math.PI * 2);
      }
      this.foldCurve = curve;
      return curve;
  }

  public getWaveformData(trackId: string): Float32Array | null {
      const buffer = this.sampleBuffers.get(trackId);
      if (!buffer) return null;
      const rawData = buffer.getChannelData(0);
      const samples = 100;
      const step = Math.floor(rawData.length / samples);
      const data = new Float32Array(samples);
      for(let i=0; i<samples; i++) {
          let sum = 0;
          for(let j=0; j<step; j++) {
              sum += Math.abs(rawData[i*step + j]);
          }
          data[i] = sum / step;
      }
      return data;
  }

  public getAnalyzerData(dataArray: Uint8Array) {
      if (this.analyser) {
          this.analyser.getByteFrequencyData(dataArray);
      }
  }

  public getOscilloscopeData(dataArray: Uint8Array) {
      if (this.analyser) {
          this.analyser.getByteTimeDomainData(dataArray);
      }
  }

  // --- Sequencer Playback ---

  public playStep(track: Track, time: number) {
    if (!this.ctx || !this.masterGain) return;
    if (track.muted) return;

    const trackGain = this.ctx.createGain();
    trackGain.gain.value = track.volume;
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = track.pan;

    trackGain.connect(panner);
    panner.connect(this.masterGain);

    if (track.type === TrackType.Synth && track.synthParams) {
      this.triggerSynth(track.synthParams, time, trackGain);
    } else if (track.type === TrackType.Sampler) {
      this.triggerSample(track, time, trackGain);
    }
  }

  public playMetronome(time: number) {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(1000, time);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.05);
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  }

  private connectFxChain(source: AudioNode, destination: AudioNode, fx: FxParams, time: number, duration: number) {
      if (!this.ctx) return;
      let signalChain = source;
      const stopTime = time + duration + (fx.delayMix > 0 ? 1.0 : 0) + (fx.reverbMix > 0 ? 2.0 : 0);

      // 1. Bitcrusher (Lo-Fi)
      if (fx.bitCrush > 0) {
          const crusher = this.ctx.createWaveShaper();
          crusher.curve = this.getBitCrushCurve(fx.bitCrush);
          const lpf = this.ctx.createBiquadFilter();
          lpf.type = 'lowpass';
          lpf.frequency.value = 12000 * (1 - fx.bitCrush * 0.5); 
          
          signalChain.connect(crusher);
          crusher.connect(lpf);
          signalChain = lpf;
      }

      // 2. Distortion (Drive)
      if (fx.distortion > 0) {
          const shaper = this.ctx.createWaveShaper();
          shaper.curve = this.getDistortionCurve(fx.distortion);
          shaper.oversample = '2x';
          signalChain.connect(shaper);
          signalChain = shaper;
      }

      // 3. EQ (3-Band Insert)
      {
          const eqLow = this.ctx.createBiquadFilter();
          eqLow.type = 'lowshelf';
          eqLow.frequency.value = 320;
          eqLow.gain.value = fx.eqLow;

          const eqMid = this.ctx.createBiquadFilter();
          eqMid.type = 'peaking';
          eqMid.frequency.value = 1000;
          eqMid.Q.value = 1;
          eqMid.gain.value = fx.eqMid;

          const eqHigh = this.ctx.createBiquadFilter();
          eqHigh.type = 'highshelf';
          eqHigh.frequency.value = 3200;
          eqHigh.gain.value = fx.eqHigh;

          signalChain.connect(eqLow);
          eqLow.connect(eqMid);
          eqMid.connect(eqHigh);
          signalChain = eqHigh;
      }

      // 4. Chorus (Modulation)
      if (fx.chorusMix > 0) {
          const chorusSplit = this.ctx.createGain();
          const dryPath = this.ctx.createGain();
          
          dryPath.gain.value = 1 - fx.chorusMix;
          chorusSplit.gain.value = fx.chorusMix;

          signalChain.connect(dryPath);
          signalChain.connect(chorusSplit);

          const lfo = this.ctx.createOscillator();
          lfo.frequency.value = fx.chorusRate;
          const lfoGain = this.ctx.createGain();
          lfoGain.gain.value = 0.002 * fx.chorusDepth; 
          
          const delay = this.ctx.createDelay();
          delay.delayTime.value = 0.015;

          lfo.connect(lfoGain);
          lfoGain.connect(delay.delayTime);
          lfo.start(time);
          lfo.stop(stopTime);

          chorusSplit.connect(delay);
          
          const merger = this.ctx.createGain();
          dryPath.connect(merger);
          delay.connect(merger);
          signalChain = merger;
      }

      // 5. Delay
      if (fx.delayMix > 0) {
          const delay = this.ctx.createDelay(1.0);
          delay.delayTime.value = fx.delayTime;
          const feedback = this.ctx.createGain();
          feedback.gain.value = fx.delayFeedback;
          
          const wetGain = this.ctx.createGain();
          wetGain.gain.value = fx.delayMix;

          delay.connect(feedback);
          feedback.connect(delay);

          signalChain.connect(delay);
          delay.connect(wetGain);
          
          wetGain.connect(destination);
      }

      // 6. Reverb (Convolver)
      if (fx.reverbMix > 0 && this.impulseBuffer) {
          const convolver = this.ctx.createConvolver();
          convolver.buffer = this.impulseBuffer;
          
          const revGain = this.ctx.createGain();
          revGain.gain.value = fx.reverbMix;

          signalChain.connect(convolver);
          convolver.connect(revGain);
          revGain.connect(destination);
      }

      // 7. Connect Dry/Processed signal to Output
      signalChain.connect(destination);
  }

  private triggerSample(track: Track, time: number, output: AudioNode) {
    if (!this.ctx) return;
    const buffer = this.sampleBuffers.get(track.id);
    if (!buffer) return; 

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = track.playbackRate || 1.0;

    // Calculate duration for FX tail
    const duration = buffer.duration / (track.playbackRate || 1.0);

    if (track.fx) {
        this.connectFxChain(source, output, track.fx, time, duration);
    } else {
        source.connect(output);
    }
    source.start(time);
  }

  private triggerSynth(params: SynthParams, time: number, output: AudioNode) {
    if (!this.ctx) return;

    // Adjust stop time for release tail
    const duration = params.attack + params.decay + params.release + 0.1;
    const stopTime = time + duration + 1.0; // Extra buffer

    // 1. Envelope
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(params.masterGain, time + params.attack);
    env.gain.exponentialRampToValueAtTime(params.sustain * params.masterGain, time + params.attack + params.decay);
    env.gain.exponentialRampToValueAtTime(0.001, time + params.attack + params.decay + params.release + 0.1); 

    // 2. Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = params.filterType as BiquadFilterType;
    filter.frequency.setValueAtTime(params.filterCutoff, time);
    filter.Q.value = params.filterResonance;

    filter.connect(env);
    
    // 3. FX Chain
    if (params.fx) {
        this.connectFxChain(env, output, params.fx, time, duration);
    } else {
        env.connect(output);
    }

    // 4. LFO & Modulation (Pre-FX)
    let lfoGain: GainNode | null = null;
    if (params.lfo && params.lfo.enabled && params.lfo.target !== LfoTarget.None) {
        const lfo = this.ctx.createOscillator();
        lfo.type = params.lfo.waveform as OscillatorType;
        lfo.frequency.value = params.lfo.rate;
        
        lfoGain = this.ctx.createGain();
        let depthVal = 0;
        
        if (params.lfo.target === LfoTarget.Pitch) depthVal = params.lfo.depth * 50; 
        else if (params.lfo.target === LfoTarget.Filter) depthVal = params.lfo.depth * 1000; 
        else if (params.lfo.target === LfoTarget.Amp) depthVal = params.lfo.depth * 0.5;

        lfoGain.gain.value = depthVal;
        lfo.connect(lfoGain);
        lfo.start(time);
        lfo.stop(stopTime);

        if (params.lfo.target === LfoTarget.Filter) {
            lfoGain.connect(filter.frequency);
        } else if (params.lfo.target === LfoTarget.Amp) {
             lfoGain.connect(env.gain);
        }
    }

    // 5. Noise
    if (params.fx && params.fx.noise > 0 && this.noiseBuffer) {
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = this.noiseBuffer;
        noiseSource.loop = true;
        
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.value = params.fx.noise * 0.3; 
        
        noiseSource.connect(noiseGain);
        noiseGain.connect(filter);
        noiseSource.start(time);
        noiseSource.stop(stopTime);
    }

    // 6. Oscillators
    params.oscillators.forEach(oscParams => {
      if (!oscParams.enabled) return;
      
      const baseFreq = 261.63; 
      const semitoneMultiplier = Math.pow(2, (oscParams.semitone + oscParams.detune / 100) / 12);
      const frequency = baseFreq * semitoneMultiplier;

      const oscGain = this.ctx!.createGain();
      oscGain.gain.value = oscParams.gain;
      oscGain.connect(filter);

      if (oscParams.waveform === Waveform.Square && oscParams.shape > 0) {
          // PWM
          const pwmOsc = this.ctx!.createOscillator();
          pwmOsc.type = 'sawtooth';
          pwmOsc.frequency.value = frequency;
          
          if (lfoGain && params.lfo.target === LfoTarget.Pitch) lfoGain.connect(pwmOsc.detune);

          const width = this.ctx!.createConstantSource();
          width.offset.value = oscParams.shape * 0.9; 

          const pwmShaper = this.ctx!.createWaveShaper();
          pwmShaper.curve = this.getPWMCurve();

          pwmOsc.connect(pwmShaper);
          width.connect(pwmShaper);
          pwmShaper.connect(oscGain);

          pwmOsc.start(time);
          pwmOsc.stop(stopTime);
          width.start(time);
          width.stop(stopTime);

      } else {
          // Standard + Morph
          const osc = this.ctx!.createOscillator();
          osc.type = oscParams.waveform as OscillatorType;
          osc.frequency.value = frequency;
          
          if (lfoGain && params.lfo.target === LfoTarget.Pitch) lfoGain.connect(osc.detune);

          if ((oscParams.waveform === Waveform.Sawtooth || oscParams.waveform === Waveform.Triangle) && oscParams.shape > 0) {
              const spread = oscParams.shape * 40;
              
              const u1 = this.ctx!.createOscillator();
              u1.type = oscParams.waveform as OscillatorType;
              u1.frequency.value = frequency;
              u1.detune.value = -spread;
              
              const u2 = this.ctx!.createOscillator();
              u2.type = oscParams.waveform as OscillatorType;
              u2.frequency.value = frequency;
              u2.detune.value = spread;
              
              const uGain = this.ctx!.createGain();
              uGain.gain.value = 0.4;

              u1.connect(uGain);
              u2.connect(uGain);
              uGain.connect(oscGain);

              u1.start(time);
              u2.start(time);
              u1.stop(stopTime);
              u2.stop(stopTime);
          }

          if ((oscParams.waveform === Waveform.Sine || oscParams.waveform === Waveform.Triangle) && oscParams.shape > 0.1) {
             const folder = this.ctx!.createWaveShaper();
             folder.curve = this.getFoldCurve();
             const drive = this.ctx!.createGain();
             drive.gain.value = 1 + (oscParams.shape * 5); 
             
             osc.connect(drive);
             drive.connect(folder);
             folder.connect(oscGain);
          } else {
             osc.connect(oscGain);
          }

          osc.start(time);
          osc.stop(stopTime);
      }
    });
  }

  public getCurrentTime() {
    return this.ctx?.currentTime || 0;
  }
}

export const audioEngine = new AudioEngine();