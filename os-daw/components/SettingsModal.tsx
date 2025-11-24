
import React, { useState } from 'react';
import { X, Settings, Volume2, Trash2, AlertTriangle, Check, Moon, Sun } from 'lucide-react';
import { Knob } from './Knob';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearPatterns: () => void;
  masterVolume: number;
  onMasterVolumeChange: (val: number) => void;
  theme: 'dark' | 'light';
  onThemeChange: (t: 'dark' | 'light') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, onClearPatterns, masterVolume, onMasterVolumeChange, theme, onThemeChange
}) => {
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const handleClearClick = () => {
    if (confirmClear) {
      onClearPatterns();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-daw-bg w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl border border-daw-surface overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="h-24 flex items-center justify-between px-8 bg-daw-bg shadow-neu-out z-10 shrink-0 relative">
          <div className="flex items-center gap-6">
             <div className="w-12 h-12 rounded-full bg-daw-bg shadow-neu-out flex items-center justify-center">
                <Settings className="text-daw-text animate-spin-slow" size={24} />
             </div>
             <div>
                <h2 className="text-3xl font-bold text-daw-text tracking-tighter uppercase drop-shadow-md">Settings</h2>
                <span className="text-[10px] text-daw-muted font-mono tracking-[0.2em] uppercase block mt-1">Global Configuration</span>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-daw-bg shadow-neu-out flex items-center justify-center text-daw-muted hover:text-daw-text hover:shadow-neu-pressed transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-daw-bg">
            
            {/* Appearance Section */}
            <section className="bg-daw-bg rounded-2xl p-8 shadow-neu-pressed">
                 <div className="flex items-center gap-3 mb-6 pb-4 border-b border-daw-surface/10">
                     <Sun size={18} className="text-daw-text"/>
                     <h3 className="text-sm font-bold text-daw-text uppercase tracking-wider">Appearance</h3>
                 </div>
                 
                 <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-daw-text font-bold text-sm mb-1">Theme Preference</h4>
                        <p className="text-[10px] text-daw-muted">Switch between dark noir and bright laboratory mode.</p>
                    </div>
                    
                    <div className="flex bg-daw-bg p-1 rounded-full shadow-neu-in border border-daw-surface/10 relative">
                        {/* Toggle Slider Background */}
                        <div className={`absolute top-1 bottom-1 w-[50%] bg-daw-surface shadow-neu-out rounded-full transition-all duration-300 ${theme === 'light' ? 'left-[48%]' : 'left-[2%]'}`}></div>
                        
                        <button 
                            onClick={() => onThemeChange('dark')}
                            className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${theme === 'dark' ? 'text-daw-text' : 'text-daw-muted'}`}
                        >
                            <Moon size={14} /> Dark
                        </button>
                        <button 
                             onClick={() => onThemeChange('light')}
                             className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${theme === 'light' ? 'text-daw-text' : 'text-daw-muted'}`}
                        >
                            <Sun size={14} /> Light
                        </button>
                    </div>
                 </div>
            </section>

            {/* Audio Section */}
            <section className="bg-daw-bg rounded-2xl p-8 shadow-neu-pressed">
                 <div className="flex items-center gap-3 mb-6 pb-4 border-b border-daw-surface/10">
                     <Volume2 size={18} className="text-daw-text"/>
                     <h3 className="text-sm font-bold text-daw-text uppercase tracking-wider">Audio Output</h3>
                 </div>
                 
                 <div className="flex items-center justify-center gap-12 py-4">
                    <Knob 
                        label="Master Vol" 
                        value={masterVolume} 
                        min={0} 
                        max={1} 
                        step={0.01} 
                        onChange={onMasterVolumeChange} 
                        size={80} 
                    />
                    <div className="w-px h-24 bg-daw-surface/10"></div>
                    <div className="text-center max-w-[200px]">
                        <p className="text-xs text-daw-muted mb-2">Caution</p>
                        <p className="text-[10px] text-daw-muted leading-relaxed opacity-70">
                            Adjusting master volume affects all tracks. Use with care to avoid clipping or sudden loud bursts.
                        </p>
                    </div>
                 </div>
            </section>

            {/* Project Management */}
            <section className="bg-daw-bg rounded-2xl p-8 shadow-neu-pressed">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-daw-surface/10">
                     <AlertTriangle size={18} className="text-daw-text"/>
                     <h3 className="text-sm font-bold text-daw-text uppercase tracking-wider">Project Management</h3>
                 </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-daw-text font-bold text-sm mb-1">Clear All Patterns</h4>
                        <p className="text-[10px] text-daw-muted">Reset the entire sequencer grid. This cannot be undone.</p>
                    </div>
                    
                    <button 
                        onClick={handleClearClick}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold transition-all shadow-neu-out hover:shadow-neu-btn active:shadow-neu-pressed ${
                            confirmClear 
                            ? 'text-red-500 bg-daw-bg border border-red-900/30' 
                            : 'text-daw-muted hover:text-daw-text bg-daw-bg'
                        }`}
                    >
                        {confirmClear ? (
                            <>
                                <Check size={14} /> Confirm Reset?
                            </>
                        ) : (
                            <>
                                <Trash2 size={14} /> Clear Patterns
                            </>
                        )}
                    </button>
                </div>
            </section>

        </div>
      </div>
    </div>
  );
};
