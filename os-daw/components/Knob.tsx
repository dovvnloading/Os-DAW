import React, { useState, useEffect, useRef } from 'react';

interface KnobProps {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  unit?: string;
  size?: number;
  showValue?: boolean;
}

export const Knob: React.FC<KnobProps> = ({ 
  label, value, min, max, step = 1, onChange, unit = '', size = 56, showValue = true 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number>(0);
  const startValueRef = useRef<number>(0);

  const mapValueToAngle = (val: number) => {
    const percent = (val - min) / (max - min);
    return percent * 270 - 135; // -135deg to +135deg
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = value;
    document.body.style.cursor = 'ns-resize';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = startYRef.current - e.clientY;
      const range = max - min;
      // Sensitivity: 200px movement = full range
      const change = (deltaY / 200) * range;
      let newValue = startValueRef.current + change;
      
      // Clamp
      newValue = Math.min(Math.max(newValue, min), max);
      
      // Step
      if (step) {
        newValue = Math.round(newValue / step) * step;
      }

      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, min, max, step, onChange]);

  const angle = mapValueToAngle(value);

  return (
    <div className={`flex flex-col items-center select-none group ${label || showValue ? 'gap-2' : ''}`}>
      <div 
        className="relative flex items-center justify-center knob-drag-area cursor-ns-resize rounded-full shadow-neu-out hover:shadow-neu-btn active:shadow-neu-pressed transition-all bg-daw-bg border border-daw-surface/5"
        style={{ width: size, height: size }}
        onMouseDown={handleMouseDown}
      >
        {/* Indicator Dot */}
        <div 
          className="absolute w-full h-full rounded-full pointer-events-none"
          style={{ transform: `rotate(${angle}deg)` }}
        >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-daw-accent rounded-full shadow-[0_0_8px_white]"></div>
        </div>

        {/* Center Indent */}
        <div className="w-1/3 h-1/3 rounded-full bg-daw-bg shadow-neu-pressed opacity-60"></div>
      </div>
      
      {(label || showValue) && (
        <div className="text-center">
          {label && <div className="text-[10px] uppercase tracking-wider font-bold text-daw-muted">{label}</div>}
          {showValue && <div className="text-xs font-mono text-daw-text opacity-80">{value.toFixed(step < 1 ? 2 : 0)}{unit}</div>}
        </div>
      )}
    </div>
  );
};