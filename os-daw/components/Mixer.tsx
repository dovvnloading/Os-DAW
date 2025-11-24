
import React, { useEffect, useState } from 'react';
import { Track, TrackType, FxParams } from '../types';
import { Knob } from './Knob';
import { Music, Power, Activity, MoreVertical } from 'lucide-react';

interface MixerProps {
  tracks: Track[];
  masterVolume: number;
  onUpdateTrack: (track: Track) => void;
  onMasterVolumeChange: (val: number) => void;
  onSelectTrack: (id: string) => void;
  selectedTrackId: string | null;
  isPlaying: boolean;
}

const DB_SCALE = [10, 5, 0, -5, -10, -20, -40, -60];

// --- Helpers ---
const getFx = (t: Track): FxParams => {
  if (t.type === TrackType.Synth && t.synthParams?.fx) {
    return t.synthParams.fx;
  } else if (t.type === TrackType.Sampler && t.fx) {
    return t.fx;
  }
  return {
    distortion: 0, bitCrush: 0, noise: 0,
    chorusMix: 0, chorusRate: 0, chorusDepth: 0,
    reverbMix: 0, delayTime: 0, delayFeedback: 0, delayMix: 0,
    eqLow: 0, eqMid: 0, eqHigh: 0
  };
};

const updateTrackFx = (t: Track, updates: Partial<FxParams>): Track => {
  const currentFx = getFx(t);
  const newFx = { ...currentFx, ...updates };

  if (t.type === TrackType.Synth && t.synthParams) {
    return {
      ...t,
      synthParams: { ...t.synthParams, fx: newFx }
    };
  } else if (t.type === TrackType.Sampler) {
    return { ...t, fx: newFx };
  }
  return t;
};

// --- Components ---

const LEDMeter: React.FC<{ level: number, active: boolean, height?: string }> = ({ level, active, height = "h-48" }) => {
    const segments = 20;
    return (
        <div className={`${height} w-2 bg-daw-dark rounded-full overflow-hidden flex flex-col-reverse justify-between p-[1px] shadow-neu-in border border-daw-surface/10`}>
            {Array.from({ length: segments }).map((_, i) => {
                const threshold = i / segments;
                const isActive = active && level > threshold;
                
                let color = 'bg-green-500';
                if (i > 14) color = 'bg-yellow-400';
                if (i > 17) color = 'bg-red-500';

                return (
                    <div 
                        key={i} 
                        className={`w-full h-[2px] rounded-[1px] transition-opacity duration-75 ${isActive ? `${color} opacity-100 shadow-[0_0_4px_currentColor]` : 'bg-daw-muted opacity-10'}`}
                    ></div>
                )
            })}
        </div>
    );
};

