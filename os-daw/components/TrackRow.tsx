import React from 'react';
import { Track } from '../types';
import { Volume2, VolumeX, Mic2, Music } from 'lucide-react';

interface TrackRowProps {
  track: Track;
  steps: boolean[];
  currentStep: number;
  isSelected: boolean;
  onToggleStep: (trackId: string, stepIndex: number) => void;
  onSelect: (trackId: string) => void;
  onMute: (trackId: string) => void;
  onSolo: (trackId: string) => void;
}

export const TrackRow: React.FC<TrackRowProps> = ({ 
  track, steps, currentStep, isSelected, onToggleStep, onSelect, onMute, onSolo 
}) => {
  // Ensure steps exist
  const activeSteps = steps || Array(16).fill(false);

  return (
    <div 
      className={`flex items-center h-24 transition-all duration-300 group relative border-b border-transparent ${
        isSelected ? 'bg-transparent' : 'bg-transparent'
      }`}
      onClick={() => onSelect(track.id)}
    >
      {/* Left Active Indicator Bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${isSelected ? 'bg-daw-accent shadow-[0_0_10px_white]' : 'bg-transparent'}`}></div>

      {/* Track Header */}
      <div className="w-56 flex-shrink-0 p-4 border-r border-daw-bg/50 flex items-center justify-between z-10">
        <div className="flex items-center gap-4 min-w-0 overflow-visible">
           {/* Neumorphic Icon Container */}
           {/* Added z-20 and ensure parent doesn't clip shadows */}
          <div 
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shrink-0 bg-daw-bg relative z-20 ${isSelected ? 'text-daw-accent shadow-neu-pressed' : 'text-daw-muted shadow-neu-out'}`}
          >
             {track.type === 'synth' ? <Music size={18} /> : <Mic2 size={18} />}
          </div>
          
          <div className="flex flex-col min-w-0">
            <span className={`text-sm font-bold truncate tracking-tight transition-colors ${isSelected ? 'text-white' : 'text-daw-muted'}`}>{track.name}</span>
            <span className="text-[10px] text-daw-muted uppercase tracking-wider font-semibold opacity-60">
              {track.type}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={(e) => { e.stopPropagation(); onMute(track.id); }}
            className={`w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                track.muted 
                ? 'shadow-neu-in text-white bg-daw-bg' 
                : 'shadow-neu-out text-daw-muted hover:text-daw-text'
            }`}
            title="Mute"
          >
            {track.muted ? <VolumeX size={10} /> : <Volume2 size={10} />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onSolo(track.id); }}
            className={`w-6 h-6 flex items-center justify-center rounded-full text-[9px] font-bold transition-all ${
                track.solo 
                ? 'shadow-neu-in text-white bg-daw-bg border border-daw-surface' 
                : 'shadow-neu-out text-daw-muted hover:text-daw-text'
            }`}
            title="Solo"
          >
            S
          </button>
        </div>
      </div>

      {/* Sequencer Grid */}
      <div className="flex-1 flex items-center px-4 gap-2 overflow-x-auto no-scrollbar h-full">
        {activeSteps.map((active, index) => {
          const isCurrent = index === currentStep;
          const isBeat = index % 4 === 0;
          
          return (
            <button
              key={index}
              onClick={(e) => { e.stopPropagation(); onToggleStep(track.id, index); }}
              // Changed flex-1 to w-14 shrink-0 to prevent resizing on window resize
              className={`
                w-14 shrink-0 h-12 rounded-md transition-all duration-150 relative
                flex items-center justify-center
                ${active 
                  ? 'bg-daw-accent shadow-neu-glow z-10 scale-[0.95]' 
                  : 'bg-daw-bg shadow-neu-out hover:shadow-neu-btn active:shadow-neu-pressed'}
                ${!active && isBeat ? 'opacity-100' : 'opacity-100'}
              `}
            >
              {/* Playhead Overlay */}
              {isCurrent && (
                <div className={`absolute -top-1 -bottom-1 w-[2px] z-20 pointer-events-none shadow-[0_0_8px_white] ${active ? 'bg-black' : 'bg-white'}`}></div>
              )}

              {/* Center Dot for visual anchor on inactive steps */}
              {!active && (
                  <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isBeat ? 'bg-daw-muted/50' : 'bg-daw-surface'}`}></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};