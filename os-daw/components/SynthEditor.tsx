
import React, { useEffect, useRef, useState } from 'react';
import { Track, TrackType, Waveform, OscillatorParams, FilterType, LfoTarget, FxParams } from '../types';
import { Knob } from './Knob';
import { Upload, Zap, Sliders, Activity, Library, Music, Radio, Volume2, Waves, Repeat, Gauge, Equalizer, Sparkles, AlertCircle } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';
import { SAMPLE_PRESETS } from '../constants';

interface SynthEditorProps {
  track: Track;
  onUpdateTrack: (updated: Track) => void;
}

const FxControls: React.FC<{ fx: FxParams, onChange: (key: keyof FxParams, val: number) => void }> = ({ fx, onChange }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-[1800px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                
        {/* FX Column 1: EQ */}
        <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-bold text-daw-muted uppercase flex items-center gap-2 tracking-widest shrink-0 border-b border-daw-surface/10 pb-2">
                <Sliders size={12}/> 3-Band EQ
            </h4>
            <div className="p-6 rounded-xl shadow-neu-out bg-daw-bg flex flex-col gap-6">
                <div className="flex justify-around items-end">
                    <Knob label="High" value={fx.eqHigh || 0} min={-12} max={12} step={1} onChange={(v) => onChange('eqHigh', v)} unit="dB" size={48} />
                    <Knob label="Mid" value={fx.eqMid || 0} min={-12} max={12} step={1} onChange={(v) => onChange('eqMid', v)} unit="dB" size={48} />
                    <Knob label="Low" value={fx.eqLow || 0} min={-12} max={12} step={1} onChange={(v) => onChange('eqLow', v)} unit="dB" size={48} />
                </div>
                <div className="h-10 w-full bg-daw-surface rounded shadow-neu-in relative overflow-hidden flex items-center justify-center">
                    {/* Simple visualizer curve representation */}
                    <svg className="w-full h-full opacity-30 text-daw-text" viewBox="0 0 100 40" preserveAspectRatio="none">
                        <path 
                            d={`M0 20 Q 25 ${20 - (fx.eqLow || 0)} 50 ${20 - (fx.eqMid || 0)} T 100 ${20 - (fx.eqHigh || 0)}`}
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                        />
                    </svg>
                </div>
            </div>
        </div>

            {/* FX Column 2: Color & Grit */}
            <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-bold text-daw-muted uppercase flex items-center gap-2 tracking-widest shrink-0 border-b border-daw-surface/10 pb-2">
                <AlertCircle size={12}/> Color & Grit
            </h4>
            <div className="p-6 rounded-xl shadow-neu-out bg-daw-bg flex flex-col gap-6">
                    <div className="flex gap-4 justify-around">
                    <Knob label="Drive" value={fx.distortion || 0} min={0} max={1} step={0.01} onChange={(v) => onChange('distortion', v)} size={48} />
                    <Knob label="Lo-Fi" value={fx.bitCrush || 0} min={0} max={1} step={0.01} onChange={(v) => onChange('bitCrush', v)} size={48} />
                    <Knob label="Noise" value={fx.noise || 0} min={0} max={1} step={0.01} onChange={(v) => onChange('noise', v)} size={48} />
                </div>
            </div>
        </div>

            {/* FX Column 3: Modulation */}
            <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-bold text-daw-muted uppercase flex items-center gap-2 tracking-widest shrink-0 border-b border-daw-surface/10 pb-2">
                <Sparkles size={12}/> Modulation (Chorus)
            </h4>
            <div className="p-6 rounded-xl shadow-neu-out bg-daw-bg flex flex-col gap-6">
                <div className="flex gap-4 justify-around">
                    <Knob label="Mix" value={fx.chorusMix || 0} min={0} max={1} step={0.01} onChange={(v) => onChange('chorusMix', v)} size={48} />
                    <Knob label="Rate" value={fx.chorusRate || 1.5} min={0.1} max={10} step={0.1} onChange={(v) => onChange('chorusRate', v)} unit="Hz" size={48} />
                    <Knob label="Depth" value={fx.chorusDepth || 0.5} min={0} max={1} step={0.01} onChange={(v) => onChange('chorusDepth', v)} size={48} />
                </div>
            </div>
        </div>

        {/* FX Column 4: Time & Space */}
        <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-bold text-daw-muted uppercase flex items-center gap-2 tracking-widest shrink-0 border-b border-daw-surface/10 pb-2">
                <Repeat size={12}/> Delay & Reverb
            </h4>
            <div className="p-6 rounded-xl shadow-neu-out bg-daw-bg flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center gap-2 border-r border-daw-surface/10 pr-2">
                        <span className="text-[9px] font-bold text-daw-muted uppercase">Delay</span>
                        <div className="flex gap-2">
                            <Knob label="Time" value={fx.delayTime || 0.3} min={0.01} max={1.0} step={0.01} onChange={(v) => onChange('delayTime', v)} unit="s" size={40} />
                            <Knob label="Mix" value={fx.delayMix || 0} min={0} max={1} step={0.01} onChange={(v) => onChange('delayMix', v)} size={40} />
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-2 pl-2">
                        <span className="text-[9px] font-bold text-daw-muted uppercase">Reverb</span>
                        <Knob label="Mix" value={fx.reverbMix || 0} min={0} max={1} step={0.01} onChange={(v) => onChange('reverbMix', v)} size={48} />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export const SynthEditor: React.FC<SynthEditorProps> = ({ track, onUpdateTrack }) => {
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'synth' | 'fx'>('synth');

  // Reset tab when switching tracks
  useEffect(() => {
      setActiveTab('synth');
  }, [track.id]);

  // Update waveform visualization when track changes or sample loaded
  useEffect(() => {
    if (track.type === TrackType.Sampler) {
      const data = audioEngine.getWaveformData(track.id);
      setWaveformData(data);
    }
  }, [track.id, track.type, track.sampleUrl]); 

  // Draw Waveform
  useEffect(() => {
    if (!canvasRef.current || !waveformData) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvasRef.current;
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    // Check computed style for text color to use as waveform color
    const style = getComputedStyle(document.body);
    const color = style.getPropertyValue('--c-text').trim() || '#2d3436';
    
    ctx.fillStyle = color; 
    ctx.beginPath();
    
    const barWidth = width / waveformData.length;
    
    for(let i=0; i<waveformData.length; i++) {
        const val = waveformData[i];
        const barHeight = val * height;
        const y = (height - barHeight) / 2;
        ctx.fillRect(i * barWidth, y, barWidth - 1, barHeight);
    }
  }, [waveformData]); // Re-run when data changes. Ideally also when theme changes but accessing theme here is indirect without context.

  const handleFile = (file: File) => {
    if (file && (file.name.endsWith('.wav') || file.name.endsWith('.mp3') || file.name.endsWith('.ogg'))) {
        audioEngine.loadSample(track.id, file).then((buffer) => {
            if (buffer) {
                setWaveformData(audioEngine.getWaveformData(track.id));
                onUpdateTrack({ ...track, name: file.name.substring(0, 15) });
            }
        });
    } else {
        alert("Please upload a valid audio file (.wav, .mp3, .ogg)");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handlePresetLoad = (presetId: string, name: string) => {
      audioEngine.loadPreset(track.id, presetId).then((buffer) => {
          if (buffer) {
             setWaveformData(audioEngine.getWaveformData(track.id));
             onUpdateTrack({ ...track, name: name });
          }
      });
  };


  // --- Render Sampler Editor ---
  if (track.type === TrackType.Sampler) {
    return (
      <div className="h-full flex flex-col bg-daw-bg border-t border-daw-surface text-daw-text transition-colors">
        <div className="flex items-center justify-between px-6 py-2 border-b border-daw-surface/10 bg-daw-bg shrink-0">
            <div className="flex items-center gap-3">
                <Music size={16} className="text-daw-text" />
                <span className="text-daw-text uppercase tracking-wider text-xs font-bold mr-6">Sampler: {track.name}</span>

                <div className="flex bg-daw-dark/50 rounded-lg p-1 shadow-neu-in gap-1">
                    <button 
                        onClick={() => setActiveTab('synth')}
                        className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${activeTab === 'synth' ? 'bg-daw-surface text-daw-text shadow-neu-out' : 'text-daw-muted hover:text-daw-text'}`}
                    >
                        Sample
                    </button>
                    <button 
                        onClick={() => setActiveTab('fx')}
                        className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${activeTab === 'fx' ? 'bg-daw-surface text-daw-text shadow-neu-out' : 'text-daw-muted hover:text-daw-text'}`}
                    >
                        FX Rack
                    </button>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-hidden">
             {activeTab === 'synth' && (
             <div className="flex h-full">
                {/* Left: Asset Library */}
                <div className="w-56 border-r border-daw-surface/10 bg-daw-bg flex flex-col shrink-0 transition-colors">
                    <div className="p-4 text-[10px] font-bold text-daw-muted uppercase tracking-widest flex items-center gap-2">
                        <Library size={12} /> Asset Library
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
                        {SAMPLE_PRESETS.map(preset => (
                            <button
                                key={preset.id}
                                onClick={() => handlePresetLoad(preset.id, preset.label)}
                                className="w-full text-left px-4 py-3 rounded-lg text-xs flex items-center justify-between group transition-all shadow-neu-out hover:shadow-neu-pressed active:shadow-neu-in bg-daw-bg"
                            >
                                <span className="text-daw-text">{preset.label}</span>
                                <span className="text-[8px] text-daw-muted uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">{preset.category}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Controls & Import */}
                <div className="flex-1 flex flex-col p-5 overflow-y-auto bg-daw-bg custom-scrollbar transition-colors">
                    
                    {/* Waveform Display */}
                    <div className="h-32 shrink-0 rounded-xl shadow-neu-pressed mb-6 relative overflow-hidden flex items-center justify-center bg-daw-bg transition-colors">
                        {waveformData ? (
                            <canvas ref={canvasRef} width={600} height={128} className="w-full h-full object-contain opacity-70" />
                        ) : (
                            <div className="text-daw-muted text-xs flex items-center gap-2">
                                <Activity size={14}/> No sample loaded
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-6">
                        {/* Controls */}
                        <div className="p-5 rounded-xl shadow-neu-out bg-daw-bg flex flex-col items-center">
                            <div className="text-[10px] font-bold text-daw-muted uppercase mb-5 tracking-wider">Parameters</div>
                            <div className="flex gap-6">
                                <Knob label="Pitch" value={track.playbackRate || 1} min={0.1} max={3.0} step={0.1} onChange={(v) => onUpdateTrack({...track, playbackRate: v})} size={48} />
                                <Knob label="Volume" value={track.volume} min={0} max={1.5} step={0.05} onChange={(v) => onUpdateTrack({...track, volume: v})} size={48} />
                                <Knob label="Pan" value={track.pan} min={-1} max={1} step={0.1} onChange={(v) => onUpdateTrack({...track, pan: v})} size={48} />
                            </div>
                        </div>

                        {/* Import Zone */}
                        <div 
                            className={`flex-1 min-w-[250px] border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center transition-all ${
                                dragActive ? 'border-daw-accent bg-daw-surface' : 'border-daw-surface/20 hover:border-daw-muted'
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <Upload size={24} className="text-daw-muted mb-3" />
                            <p className="text-xs font-semibold text-daw-text mb-1">Import Custom Sample</p>
                            <p className="text-[10px] text-daw-muted mb-4 text-center">Drag & drop .WAV, .MP3, .OGG here</p>
                            <label className="px-6 py-2 shadow-neu-out hover:shadow-neu-btn active:shadow-neu-pressed bg-daw-bg text-[10px] rounded-full font-bold cursor-pointer transition-all text-daw-text uppercase tracking-wide">
                                Browse Files
                                <input 
                                    type="file" 
                                    accept=".wav,.mp3,.ogg,audio/wav,audio/mpeg,audio/ogg" 
                                    className="hidden" 
                                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                />
                            </label>
                        </div>
                    </div>
                </div>
             </div>
             )}

             {activeTab === 'fx' && track.fx && (
                <div className="p-6 overflow-y-auto h-full custom-scrollbar bg-daw-dark transition-colors">
                    <FxControls 
                        fx={track.fx} 
                        onChange={(key, val) => onUpdateTrack({ ...track, fx: { ...track.fx!, [key]: val } })} 
                    />
                </div>
             )}
        </div>
      </div>
    );
  }

  // --- Render Synth Editor ---
  if (!track.synthParams) return null;

  const updateSynthParam = (key: keyof typeof track.synthParams, value: any) => {
    onUpdateTrack({
      ...track,
      synthParams: { ...track.synthParams!, [key]: value }
    });
  };

  const updateOsc = (id: number, key: keyof OscillatorParams, value: any) => {
    const newOscs = track.synthParams!.oscillators.map(osc => 
      osc.id === id ? { ...osc, [key]: value } : osc
    );
    updateSynthParam('oscillators', newOscs);
  };
  
  const updateLfo = (key: keyof typeof track.synthParams.lfo, value: any) => {
      if(!track.synthParams!.lfo) return;
      updateSynthParam('lfo', { ...track.synthParams!.lfo, [key]: value });
  };

  const updateFx = (key: keyof typeof track.synthParams.fx, value: any) => {
      if(!track.synthParams!.fx) return;
      updateSynthParam('fx', { ...track.synthParams!.fx, [key]: value });
  };

  return (
    <div className="h-full flex flex-col bg-daw-bg border-t border-daw-surface/10 overflow-hidden transition-colors">
      
      {/* Editor Tab Header */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-daw-surface/10 bg-daw-bg shrink-0 transition-colors">
          <div className="flex items-center gap-3">
            <Zap size={16} className="text-daw-text" />
            <span className="text-daw-text uppercase tracking-wider text-xs font-bold mr-6">Synth: {track.name}</span>
            
            <div className="flex bg-daw-dark/50 rounded-lg p-1 shadow-neu-in gap-1">
                <button 
                    onClick={() => setActiveTab('synth')}
                    className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${activeTab === 'synth' ? 'bg-daw-surface text-daw-text shadow-neu-out' : 'text-daw-muted hover:text-daw-text'}`}
                >
                    Synthesis
                </button>
                <button 
                    onClick={() => setActiveTab('fx')}
                    className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${activeTab === 'fx' ? 'bg-daw-surface text-daw-text shadow-neu-out' : 'text-daw-muted hover:text-daw-text'}`}
                >
                    FX Rack
                </button>
            </div>
          </div>
      </div>
      
      {/* Vertical Scrolling Grid Container */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-daw-dark transition-colors">
        
        {/* SYNTHESIS TAB */}
        {activeTab === 'synth' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-[1800px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* Column 1: Oscillators */}
                <div className="flex flex-col gap-4 col-span-1 md:col-span-2 xl:col-span-1">
                    <h4 className="text-[10px] font-bold text-daw-muted uppercase flex items-center gap-2 tracking-widest shrink-0 border-b border-daw-surface/10 pb-2">
                        <Activity size={12}/> Oscillators
                    </h4>
                    <div className="flex flex-col gap-3">
                        {track.synthParams.oscillators.map((osc) => {
                            let morphLabel = "Morph";
                            if(osc.waveform === Waveform.Square) morphLabel = "PWM";
                            else if(osc.waveform === Waveform.Sawtooth) morphLabel = "Unison";
                            else if(osc.waveform === Waveform.Triangle) morphLabel = "Fold";
                            
                            return (
                            <div key={osc.id} className={`p-3 rounded-xl transition-all ${osc.enabled ? 'shadow-neu-out opacity-100' : 'shadow-neu-in opacity-40'}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="checkbox" 
                                            checked={osc.enabled}
                                            onChange={(e) => updateOsc(osc.id, 'enabled', e.target.checked)}
                                            className="appearance-none w-4 h-4 rounded bg-daw-bg shadow-neu-pressed checked:bg-daw-accent checked:shadow-[0_0_8px_currentColor] transition-all cursor-pointer"
                                        />
                                        <span className="text-xs font-bold text-daw-text">OSC {osc.id + 1}</span>
                                    </div>
                                    <div className="relative">
                                        <select 
                                            value={osc.waveform}
                                            onChange={(e) => updateOsc(osc.id, 'waveform', e.target.value)}
                                            className="appearance-none bg-daw-bg text-[10px] py-1 px-3 pr-8 rounded-lg text-daw-text shadow-neu-out focus:shadow-neu-pressed outline-none cursor-pointer uppercase font-bold tracking-wide"
                                        >
                                            <option value={Waveform.Sine}>Sine</option>
                                            <option value={Waveform.Square}>Square</option>
                                            <option value={Waveform.Sawtooth}>Saw</option>
                                            <option value={Waveform.Triangle}>Triangle</option>
                                        </select>
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-daw-muted">▼</div>
                                    </div>
                                </div>
                                <div className="flex gap-4 justify-around">
                                    <Knob label="Gain" value={osc.gain} min={0} max={1} step={0.01} onChange={(v) => updateOsc(osc.id, 'gain', v)} size={40} />
                                    <Knob label="Semi" value={osc.semitone} min={-24} max={24} step={1} onChange={(v) => updateOsc(osc.id, 'semitone', v)} size={40} />
                                    <Knob label="Detune" value={osc.detune} min={-50} max={50} step={1} onChange={(v) => updateOsc(osc.id, 'detune', v)} size={40} />
                                    <Knob label={morphLabel} value={osc.shape || 0} min={0} max={1} step={0.01} onChange={(v) => updateOsc(osc.id, 'shape', v)} size={40} />
                                </div>
                            </div>
                        )})}
                    </div>
                </div>

                {/* Column 2: Envelope */}
                <div className="flex flex-col gap-4">
                    <h4 className="text-[10px] font-bold text-daw-muted uppercase flex items-center gap-2 tracking-widest shrink-0 border-b border-daw-surface/10 pb-2">
                        <Sliders size={12}/> Envelope
                    </h4>
                    <div className="p-6 rounded-xl shadow-neu-out bg-daw-bg flex flex-col">
                        <div className="text-xs text-daw-text mb-6 font-bold border-b border-daw-surface/10 pb-2">Amplitude (ADSR)</div>
                        <div className="flex gap-4 justify-center flex-wrap">
                            <Knob label="Attack" value={track.synthParams.attack} min={0.001} max={2} step={0.01} onChange={(v) => updateSynthParam('attack', v)} unit="s" size={48} />
                            <Knob label="Decay" value={track.synthParams.decay} min={0.01} max={2} step={0.01} onChange={(v) => updateSynthParam('decay', v)} unit="s" size={48} />
                            <Knob label="Sustain" value={track.synthParams.sustain} min={0} max={1} step={0.01} onChange={(v) => updateSynthParam('sustain', v)} size={48} />
                            <Knob label="Release" value={track.synthParams.release} min={0.01} max={5} step={0.01} onChange={(v) => updateSynthParam('release', v)} unit="s" size={48} />
                        </div>
                    </div>
                </div>

                {/* Column 3: Filter & Master */}
                <div className="flex flex-col gap-4">
                    <h4 className="text-[10px] font-bold text-daw-muted uppercase flex items-center gap-2 tracking-widest shrink-0 border-b border-daw-surface/10 pb-2">
                        <Radio size={12}/> Filter & Master
                    </h4>
                    <div className="p-6 rounded-xl shadow-neu-out bg-daw-bg flex flex-col">
                        <div className="flex items-center justify-between mb-6 border-b border-daw-surface/10 pb-2">
                            <span className="text-xs text-daw-text font-bold">Filter</span>
                            <div className="relative">
                                <select 
                                    value={track.synthParams.filterType || FilterType.LowPass}
                                    onChange={(e) => updateSynthParam('filterType', e.target.value)}
                                    className="appearance-none bg-daw-bg text-[10px] py-1 px-3 pr-8 rounded-lg text-daw-text shadow-neu-out focus:shadow-neu-pressed outline-none cursor-pointer uppercase font-bold tracking-wide"
                                >
                                    <option value={FilterType.LowPass}>Low Pass</option>
                                    <option value={FilterType.HighPass}>High Pass</option>
                                    <option value={FilterType.BandPass}>Band Pass</option>
                                    <option value={FilterType.Notch}>Notch</option>
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-daw-muted">▼</div>
                            </div>
                        </div>
                        
                        <div className="flex gap-6 justify-center flex-wrap mb-6">
                            <Knob label="Cutoff" value={track.synthParams.filterCutoff} min={20} max={20000} step={100} onChange={(v) => updateSynthParam('filterCutoff', v)} unit="Hz" size={48} />
                            <Knob label="Res" value={track.synthParams.filterResonance} min={0} max={20} step={0.1} onChange={(v) => updateSynthParam('filterResonance', v)} size={48} />
                        </div>
                        
                        <div className="mt-auto pt-4 border-t border-daw-surface/10">
                            <div className="text-xs text-daw-text mb-4 font-bold flex items-center gap-2"><Volume2 size={12}/> Master Output</div>
                            <div className="flex justify-center">
                                <Knob label="Gain" value={track.synthParams.masterGain} min={0} max={1} step={0.01} onChange={(v) => updateSynthParam('masterGain', v)} size={56} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 4: LFO */}
                <div className="flex flex-col gap-4">
                     <h4 className="text-[10px] font-bold text-daw-muted uppercase flex items-center gap-2 tracking-widest shrink-0 border-b border-daw-surface/10 pb-2">
                        <Waves size={12}/> Modulation
                    </h4>
                    <div className={`p-4 rounded-xl transition-all ${track.synthParams.lfo?.enabled ? 'shadow-neu-out opacity-100' : 'shadow-neu-in opacity-50'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    checked={track.synthParams.lfo?.enabled}
                                    onChange={(e) => updateLfo('enabled', e.target.checked)}
                                    className="appearance-none w-4 h-4 rounded bg-daw-bg shadow-neu-pressed checked:bg-daw-accent checked:shadow-[0_0_8px_currentColor] transition-all cursor-pointer"
                                />
                                <span className="text-xs font-bold text-daw-text">LFO 1</span>
                            </div>
                            <div className="relative">
                                <select 
                                    value={track.synthParams.lfo?.waveform || Waveform.Sine}
                                    onChange={(e) => updateLfo('waveform', e.target.value)}
                                    className="appearance-none bg-daw-bg text-[10px] py-1 px-3 pr-6 rounded-lg text-daw-text shadow-neu-out focus:shadow-neu-pressed outline-none cursor-pointer uppercase font-bold tracking-wide"
                                >
                                    <option value={Waveform.Sine}>Sin</option>
                                    <option value={Waveform.Triangle}>Tri</option>
                                    <option value={Waveform.Square}>Sqr</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="text-[9px] text-daw-muted uppercase font-bold mb-1 ml-1">Target</div>
                             <div className="relative w-full">
                                <select 
                                    value={track.synthParams.lfo?.target || LfoTarget.None}
                                    onChange={(e) => updateLfo('target', e.target.value)}
                                    className="w-full appearance-none bg-daw-bg text-[10px] py-1.5 px-3 rounded-lg text-daw-text shadow-neu-pressed focus:shadow-neu-in outline-none cursor-pointer uppercase font-bold tracking-wide"
                                >
                                    <option value={LfoTarget.None}>Off</option>
                                    <option value={LfoTarget.Pitch}>Pitch (Vibrato)</option>
                                    <option value={LfoTarget.Filter}>Filter (Wobble)</option>
                                    <option value={LfoTarget.Amp}>Volume (Tremolo)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4 justify-around">
                            <Knob label="Rate" value={track.synthParams.lfo?.rate || 1} min={0.1} max={20} step={0.1} onChange={(v) => updateLfo('rate', v)} unit="Hz" size={40} />
                            <Knob label="Depth" value={track.synthParams.lfo?.depth || 0} min={0} max={1} step={0.01} onChange={(v) => updateLfo('depth', v)} size={40} />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* FX & MIX TAB */}
        {activeTab === 'fx' && (
             <FxControls 
                fx={track.synthParams.fx} 
                onChange={updateFx} 
             />
        )}

      </div>
    </div>
  );
};