const MixerStrip: React.FC<{ 
    track: Track; 
    isSelected: boolean; 
    onUpdate: (t: Track) => void; 
    onSelect: () => void;
    isPlaying: boolean;
}> = ({ track, isSelected, onUpdate, onSelect, isPlaying }) => {
    
    const [meterLevel, setMeterLevel] = useState(0);
    const fx = getFx(track);

    useEffect(() => {
        if (!isPlaying || track.muted) {
            setMeterLevel(0);
            return;
        }
        const interval = setInterval(() => {
            const noise = Math.random() * 0.1;
            setMeterLevel(Math.min((track.volume * 0.6) + noise, 1.1));
        }, 80);
        return () => clearInterval(interval);
    }, [isPlaying, track.volume, track.muted]);

    const handleFxChange = (key: keyof FxParams, val: number) => {
        onUpdate(updateTrackFx(track, { [key]: val }));
    };

    return (
        <div 
            onClick={onSelect}
            className={`
                relative w-36 shrink-0 flex flex-col h-full border-r border-daw-surface/10 bg-daw-bg transition-colors select-none group
                ${isSelected ? 'bg-daw-surface shadow-neu-in' : 'hover:bg-daw-surface/50'}
            `}
        >
            {/* --- Top Section: FX (Scrollable) --- */}
            <div className="flex-1 flex flex-col items-center pt-8 py-4 gap-6 overflow-y-auto custom-scrollbar min-h-0 w-full">
                 
                 {/* EQ Section */}
                 <div className="flex flex-col items-center w-full px-2 gap-2">
                    <div className="flex items-center gap-2 w-full justify-center opacity-40">
                        <div className="h-px bg-daw-muted w-3"></div>
                        <div className="text-[8px] font-bold text-daw-muted uppercase tracking-widest">EQ</div>
                        <div className="h-px bg-daw-muted w-3"></div>
                    </div>
                    
                    <div className="bg-daw-bg p-2 rounded-xl shadow-neu-out border border-daw-surface/5 flex flex-col gap-2 w-full items-center">
                        <Knob value={fx.eqHigh} min={-12} max={12} onChange={(v) => handleFxChange('eqHigh', v)} size={36} showValue={false} label="High" />
                        <Knob value={fx.eqMid} min={-12} max={12} onChange={(v) => handleFxChange('eqMid', v)} size={36} showValue={false} label="Mid" />
                        <Knob value={fx.eqLow} min={-12} max={12} onChange={(v) => handleFxChange('eqLow', v)} size={36} showValue={false} label="Low" />
                    </div>
                 </div>

                 {/* Sends Section */}
                 <div className="flex flex-col items-center w-full px-2 gap-2">
                    <div className="flex items-center gap-2 w-full justify-center opacity-40">
                        <div className="h-px bg-daw-muted w-3"></div>
                        <div className="text-[8px] font-bold text-daw-muted uppercase tracking-widest">Sends</div>
                        <div className="h-px bg-daw-muted w-3"></div>
                    </div>
                    <div className="bg-daw-bg p-2 rounded-xl shadow-neu-out border border-daw-surface/5 flex gap-2 justify-center w-full">
                         <div className="flex flex-col items-center gap-1">
                             <Knob value={fx.reverbMix} min={0} max={1} step={0.01} onChange={(v) => handleFxChange('reverbMix', v)} size={32} showValue={false} />
                             <span className="text-[7px] text-daw-muted font-bold">REV</span>
                         </div>
                         <div className="flex flex-col items-center gap-1">
                             <Knob value={fx.delayMix} min={0} max={1} step={0.01} onChange={(v) => handleFxChange('delayMix', v)} size={32} showValue={false} />
                             <span className="text-[7px] text-daw-muted font-bold">DLY</span>
                         </div>
                    </div>
                 </div>
                 
                 {/* Spacer to allow scrolling past bottom */}
                 <div className="h-4 w-full shrink-0"></div>
            </div>

            {/* --- Bottom Section: Fader (Fixed Height) --- */}
            <div className="shrink-0 h-[320px] bg-daw-bg flex flex-col items-center pb-3 pt-2 gap-2 relative z-10 border-t border-daw-surface/10 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-colors">
                
                {/* Pan */}
                <div className="relative">
                     <Knob value={track.pan} min={-1} max={1} onChange={(v) => onUpdate({...track, pan: v})} size={36} showValue={false} />
                     <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[6px] font-bold text-daw-muted/50 pointer-events-none">PAN</span>
                </div>

                {/* Mute/Solo Buttons */}
                <div className="flex gap-2 w-full justify-center px-2">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onUpdate({...track, muted: !track.muted}); }}
                        className={`w-8 h-6 rounded flex items-center justify-center font-bold text-[9px] transition-all border ${
                            track.muted 
                            ? 'bg-daw-bg text-red-500 shadow-neu-in border-red-500/20' 
                            : 'bg-daw-bg text-daw-muted shadow-neu-out border-transparent hover:text-daw-text active:shadow-neu-pressed'
                        }`}
                    >
                        M
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onUpdate({...track, solo: !track.solo}); }}
                        className={`w-8 h-6 rounded flex items-center justify-center font-bold text-[9px] transition-all border ${
                            track.solo 
                            ? 'bg-daw-bg text-yellow-500 shadow-neu-in border-yellow-500/20' 
                            : 'bg-daw-bg text-daw-muted shadow-neu-out border-transparent hover:text-daw-text active:shadow-neu-pressed'
                        }`}
                    >
                        S
                    </button>
                </div>

                {/* Fader & Meter Container */}
                <div className="flex-1 w-full flex justify-center gap-3 px-1 relative min-h-0 py-2 bg-daw-dark/20 mx-2 rounded-lg inner-shadow border border-daw-surface/5">
                    
                    {/* Fader Track */}
                    <div className="h-full relative w-10 bg-daw-bg rounded-full shadow-neu-in flex justify-center border border-daw-surface/5">
                         {/* Track Line */}
                         <div className="absolute top-2 bottom-2 w-[1px] bg-daw-surface/20 rounded-full"></div>
                         
                         {/* Fader Cap */}
                         <div 
                            className="absolute w-6 h-10 bg-daw-bg rounded shadow-neu-btn cursor-ns-resize z-20 flex items-center justify-center border-t border-daw-surface/20 hover:brightness-110 active:shadow-neu-pressed transition-all group-active:scale-95"
                            style={{ 
                                bottom: `${Math.min((track.volume / 1.5) * 100, 100)}%`,
                                transform: 'translateY(50%)' 
                            }}
                            onMouseDown={(e) => {
                                const startY = e.clientY;
                                const startVol = track.volume;
                                const handleMove = (moveEvent: MouseEvent) => {
                                    const deltaY = startY - moveEvent.clientY;
                                    const change = (deltaY / 150) * 1.5; 
                                    const newVol = Math.min(Math.max(startVol + change, 0), 1.5);
                                    onUpdate({...track, volume: newVol});
                                };
                                const handleUp = () => {
                                    window.removeEventListener('mousemove', handleMove);
                                    window.removeEventListener('mouseup', handleUp);
                                };
                                window.addEventListener('mousemove', handleMove);
                                window.addEventListener('mouseup', handleUp);
                            }}
                         >
                             <div className="w-full h-[1px] bg-black/50 absolute top-1/2 -translate-y-1/2"></div>
                             <div className="w-3 h-[2px] bg-daw-accent shadow-[0_0_4px_currentColor]"></div>
                         </div>
                    </div>

                    {/* Meter */}
                    <LEDMeter level={meterLevel} active={!track.muted} height="h-full" />
                </div>

                {/* Scribble Strip */}
                <div className="w-full px-2 mt-auto">
                    <div className={`w-full py-2 rounded text-center text-[9px] font-bold truncate uppercase tracking-wider transition-all border ${
                        isSelected 
                        ? 'bg-daw-accent text-daw-bg shadow-neu-glow border-transparent' 
                        : 'bg-daw-bg text-daw-muted shadow-neu-pressed border-daw-surface/5'
                    }`}>
                        {track.name}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MasterStrip: React.FC<{ 
    volume: number; 
    onChange: (v: number) => void;
    isPlaying: boolean;
}> = ({ volume, onChange, isPlaying }) => {
    
    const [meterLevel, setMeterLevel] = useState(0);
    
    useEffect(() => {
        if (!isPlaying) {
            setMeterLevel(0);
            return;
        }
        const interval = setInterval(() => {
            setMeterLevel((volume * 0.7) + (Math.random() * 0.05));
        }, 80);
        return () => clearInterval(interval);
    }, [isPlaying, volume]);

    return (
        <div className="w-40 shrink-0 flex flex-col h-full border-l border-daw-surface/10 bg-daw-bg relative z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] transition-colors">
            
            {/* Header / Comp */}
            <div className="flex-1 flex flex-col items-center justify-start pt-8 py-6 gap-4 overflow-y-auto">
                <div className="text-[9px] font-bold text-daw-muted uppercase tracking-widest opacity-50 mb-2">Master Bus</div>
                
                <div className="w-28 p-4 rounded-xl bg-daw-bg shadow-neu-out flex flex-col gap-3 items-center border border-daw-surface/5">
                    <div className="flex items-center justify-between w-full">
                        <span className="text-[8px] font-bold text-daw-muted uppercase tracking-tight">Bus Comp</span>
                        <div className="flex gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-daw-surface shadow-neu-in"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-daw-accent shadow-[0_0_6px_currentColor] animate-pulse"></div>
                        </div>
                    </div>
                    <Activity size={20} className="text-daw-accent opacity-80" />
                    <div className="w-full h-1 bg-daw-dark rounded-full overflow-hidden">
                        <div className="w-2/3 h-full bg-daw-accent opacity-50"></div>
                    </div>
                </div>
            </div>

            {/* Fader Section */}
            <div className="shrink-0 h-[320px] bg-daw-bg flex flex-col items-center pb-3 pt-4 gap-3 relative shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-daw-surface/10">
                <button className="w-8 h-8 rounded-full shadow-neu-out active:shadow-neu-in text-daw-accent flex items-center justify-center hover:text-daw-text transition-all border border-daw-surface/5">
                    <Power size={14} />
                </button>

                 <div className="flex-1 w-full flex justify-center gap-3 px-2 relative mt-1 min-h-0 bg-daw-dark/20 mx-4 py-2 rounded-lg inner-shadow border border-daw-surface/5">
                    {/* Scale */}
                    <div className="flex flex-col justify-between h-full text-[7px] text-daw-muted font-mono opacity-30 py-3 select-none">
                         {DB_SCALE.map(db => <span key={db}>{db}</span>)}
                    </div>

                    {/* Master Fader */}
                    <div className="h-full relative w-12 bg-daw-bg rounded-full shadow-neu-in flex justify-center border border-daw-surface/5">
                         <div className="absolute top-2 bottom-2 w-[1px] bg-daw-surface/20"></div>
                         <div 
                            className="absolute w-8 h-12 bg-daw-bg rounded shadow-neu-btn cursor-ns-resize z-20 flex items-center justify-center border border-daw-accent/20 hover:border-daw-accent/50 transition-colors"
                            style={{ 
                                bottom: `${Math.min((volume / 1.0) * 100, 100)}%`,
                                transform: 'translateY(50%)' 
                            }}
                            onMouseDown={(e) => {
                                const startY = e.clientY;
                                const startVol = volume;
                                const handleMove = (moveEvent: MouseEvent) => {
                                    const deltaY = startY - moveEvent.clientY;
                                    const change = (deltaY / 200); 
                                    const newVol = Math.min(Math.max(startVol + change, 0), 1.0);
                                    onChange(newVol);
                                };
                                const handleUp = () => {
                                    window.removeEventListener('mousemove', handleMove);
                                    window.removeEventListener('mouseup', handleUp);
                                };
                                window.addEventListener('mousemove', handleMove);
                                window.addEventListener('mouseup', handleUp);
                            }}
                         >
                              <div className="w-6 h-[2px] bg-daw-accent shadow-[0_0_8px_currentColor]"></div>
                         </div>
                    </div>

                    {/* Stereo Meters */}
                    <div className="flex gap-1 h-full">
                        <LEDMeter level={meterLevel} active={true} height="h-full" />
                        <LEDMeter level={meterLevel * 0.96} active={true} height="h-full" />
                    </div>
                </div>
                 
                 <div className="w-full px-2 mt-auto">
                    <div className="w-full py-2 rounded text-center text-[9px] font-bold text-daw-text uppercase tracking-widest shadow-neu-pressed bg-daw-bg border border-daw-surface/5">
                        Master
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Mixer: React.FC<MixerProps> = ({ 
    tracks, masterVolume, onUpdateTrack, onMasterVolumeChange, onSelectTrack, selectedTrackId, isPlaying 
}) => {
  return (
    <div className="h-full w-full flex flex-col bg-daw-bg overflow-hidden animate-in fade-in duration-300 transition-colors">
        
        {/* Mixer Header */}
        <div className="h-12 shrink-0 bg-daw-bg border-b border-daw-surface/10 flex items-center justify-between px-6 z-30 shadow-neu-out relative transition-colors">
             <span className="text-[10px] font-bold text-daw-muted uppercase tracking-wider flex items-center gap-2">
                <Music size={14} className="text-daw-text" /> Console View
             </span>
             <div className="flex items-center gap-4">
                 <span className="text-[9px] text-daw-muted opacity-50 font-mono flex items-center gap-1">
                    <Activity size={10}/> {tracks.length} Channels Active
                 </span>
                 <button className="text-daw-muted hover:text-daw-text transition-colors">
                    <MoreVertical size={14} />
                 </button>
             </div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 w-full overflow-x-auto overflow-y-hidden flex relative bg-daw-dark transition-colors">
            
            {/* Left Spacer */}
            <div className="w-6 shrink-0 bg-daw-bg border-r border-daw-surface/5"></div>

            {/* Tracks */}
            {tracks.map(track => (
                <MixerStrip 
                    key={track.id} 
                    track={track} 
                    isSelected={selectedTrackId === track.id}
                    onUpdate={onUpdateTrack}
                    onSelect={() => onSelectTrack(track.id)}
                    isPlaying={isPlaying}
                />
            ))}
            
            {/* Master Strip */}
            <MasterStrip 
                volume={masterVolume} 
                onChange={onMasterVolumeChange} 
                isPlaying={isPlaying}
            />
            
            {/* Right Spacer buffer */}
             <div className="w-12 shrink-0 bg-daw-bg"></div>
        </div>
    </div>
  );
};
