
import React, { useRef, useState } from 'react';
import { TimelineBlock, Pattern } from '../types';
import { Trash2, Edit3, ZoomIn, ZoomOut, MousePointer2 } from 'lucide-react';

interface TimelineProps {
  blocks: TimelineBlock[];
  patterns: Pattern[];
  currentPatternId: string;
  currentStep: number; // Global song step
  onAddBlock: (trackIndex: number, startStep: number) => void;
  onRemoveBlock: (blockId: string) => void;
  onSeek: (step: number) => void;
}

const TOTAL_BARS = 100;
const STEPS_PER_BAR = 16;
const TRACK_LANES = 12;

export const Timeline: React.FC<TimelineProps> = ({
  blocks,
  patterns,
  currentPatternId,
  currentStep,
  onAddBlock,
  onRemoveBlock,
  onSeek
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.8); 
  const [tool, setTool] = useState<'draw' | 'erase'>('draw');
  const [hoverCell, setHoverCell] = useState<{lane: number, bar: number} | null>(null);

  // Constants derived from zoom
  const baseBarWidth = 140;
  const barWidth = baseBarWidth * zoom;
  const totalWidth = TOTAL_BARS * barWidth;
  
  const currentPattern = patterns.find(p => p.id === currentPatternId);

  const handleGridClick = (e: React.MouseEvent, laneIndex: number) => {
    if (e.button !== 0) return; // Only left click handles add/erase logic via tool
    if (!scrollContainerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    
    // Calculate exact bar based on click position
    const barIndex = Math.floor(clickX / barWidth);
    const stepStart = barIndex * STEPS_PER_BAR;

    const existingBlock = blocks.find(b => 
      b.trackIndex === laneIndex && 
      b.startStep >= stepStart && 
      b.startStep < stepStart + STEPS_PER_BAR
    );

    if (tool === 'erase') {
      if (existingBlock) onRemoveBlock(existingBlock.id);
    } else {
      if (!existingBlock) {
        onAddBlock(laneIndex, stepStart);
      } else {
          // If drawing on top of existing, we could replace, but for now safe to do nothing
      }
    }
  };

  const handleRulerClick = (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = clickX / barWidth;
      const step = Math.floor(ratio * STEPS_PER_BAR);
      onSeek(Math.max(0, step));
  };

  // Deterministic random for consistent visualization
  const getVisualBars = (id: string) => {
    const bars = [];
    for(let i = 0; i < 16; i++) {
        const charCode = id.charCodeAt(i % id.length) || 10;
        // Simple pseudo random function
        const val = Math.abs(Math.sin(charCode * (i + 1))) * 100;
        bars.push(val);
    }
    return bars;
  };

  return (
    <div className="flex-1 flex flex-col bg-daw-dark overflow-hidden select-none animate-in fade-in duration-300 transition-colors">
      
      {/* Toolbar */}
      <div className="h-14 border-b border-daw-surface/10 bg-daw-bg shadow-neu-out z-20 flex items-center px-4 justify-between shrink-0 transition-colors">
          <div className="flex items-center gap-3 bg-daw-bg p-1.5 rounded-xl shadow-neu-pressed">
              <button 
                onClick={() => setTool('draw')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${tool === 'draw' ? 'bg-daw-accent text-daw-bg shadow-neu-glow scale-105' : 'text-daw-muted hover:text-daw-text'}`}
              >
                  <Edit3 size={14} /> Draw
              </button>
              <button 
                onClick={() => setTool('erase')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${tool === 'erase' ? 'bg-red-500 text-white shadow-neu-glow scale-105' : 'text-daw-muted hover:text-daw-text'}`}
              >
                  <Trash2 size={14} /> Erase
              </button>
          </div>

          <div className="flex items-center gap-4 bg-daw-bg px-4 py-2 rounded-full shadow-neu-out">
              <div className="flex items-center gap-3">
                  <ZoomOut size={16} className="text-daw-muted"/>
                  <input 
                    type="range" 
                    min="0.4" 
                    max="1.5" 
                    step="0.1" 
                    value={zoom} 
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-32 h-1 bg-daw-surface rounded-lg appearance-none cursor-pointer accent-daw-accent"
                  />
                  <ZoomIn size={16} className="text-daw-muted"/>
              </div>
          </div>
      </div>

      {/* Main Timeline Area */}
      <div className="flex-1 overflow-auto custom-scrollbar relative bg-daw-dark transition-colors" ref={scrollContainerRef}>
        
        {/* Sticky Ruler */}
        <div 
            className="sticky top-0 left-0 z-30 h-10 bg-daw-bg border-b border-daw-surface/20 flex cursor-pointer group hover:bg-daw-surface/5 shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-colors"
            style={{ width: Math.max(totalWidth + 100, 2000) }} 
            onClick={handleRulerClick}
        >
            {/* Corner */}
            <div className="w-24 shrink-0 border-r border-daw-surface/10 bg-daw-bg sticky left-0 z-40 flex items-center justify-center shadow-[5px_0_10px_rgba(0,0,0,0.1)] transition-colors">
                <MousePointer2 size={14} className="text-daw-muted opacity-50" />
            </div>
            
            {/* Bar Numbers */}
            <div className="flex-1 relative bg-[linear-gradient(90deg,transparent_98%,var(--c-surface)_98%)]" style={{ backgroundSize: `${barWidth}px 100%` }}>
                {Array.from({ length: TOTAL_BARS }).map((_, i) => (
                    <div key={i} className="absolute top-0 bottom-0 border-l border-daw-text/10 pl-1.5 pt-2 text-[10px] font-mono text-daw-muted pointer-events-none select-none font-bold" style={{ left: i * barWidth }}>
                        {i + 1}
                    </div>
                ))}
                {/* Scrubbing Highlight */}
                <div className="absolute inset-0 bg-daw-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </div>
        </div>

        {/* Tracks & Grid */}
        <div className="relative" style={{ width: Math.max(totalWidth + 100, 2000) }}>
            
            {/* Playhead (Full Height) */}
            <div 
                className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-30 pointer-events-none ml-24 shadow-[0_0_15px_red] transition-transform duration-75 ease-linear"
                style={{ transform: `translateX(${(currentStep / STEPS_PER_BAR) * barWidth}px)` }}
            >
                <div className="w-4 h-4 -ml-[7px] bg-red-500 rounded-full absolute -top-2 shadow-sm border-2 border-white"></div>
            </div>

            {Array.from({ length: TRACK_LANES }).map((_, laneIndex) => (
                <div key={laneIndex} className="h-24 flex relative border-b border-daw-surface/5 hover:bg-daw-surface/5 transition-colors group/lane">
                    
                    {/* Sticky Track Header */}
                    <div className="w-24 shrink-0 sticky left-0 z-20 bg-daw-bg border-r border-daw-surface/10 flex flex-col items-center justify-center gap-1 shadow-[5px_0_10px_rgba(0,0,0,0.1)] group-hover/lane:bg-daw-surface transition-colors">
                        <span className="text-xs font-bold text-daw-muted group-hover/lane:text-daw-text transition-colors">Track {laneIndex + 1}</span>
                    </div>

                    {/* Grid Lane */}
                    <div 
                        className="flex-1 relative cursor-crosshair"
                        onClick={(e) => handleGridClick(e, laneIndex)}
                        onMouseMove={(e) => {
                             const rect = e.currentTarget.getBoundingClientRect();
                             const x = e.clientX - rect.left;
                             const bar = Math.floor(x / barWidth);
                             setHoverCell({ lane: laneIndex, bar });
                        }}
                        onMouseLeave={() => setHoverCell(null)}
                        style={{
                            // Detailed Grid Pattern
                            backgroundImage: `
                                linear-gradient(to right, var(--c-text) 1px, transparent 1px),
                                linear-gradient(to right, var(--c-text) 25%, transparent 25%),
                                linear-gradient(to right, var(--c-text) 50%, transparent 50%),
                                linear-gradient(to right, var(--c-text) 75%, transparent 75%)
                            `,
                            backgroundSize: `${barWidth}px 100%`,
                            opacity: 0.05 // Faint grid lines
                        }}
                    >
                        {/* Hover Ghost */}
                        {tool === 'draw' && hoverCell?.lane === laneIndex && (
                            <div 
                                className="absolute top-2 bottom-2 rounded-lg bg-daw-text/5 border-2 border-dashed border-daw-accent/30 pointer-events-none z-0 flex items-center justify-center"
                                style={{ 
                                    left: hoverCell.bar * barWidth, 
                                    width: barWidth 
                                }}
                            >
                                <span className="text-[10px] text-daw-muted opacity-50 uppercase font-bold tracking-widest">{currentPattern?.name}</span>
                            </div>
                        )}

                        {/* Placed Blocks */}
                        {blocks.filter(b => b.trackIndex === laneIndex).map(block => {
                            const pName = patterns.find(p => p.id === block.patternId)?.name || 'Unknown';
                            const blockStartBar = block.startStep / STEPS_PER_BAR;
                            
                            return (
                                <div
                                    key={block.id}
                                    className={`absolute top-2 bottom-2 rounded-lg overflow-hidden shadow-lg border-l-4 z-10 group/block transition-transform hover:scale-[1.01] hover:brightness-110 ${
                                        tool === 'erase' ? 'hover:bg-red-900/50 cursor-not-allowed border-red-500' : 'bg-daw-surface border-daw-accent cursor-pointer'
                                    }`}
                                    style={{
                                        left: blockStartBar * barWidth,
                                        width: barWidth - 2, // Slight gap
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (tool === 'erase') onRemoveBlock(block.id);
                                    }}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        onRemoveBlock(block.id);
                                    }}
                                >
                                    <div className="w-full h-full bg-gradient-to-r from-daw-accent/5 to-transparent p-2 flex flex-col justify-between select-none">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-daw-text truncate drop-shadow-md tracking-tight">{pName}</span>
                                        </div>
                                        {/* Deterministic Fake waveform visual */}
                                        <div className="h-5 w-full flex items-end gap-[2px] opacity-40">
                                            {getVisualBars(block.id).map((h, i) => (
                                                <div key={i} className="bg-daw-accent/80 w-full rounded-t-sm shadow-[0_0_5px_rgba(255,255,255,0.2)]" style={{ height: `${h}%` }}></div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Hover overlay for erase tool */}
                                    {tool === 'erase' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/block:opacity-100 transition-opacity backdrop-blur-sm">
                                            <Trash2 size={20} className="text-red-500 animate-pulse" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
