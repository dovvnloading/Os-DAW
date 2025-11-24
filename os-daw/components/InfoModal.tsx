import React from 'react';
import { X, Github, Globe, Book, User, Cpu } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-daw-bg w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl border border-daw-surface overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="h-24 flex items-center justify-between px-8 bg-daw-bg shadow-neu-out z-10 shrink-0 relative">
          <div className="flex items-center gap-6">
             <div className="w-12 h-12 rounded-full bg-daw-bg shadow-neu-out flex items-center justify-center">
                <Cpu className="text-white" size={24} />
             </div>
             <div>
                <h2 className="text-3xl font-bold text-white tracking-tighter uppercase drop-shadow-md">Os-Daw</h2>
                <span className="text-[10px] text-daw-muted font-mono tracking-[0.2em] uppercase block mt-1">Professional Workstation</span>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-daw-bg shadow-neu-out flex items-center justify-center text-daw-muted hover:text-white hover:shadow-neu-pressed transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-daw-bg">
            
            {/* Credits Section */}
            <section className="bg-daw-bg rounded-2xl p-8 shadow-neu-pressed">
                <div className="flex items-center justify-between flex-wrap gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <User size={16} className="text-white" />
                             <h3 className="text-xl font-bold text-white">Matthew Robert Wesney</h3>
                        </div>
                        <p className="text-xs text-daw-muted font-mono uppercase tracking-wider mb-6 ml-1">(R) 2025</p>
                        
                        <div className="flex flex-wrap gap-4">
                            <a href="https://github.com/dovvnloading/Os-DAW" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-3 rounded-full bg-daw-bg shadow-neu-out hover:shadow-neu-btn active:shadow-neu-pressed text-xs font-bold text-daw-text hover:text-white transition-all">
                                <Github size={16} /> GitHub
                            </a>
                            <a href="https://dovvnloading.github.io/Os-DAW" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-3 rounded-full bg-daw-bg shadow-neu-out hover:shadow-neu-btn active:shadow-neu-pressed text-xs font-bold text-daw-text hover:text-white transition-all">
                                <Globe size={16} /> Website
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Documentation */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <Book size={18} className="text-white"/>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Documentation</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-daw-bg shadow-neu-out hover:shadow-neu-btn transition-shadow duration-300">
                        <h4 className="text-white font-bold mb-3 border-b border-daw-surface pb-2">Getting Started</h4>
                        <p className="text-xs text-daw-text leading-relaxed opacity-80">
                            Click squares in the sequencer grid to activate notes. 
                            Use the playback controls in the top bar to Start/Stop.
                            Drag the BPM display up or down to change tempo.
                        </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-daw-bg shadow-neu-out hover:shadow-neu-btn transition-shadow duration-300">
                        <h4 className="text-white font-bold mb-3 border-b border-daw-surface pb-2">Sound Design</h4>
                        <p className="text-xs text-daw-text leading-relaxed opacity-80">
                            Select a track to open the Instrument Editor. 
                            For Synths, adjust Oscillators and ADSR envelopes.
                            For Samplers, drag & drop audio files or choose from the library.
                        </p>
                    </div>
                     <div className="p-6 rounded-2xl bg-daw-bg shadow-neu-out hover:shadow-neu-btn transition-shadow duration-300">
                        <h4 className="text-white font-bold mb-3 border-b border-daw-surface pb-2">AI Assistant</h4>
                        <p className="text-xs text-daw-text leading-relaxed opacity-80">
                           Click "AI Assist" to open the chat sidebar. 
                           The AI knows your current project state and can help debug sound issues or suggest creative ideas.
                        </p>
                    </div>
                     <div className="p-6 rounded-2xl bg-daw-bg shadow-neu-out hover:shadow-neu-btn transition-shadow duration-300">
                        <h4 className="text-white font-bold mb-3 border-b border-daw-surface pb-2">Shortcuts</h4>
                        <ul className="text-xs text-daw-text space-y-2 font-mono opacity-80">
                            <li className="flex justify-between"><span>Play/Pause</span> <span className="text-white">Space</span></li>
                            <li className="flex justify-between"><span>Toggle Step</span> <span className="text-white">Click</span></li>
                            <li className="flex justify-between"><span>Adjust Knob</span> <span className="text-white">Drag</span></li>
                        </ul>
                    </div>
                </div>
            </section>

        </div>
      </div>
    </div>
  );
};