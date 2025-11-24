
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Settings, Wand2, Plus, Info, Layers, Music2, ChevronLeft, ChevronRight, Speaker, Zap, Sliders } from 'lucide-react';
import { INITIAL_TRACKS, DEFAULT_BPM, STEPS_PER_BAR, LOOKAHEAD_MS, SCHEDULE_AHEAD_TIME, DEFAULT_SYNTH, DEFAULT_OSC, TRACK_COLORS, INITIAL_PATTERNS } from './constants';
import { Track, ProjectState, TrackType, Pattern, TimelineBlock } from './types';
import { audioEngine } from './services/audioEngine';
import { TrackRow } from './components/TrackRow';
import { SynthEditor } from './components/SynthEditor';
import { Assistant } from './components/Assistant';
import { InfoModal } from './components/InfoModal';
import { SettingsModal } from './components/SettingsModal';
import { Timeline } from './components/Timeline';
import { Mixer } from './components/Mixer';

type ViewMode = 'SEQUENCER' | 'TIMELINE' | 'MIXER';
type PlayMode = 'PAT' | 'SONG';
type VisMode = 'FFT' | 'SCOPE';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
  // Global State
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [patterns, setPatterns] = useState<Pattern[]>(INITIAL_PATTERNS);
  const [timeline, setTimeline] = useState<TimelineBlock[]>([]);
  const [currentPatternId, setCurrentPatternId] = useState<string>(INITIAL_PATTERNS[0].id);
  
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMetronomeOn, setIsMetronomeOn] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.8);
  
  const [playMode, setPlayMode] = useState<PlayMode>('PAT');
  const [viewMode, setViewMode] = useState<ViewMode>('SEQUENCER');
  
  const [currentStep, setCurrentStep] = useState(0); 
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(tracks[0].id);
  
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [visMode, setVisMode] = useState<VisMode>('FFT');
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  // Theme State
  const [theme, setTheme] = useState<Theme>('dark');

  // BPM Drag State
  const [isDraggingBpm, setIsDraggingBpm] = useState(false);
  const bpmStartY = useRef(0);
  const bpmStartVal = useRef(0);

  // Scheduler State
  const nextNoteTimeRef = useRef<number>(0);
  const currentStepRef = useRef<number>(0); 
  const timerIDRef = useRef<number | null>(null);

  // Visualizer Ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Helpers
  const selectedTrack = tracks.find(t => t.id === selectedTrackId) || null;
  const currentPattern = patterns.find(p => p.id === currentPatternId) || patterns[0];

  // Theme Effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Initialize audio on first interaction (Click)
  useEffect(() => {
    const unlockAudio = () => {
      if (!isAudioInitialized) {
        audioEngine.init();
        audioEngine.resume();
        audioEngine.setMasterVolume(masterVolume);
        
        // Load default samples for initial tracks if needed
        audioEngine.loadPreset('t-2', 'kick-808');
        audioEngine.loadPreset('t-3', 'hat-closed');
        
        setIsAudioInitialized(true);
      }
    };
    
    // Only add global click listener if not initialized
    if (!isAudioInitialized) {
        document.addEventListener('click', unlockAudio, { once: true });
    }
    
    return () => document.removeEventListener('click', unlockAudio);
  }, [isAudioInitialized, masterVolume]);

  // Update master volume when state changes
  useEffect(() => {
      audioEngine.setMasterVolume(masterVolume);
  }, [masterVolume]);

  // --- Visualizer Loop ---
  useEffect(() => {
      const renderVisualizer = () => {
          if (!canvasRef.current) return;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          const width = canvas.width;
          const height = canvas.height;

          // Clear
          ctx.clearRect(0, 0, width, height);
          
          // Style: Pure White Glowing "OLED" Look
          // We assume a dark background for the canvas container for contrast
          const primaryColor = '255, 255, 255'; 

          // If Audio not ready, draw idle state (flat line)
          if (!isAudioInitialized || !audioEngine.analyser) {
               ctx.beginPath();
               ctx.moveTo(0, height / 2);
               ctx.lineTo(width, height / 2);
               ctx.strokeStyle = `rgba(${primaryColor}, 0.2)`;
               ctx.lineWidth = 2;
               ctx.shadowBlur = 5;
               ctx.shadowColor = `rgba(${primaryColor}, 0.5)`;
               ctx.stroke();
               animationRef.current = requestAnimationFrame(renderVisualizer);
               return;
          }
          
          // Ensure data array exists and matches buffer size
          const bufferLength = audioEngine.analyser.frequencyBinCount;
          if (!dataArrayRef.current || dataArrayRef.current.length !== bufferLength) {
              dataArrayRef.current = new Uint8Array(bufferLength);
          }
          const dataArray = dataArrayRef.current;
          
          // Global Glow Style
          ctx.shadowBlur = 15;
          ctx.shadowColor = `rgba(${primaryColor}, 0.8)`;
          ctx.strokeStyle = `rgb(${primaryColor})`;
          ctx.fillStyle = `rgb(${primaryColor})`;
          
          if (visMode === 'FFT') {
              audioEngine.getAnalyzerData(dataArray);
              
              const barCount = 48; // Higher count for smoother look
              const barWidth = (width / barCount) * 0.8;
              const spacing = (width / barCount) * 0.2;
              
              // Focus on sub-bass to mid-highs (ignore extremely high freqs which are often empty)
              const effectiveBuffer = bufferLength * 0.6; 
              const step = Math.floor(effectiveBuffer / barCount);

              for(let i = 0; i < barCount; i++) {
                  let sum = 0;
                  for(let j = 0; j < step; j++) {
                      sum += dataArray[Math.floor(i * step) + j];
                  }
                  const avg = sum / step;
                  // Non-linear scaling for better visual movement
                  const val = Math.pow(avg / 255, 1.2); 
                  
                  const barHeight = Math.max(2, val * height * 0.9);
                  const x = i * (barWidth + spacing) + spacing/2;
                  
                  // Draw with gradient opacity for "fading tail" look
                  const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
                  grad.addColorStop(0, `rgba(${primaryColor}, 0.1)`);
                  grad.addColorStop(1, `rgba(${primaryColor}, 1.0)`);
                  ctx.fillStyle = grad;
                  
                  // Rounded caps
                  ctx.beginPath();
                  ctx.roundRect(x, height - barHeight, barWidth, barHeight, 2);
                  ctx.fill();
              }
          } else {
              // SCOPE MODE
              audioEngine.getOscilloscopeData(dataArray);
              ctx.lineWidth = 2;
              ctx.lineJoin = 'round';
              ctx.lineCap = 'round';
              
              ctx.beginPath();
              
              const sliceWidth = width * 1.0 / bufferLength;
              let x = 0;
              
              for(let i = 0; i < bufferLength; i++) {
                  const v = dataArray[i] / 128.0;
                  const y = v * height / 2;
                  
                  if(i === 0) ctx.moveTo(x, y);
                  else ctx.lineTo(x, y);
                  
                  x += sliceWidth;
              }
              ctx.stroke();
          }
          
          animationRef.current = requestAnimationFrame(renderVisualizer);
      };
      
      renderVisualizer();
      return () => {
          if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
  }, [visMode, isAudioInitialized]);

  // --- Playback Logic ---

  const nextNote = () => {
    const secondsPerBeat = 60.0 / bpm;
    const secondsPerStep = secondsPerBeat / 4; 
    nextNoteTimeRef.current += secondsPerStep;
    currentStepRef.current += 1;
  };

  const scheduleNote = (stepCount: number, time: number) => {
    // Metronome
    if (isMetronomeOn && stepCount % 4 === 0) {
        audioEngine.playMetronome(time);
    }

    if (playMode === 'PAT') {
      const patternStep = stepCount % STEPS_PER_BAR;
      tracks.forEach(track => {
        const active = currentPattern.steps[track.id]?.[patternStep];
        if (active) {
          audioEngine.playStep(track, time);
        }
      });

      const drawTime = (time - audioEngine.getCurrentTime()) * 1000;
      setTimeout(() => {
        setCurrentStep(patternStep);
      }, Math.max(0, drawTime));

    } else {
      const activeBlocks = timeline.filter(block => 
        stepCount >= block.startStep && stepCount < block.startStep + STEPS_PER_BAR
      );

      activeBlocks.forEach(block => {
        const pattern = patterns.find(p => p.id === block.patternId);
        if (pattern) {
          const relativeStep = (stepCount - block.startStep);
          if (relativeStep >= 0 && relativeStep < STEPS_PER_BAR) {
             tracks.forEach(track => {
                if (pattern.steps[track.id]?.[relativeStep]) {
                  audioEngine.playStep(track, time);
                }
             });
          }
        }
      });

      const drawTime = (time - audioEngine.getCurrentTime()) * 1000;
      setTimeout(() => {
        setCurrentStep(stepCount);
      }, Math.max(0, drawTime));
    }
  };

  const scheduler = useCallback(() => {
    while (nextNoteTimeRef.current < audioEngine.getCurrentTime() + SCHEDULE_AHEAD_TIME) {
      scheduleNote(currentStepRef.current, nextNoteTimeRef.current);
      nextNote();
    }
    timerIDRef.current = window.setTimeout(scheduler, LOOKAHEAD_MS);
  }, [bpm, tracks, patterns, timeline, playMode, currentPatternId, isMetronomeOn]);

  useEffect(() => {
    if (isPlaying) {
      if (audioEngine.ctx?.state === 'suspended') audioEngine.ctx.resume();
      
      if (nextNoteTimeRef.current < audioEngine.getCurrentTime()) {
          nextNoteTimeRef.current = audioEngine.getCurrentTime() + 0.1;
      }
      
      scheduler();
    } else {
      if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
    }
    return () => {
      if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
    };
  }, [isPlaying, scheduler]);

  // --- Handlers ---

  const togglePlay = () => {
      // Auto-initialize audio if not yet ready
      if (!isAudioInitialized) {
          audioEngine.init();
          audioEngine.resume();
          audioEngine.setMasterVolume(masterVolume);
          // Load defaults just in case
          audioEngine.loadPreset('t-2', 'kick-808');
          audioEngine.loadPreset('t-3', 'hat-closed');
          setIsAudioInitialized(true);
      } else if (audioEngine.ctx?.state === 'suspended') {
          audioEngine.ctx.resume();
      }

      setIsPlaying(!isPlaying);
  };
  
  const handleSeek = (step: number) => {
      setCurrentStep(step);
      currentStepRef.current = step;
      nextNoteTimeRef.current = audioEngine.getCurrentTime() + 0.1;
  };

  const handleTrackUpdate = (updatedTrack: Track) => {
    setTracks(tracks.map(t => t.id === updatedTrack.id ? updatedTrack : t));
  };

  const handleStepToggle = (trackId: string, stepIndex: number) => {
    setPatterns(prev => prev.map(p => {
      if (p.id !== currentPatternId) return p;
      const currentSteps = p.steps[trackId] || Array(16).fill(false);
      const newSteps = [...currentSteps];
      newSteps[stepIndex] = !newSteps[stepIndex];
      return {
        ...p,
        steps: {
          ...p.steps,
          [trackId]: newSteps
        }
      };
    }));
  };

  const handleClearPatterns = () => {
    setPatterns(prev => prev.map(p => ({
        ...p,
        steps: {} 
    })));
    setTimeline([]);
  };

  const addNewTrack = () => {
    const color = TRACK_COLORS[tracks.length % TRACK_COLORS.length];
    const newTrack: Track = {
        id: `t-${Date.now()}`,
        name: `Track ${tracks.length + 1}`,
        type: TrackType.Synth,
        muted: false,
        solo: false,
        volume: 0.7,
        pan: 0,
        color: color,
        synthParams: {
            ...DEFAULT_SYNTH,
            oscillators: [{ ...DEFAULT_OSC }]
        }
    };
    setTracks([...tracks, newTrack]);
  };

  const createNewPattern = () => {
    const id = `p-${Date.now()}`;
    const newPattern: Pattern = {
        id,
        name: `Pattern ${patterns.length + 1}`,
        steps: {}
    };
    setPatterns([...patterns, newPattern]);
    setCurrentPatternId(id);
  };

  const cyclePattern = (direction: 'prev' | 'next') => {
    const idx = patterns.findIndex(p => p.id === currentPatternId);
    if (idx === -1) return;
    
    let newIdx = direction === 'next' ? idx + 1 : idx - 1;
    if (newIdx >= patterns.length) newIdx = 0;
    if (newIdx < 0) newIdx = patterns.length - 1;
    
    setCurrentPatternId(patterns[newIdx].id);
  };

  const handleAddBlockToTimeline = (trackIndex: number, startStep: number) => {
      const newBlock: TimelineBlock = {
          id: `b-${Date.now()}`,
          patternId: currentPatternId,
          startStep,
          trackIndex
      };
      setTimeline([...timeline, newBlock]);
  };

  const handleRemoveBlockFromTimeline = (blockId: string) => {
      setTimeline(timeline.filter(b => b.id !== blockId));
  };


  const handleBpmMouseDown = (e: React.MouseEvent) => {
    setIsDraggingBpm(true);
    bpmStartY.current = e.clientY;
    bpmStartVal.current = bpm;
    document.body.style.cursor = 'ns-resize';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!isDraggingBpm) return;
        const delta = bpmStartY.current - e.clientY;
        const newValue = Math.min(Math.max(bpmStartVal.current + delta, 40), 300);
        setBpm(Math.round(newValue));
    };
    const handleMouseUp = () => {
        setIsDraggingBpm(false);
        document.body.style.cursor = 'default';
    };

    if (isDraggingBpm) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingBpm]);

  const projectState: ProjectState = {
    bpm,
    isPlaying,
    isMetronomeOn,
    currentStep,
    tracks,
    patterns,
    timeline,
    currentPatternId,
    selectedTrackId,
    theme: theme,
    playMode
  };

  return (
    <div className="flex flex-col h-screen bg-daw-bg text-daw-text font-sans select-none transition-colors duration-300">
      {/* Header */}
      <header className="h-20 bg-daw-bg border-b border-daw-surface/10 flex items-center justify-between px-6 shadow-neu-out z-20 shrink-0 relative overflow-x-auto no-scrollbar gap-8 transition-colors duration-300">
        
        {/* Left Section */}
        <div className="flex items-center gap-8 shrink-0">
          <div className="flex items-center gap-3 text-daw-text">
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2.5 rounded-full shadow-neu-out bg-daw-bg hover:text-daw-accent hover:shadow-neu-pressed transition-all active:shadow-neu-in text-daw-muted"
                title="Settings"
            >
                <Settings className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
                 <h1 className="text-xl font-bold tracking-widest text-daw-text uppercase drop-shadow-sm hidden md:block transition-colors">Os-Daw</h1>
                 
                 {/* Visualizer Canvas Container - Always Dark Screen Style */}
                 <div 
                    className="w-36 h-12 bg-[#0a0a0a] rounded-lg flex items-center justify-center overflow-hidden border border-daw-surface/20 cursor-pointer hover:border-daw-accent/50 transition-colors shadow-inner relative group"
                    onClick={() => setVisMode(prev => prev === 'FFT' ? 'SCOPE' : 'FFT')}
                    title="Click to switch Visualizer Mode"
                 >
                     <canvas ref={canvasRef} width={300} height={100} className="w-full h-full opacity-90"></canvas>
                     {/* Overlay Scanline effect */}
                     <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
                     {/* Mode Label */}
                     <div className="absolute bottom-1 right-2 text-[6px] font-mono text-white/30 uppercase tracking-widest pointer-events-none group-hover:text-white/60 transition-colors">
                         {visMode}
                     </div>
                 </div>
            </div>
          </div>
          
          <div className="h-10 w-[2px] rounded-full bg-daw-bg shadow-neu-pressed hidden sm:block"></div>

          {/* Transport */}
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsMetronomeOn(!isMetronomeOn)}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${isMetronomeOn ? 'text-daw-accent shadow-neu-pressed' : 'text-daw-muted shadow-neu-out hover:text-daw-text'}`}
                title="Metronome"
            >
                <Zap size={14} fill={isMetronomeOn ? "currentColor" : "none"} />
            </button>

            <button 
              onClick={() => { setIsPlaying(false); setCurrentStep(0); currentStepRef.current = 0; }} 
              className="w-10 h-10 flex items-center justify-center text-daw-muted hover:text-daw-text rounded-full transition-all shadow-neu-out hover:shadow-neu-pressed active:shadow-neu-in"
              title="Stop"
            >
                <Square size={14} fill="currentColor" />
            </button>
            <button 
              onClick={togglePlay}
              className={`w-14 h-14 flex items-center justify-center rounded-full transition-all ${
                  isPlaying 
                  ? 'shadow-neu-pressed text-daw-accent' 
                  : 'shadow-neu-out text-daw-text hover:text-daw-accent hover:shadow-neu-pressed'
              }`}
              title="Play/Pause"
            >
              {isPlaying ? <span className="font-bold text-[10px] tracking-widest">PAUSE</span> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>
          </div>

          {/* BPM */}
          <div 
            className="group relative w-20 h-12 bg-daw-bg rounded-xl shadow-neu-pressed flex flex-col items-center justify-center cursor-ns-resize transition-all hover:shadow-neu-in hidden md:flex"
            onMouseDown={handleBpmMouseDown}
            title="Drag up/down to change BPM"
          >
             <span className="text-lg font-mono text-daw-text font-bold leading-none tracking-widest z-10">
                 {bpm}
             </span>
             <span className="text-[8px] text-daw-muted font-bold uppercase tracking-widest mt-1">BPM</span>
          </div>

           {/* Play Mode */}
           <div className="flex items-center gap-2 bg-daw-bg p-1 rounded-lg shadow-neu-pressed shrink-0">
              <button
                onClick={() => setPlayMode('PAT')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${playMode === 'PAT' ? 'bg-daw-accent text-daw-bg shadow-sm' : 'text-daw-muted hover:text-daw-text'}`}
              >
                Pat
              </button>
              <button
                onClick={() => setPlayMode('SONG')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${playMode === 'SONG' ? 'bg-daw-accent text-daw-bg shadow-sm' : 'text-daw-muted hover:text-daw-text'}`}
              >
                Song
              </button>
           </div>
        </div>

        {/* Center Controls */}
        <div className="flex items-center gap-4 shrink-0 mx-auto">
            <div className="flex items-center gap-2 bg-daw-bg px-2 py-1 rounded-full shadow-neu-out">
                 <button onClick={() => cyclePattern('prev')} className="p-2 hover:text-daw-text text-daw-muted transition-colors"><ChevronLeft size={16}/></button>
                 <div className="w-32 text-center">
                    <div className="text-[10px] text-daw-muted uppercase tracking-widest font-bold">Current Pattern</div>
                    <div className="text-sm font-bold text-daw-text truncate">{currentPattern.name}</div>
                 </div>
                 <button onClick={() => cyclePattern('next')} className="p-2 hover:text-daw-text text-daw-muted transition-colors"><ChevronRight size={16}/></button>
            </div>
            <button onClick={createNewPattern} className="w-8 h-8 rounded-full shadow-neu-out hover:shadow-neu-pressed flex items-center justify-center text-daw-muted hover:text-daw-text transition-all" title="New Pattern">
                <Plus size={16}/>
            </button>
        </div>


        {/* Right Section */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="flex items-center gap-2 mr-4 border-r border-daw-surface/10 pr-6">
             <button 
                onClick={() => setViewMode('SEQUENCER')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${viewMode === 'SEQUENCER' ? 'shadow-neu-pressed text-daw-accent bg-daw-bg' : 'text-daw-muted hover:text-daw-text'}`}
                title="Sequencer View"
             >
                 <Layers size={16} /> <span className="text-[10px] font-bold uppercase hidden xl:inline">Seq</span>
             </button>
             <button 
                onClick={() => setViewMode('TIMELINE')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${viewMode === 'TIMELINE' ? 'shadow-neu-pressed text-daw-accent bg-daw-bg' : 'text-daw-muted hover:text-daw-text'}`}
                title="Timeline View"
             >
                 <Music2 size={16} /> <span className="text-[10px] font-bold uppercase hidden xl:inline">Timeline</span>
             </button>
             <button 
                onClick={() => setViewMode('MIXER')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${viewMode === 'MIXER' ? 'shadow-neu-pressed text-daw-accent bg-daw-bg' : 'text-daw-muted hover:text-daw-text'}`}
                title="Mixer View"
             >
                 <Sliders size={16} /> <span className="text-[10px] font-bold uppercase hidden xl:inline">Mixer</span>
             </button>
          </div>

          <button 
            onClick={() => setIsInfoOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full shadow-neu-out hover:shadow-neu-btn active:shadow-neu-pressed text-daw-muted hover:text-daw-text transition-all"
            title="Info"
          >
            <Info size={18} />
          </button>

          <button 
            onClick={() => setIsAiOpen(!isAiOpen)}
            className={`flex items-center gap-3 px-5 py-2.5 rounded-full transition-all duration-300 font-bold text-xs uppercase tracking-wider ${
                isAiOpen 
                ? 'shadow-neu-pressed text-daw-accent' 
                : 'shadow-neu-out text-daw-muted hover:text-daw-text hover:shadow-neu-btn'
            }`}
          >
            <Wand2 size={16} />
            <span className="hidden md:inline">AI Assist</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10 bg-daw-bg transition-colors duration-300">
        <div className="flex-1 flex flex-col min-w-0">
          
          <div className="flex-1 flex flex-col min-h-0 bg-daw-bg transition-colors duration-300">
            
            {viewMode === 'SEQUENCER' && (
                <>
                    <div className="h-16 flex items-center px-8 justify-between bg-daw-bg shrink-0 z-10 animate-in fade-in duration-300">
                    <div className="flex items-center gap-4">
                        <div className="text-xs font-bold text-daw-muted uppercase tracking-wider flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full transition-all duration-300 ${isPlaying && playMode === 'PAT' ? 'bg-daw-accent shadow-[0_0_8px_currentColor]' : 'bg-transparent shadow-neu-pressed'}`}></span>
                            Step Sequencer
                        </div>
                    </div>
                    <button 
                        onClick={addNewTrack}
                        className="flex items-center gap-2 text-xs font-bold text-daw-text hover:text-daw-accent bg-daw-bg px-6 py-3 rounded-full shadow-neu-out hover:shadow-neu-btn active:shadow-neu-pressed transition-all uppercase tracking-wide"
                    >
                        <Plus size={14} /> Add Track
                    </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
                    <div className="bg-daw-bg rounded-3xl shadow-neu-pressed overflow-hidden p-3 min-w-[600px] transition-colors duration-300">
                        {tracks.map(track => (
                            <TrackRow
                            key={track.id}
                            track={track}
                            steps={currentPattern.steps[track.id]}
                            currentStep={playMode === 'PAT' ? currentStep : -1}
                            isSelected={selectedTrackId === track.id}
                            onSelect={setSelectedTrackId}
                            onToggleStep={handleStepToggle}
                            onMute={(id) => {
                                const t = tracks.find(x => x.id === id);
                                if (t) handleTrackUpdate({...t, muted: !t.muted});
                            }}
                            onSolo={(id) => {
                                const t = tracks.find(x => x.id === id);
                                if (t) handleTrackUpdate({...t, solo: !t.solo});
                            }}
                            />
                        ))}
                    </div>
                    <div className="h-12"></div>
                    </div>
                </>
            )}

            {viewMode === 'TIMELINE' && (
                <Timeline 
                    blocks={timeline}
                    patterns={patterns}
                    currentPatternId={currentPatternId}
                    currentStep={playMode === 'SONG' ? currentStep : 0}
                    onAddBlock={handleAddBlockToTimeline}
                    onRemoveBlock={handleRemoveBlockFromTimeline}
                    onSeek={handleSeek}
                />
            )}

            {viewMode === 'MIXER' && (
                <Mixer 
                    tracks={tracks}
                    masterVolume={masterVolume}
                    onUpdateTrack={handleTrackUpdate}
                    onMasterVolumeChange={setMasterVolume}
                    onSelectTrack={setSelectedTrackId}
                    selectedTrackId={selectedTrackId}
                    isPlaying={isPlaying}
                />
            )}
          </div>

          {viewMode !== 'MIXER' && (
            <div className="h-[40vh] min-h-[250px] z-20 relative bg-daw-bg border-t border-daw-surface/10 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] transition-colors duration-300">
                {selectedTrack ? (
                    <SynthEditor 
                        track={selectedTrack} 
                        onUpdateTrack={handleTrackUpdate} 
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-daw-muted bg-daw-bg flex-col gap-4">
                        <Settings size={48} className="opacity-10 drop-shadow-lg" />
                        <span className="uppercase tracking-widest text-sm font-bold opacity-30">Select a track to edit</span>
                    </div>
                )}
            </div>
          )}

        </div>

        <Assistant 
            isOpen={isAiOpen} 
            onClose={() => setIsAiOpen(false)} 
            projectState={projectState} 
        />
        
        <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
        <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)}
            onClearPatterns={handleClearPatterns}
            masterVolume={masterVolume}
            onMasterVolumeChange={setMasterVolume}
            theme={theme}
            onThemeChange={setTheme}
        />
      </div>
    </div>
  );
};

export default App;
