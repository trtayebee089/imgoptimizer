import React, { useEffect, useState, useRef } from 'react';
import { OptimizationSettings, OutputFormat } from '../types';
import { ChevronDown, Cpu, Settings2, Target, Maximize2, HardDrive, Zap, X } from 'lucide-react';

interface SettingsPanelProps {
  settings: OptimizationSettings;
  theme: 'dark' | 'light';
  onChange: (settings: OptimizationSettings) => void;
  onClose?: () => void;
  className?: string;
}

const PRESETS = [
  { id: 'efficient', shortName: 'WEB', values: { targetSizeKB: 50, minQuality: 60, minDimension: 600 } },
  { id: 'balanced', shortName: 'BAL', values: { targetSizeKB: 100, minQuality: 75, minDimension: 750 } },
  { id: 'high', shortName: 'PRO', values: { targetSizeKB: 500, minQuality: 90, minDimension: 1200 } }
];

const EditableValue: React.FC<{
  value: number;
  unit?: string;
  onSave: (val: number) => void;
}> = ({ value, unit = '', onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [temp, setTemp] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const handleBlur = () => {
    const num = parseFloat(temp);
    if (!isNaN(num)) onSave(num);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBlur();
    if (e.key === 'Escape') {
      setTemp(value.toString());
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input 
        ref={inputRef}
        type="text"
        value={temp}
        onChange={(e) => setTemp(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-16 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[11px] font-black text-right px-2 py-1 rounded focus:outline-none tracking-tight"
      />
    );
  }

  return (
    <span 
      onClick={() => setIsEditing(true)}
      title="Click to edit"
      className="text-blue-500 dark:text-blue-400 cursor-pointer hover:bg-blue-500/10 px-2 py-0.5 rounded transition-colors font-black tracking-tight"
    >
      {value}{unit}
    </span>
  );
};

const CompactSlider: React.FC<{
  label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (val: number) => void;
}> = ({ label, value, min, max, step, unit = '', onChange }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-tight">
        <label>{label}</label>
        <EditableValue value={value} unit={unit} onSave={onChange} />
      </div>
      <div className="relative h-6 flex items-center group cursor-pointer">
        <div className="absolute w-full h-1.5 bg-slate-200 dark:bg-white/[0.05] rounded-full overflow-hidden">
             <div className="h-full bg-blue-500/10 w-full"></div>
        </div>
        <div className="absolute h-1.5 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)]" style={{ width: `${percentage}%` }}></div>
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step} 
          value={value} 
          onChange={(e) => onChange(Number(e.target.value))} 
          className="slider-input absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
        />
        <div 
          className="absolute w-5 h-5 bg-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.2)] border-2 border-blue-500 pointer-events-none transition-transform group-hover:scale-110 active:scale-95"
          style={{ left: `calc(${percentage}% - 10px)` }}
        ></div>
      </div>
    </div>
  );
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, theme, onChange, onClose, className = '' }) => {
  const [isFormatMenuOpen, setIsFormatMenuOpen] = useState(false);
  
  const handleChange = (key: keyof OptimizationSettings, value: any) => onChange({ ...settings, [key]: value });
  const activePreset = PRESETS.find(p => p.values.targetSizeKB === settings.targetSizeKB && p.values.minQuality === settings.minQuality && p.values.minDimension === settings.minDimension)?.id;

  return (
    <div className={`flex flex-col h-full bg-[#fbfbfb] dark:bg-[#09090b] ${className} border-l dark:border-white/10 border-slate-200`}>
      
      {/* Header */}
      <div className="px-6 md:px-8 py-6 md:py-10 border-b dark:border-white/10 border-slate-200/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-[14px] bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/10">
                  <Settings2 size={18} />
              </div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Control Center</h3>
          </div>
          {/* Mobile Close Button */}
          <button 
            onClick={onClose}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500"
          >
            <X size={20} />
          </button>
      </div>

      <div className="flex-1 flex flex-col p-6 md:p-8 gap-6 md:gap-8 overflow-y-auto custom-scrollbar">
        
        {/* Engine Module */}
        <div className="space-y-4">
            <span className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest flex items-center gap-3">
                <Cpu size={14} /> Distillation Engine
            </span>
            <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleChange('mode', settings.mode === 'smart' ? 'basic' : 'smart')} 
                  className={`flex flex-col p-4 md:p-5 rounded-[20px] md:rounded-[24px] border transition-all text-left relative overflow-hidden group ${settings.mode === 'smart' ? 'bg-blue-600 text-white border-blue-500 shadow-xl' : 'bg-white dark:bg-[#18181b] border-slate-200 dark:border-white/10 text-slate-400'}`}
                >
                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-tight opacity-60">Logic</span>
                    <span className={`text-xs font-black uppercase mt-1 md:mt-2 tracking-tight ${settings.mode === 'smart' ? 'text-white' : 'dark:text-white text-slate-900'}`}>{settings.mode}</span>
                    {settings.mode === 'smart' && <Zap size={32} className="absolute -bottom-1 -right-1 opacity-10 rotate-12" />}
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setIsFormatMenuOpen(!isFormatMenuOpen)}
                    className="flex flex-col w-full p-4 md:p-5 rounded-[20px] md:rounded-[24px] bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 transition-all text-left group hover:border-blue-500/20"
                  >
                      <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-tight opacity-60">Format</span>
                      <div className="flex items-center justify-between w-full mt-1 md:mt-2">
                        <span className="text-xs font-black uppercase tracking-tight dark:text-white text-slate-900">{settings.outputFormat}</span>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isFormatMenuOpen ? 'rotate-180' : ''}`} />
                      </div>
                  </button>

                  {isFormatMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-[100]" onClick={() => setIsFormatMenuOpen(false)} />
                      <div className="absolute top-full left-0 right-0 mt-2 p-1.5 dark:bg-[#1a1a1a] bg-white border dark:border-white/10 border-slate-200 rounded-[20px] shadow-2xl z-[110] animate-in slide-in-from-top-2 duration-200 backdrop-blur-3xl">
                        {['webp', 'jpeg', 'png'].map((fmt) => (
                          <button 
                            key={fmt}
                            onClick={() => { handleChange('outputFormat', fmt); setIsFormatMenuOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${settings.outputFormat === fmt ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                          >
                            {fmt}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
            </div>
        </div>

        {/* Target Module */}
        <div className="space-y-4">
            <span className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest flex items-center gap-3">
                <Target size={14} /> Optimization Profile
            </span>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
                {PRESETS.map((p) => (
                    <button key={p.id} onClick={() => onChange({ ...settings, ...p.values })} className={`py-2 md:py-3 rounded-xl md:rounded-2xl border text-[9px] md:text-[10px] font-black uppercase transition-all tracking-tight ${activePreset === p.id ? 'bg-blue-600 text-white border-blue-500 shadow-lg scale-105' : 'bg-white dark:bg-[#18181b] border-slate-200 dark:border-white/10 text-slate-500 dark:text-zinc-500 hover:border-blue-500/30'}`}>
                        {p.shortName}
                    </button>
                ))}
            </div>
            <div className="dark:bg-[#18181b] bg-white border dark:border-white/10 border-slate-200/60 p-5 md:p-6 rounded-[28px] md:rounded-[32px] space-y-5 md:space-y-6 shadow-sm">
                <CompactSlider label="Target Size" value={settings.targetSizeKB} min={10} max={1000} step={10} unit="KB" onChange={(v) => handleChange('targetSizeKB', v)} />
                <CompactSlider label="Quality Floor" value={settings.minQuality} min={10} max={100} step={5} unit="%" onChange={(v) => handleChange('minQuality', v)} />
            </div>
        </div>

        {/* Geometry Module */}
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest flex items-center gap-3">
                    <Maximize2 size={14} /> Bounds
                </span>
                <button 
                  onClick={() => handleChange('useSmartDimension', !settings.useSmartDimension)} 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-tight transition-all ${settings.useSmartDimension ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10'}`}
                >
                    {settings.useSmartDimension ? 'Smart' : 'Manual'}
                </button>
            </div>
            
            <div className="dark:bg-[#18181b] bg-white border dark:border-white/10 border-slate-200/60 p-5 md:p-6 rounded-[28px] md:rounded-[32px] shadow-sm">
                {settings.useSmartDimension ? (
                    <CompactSlider label="Min Edge" value={settings.minDimension} min={100} max={3000} step={50} unit="px" onChange={(v) => handleChange('minDimension', v)} />
                ) : (
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-1.5 md:space-y-2">
                            <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-tight pl-1 opacity-60">Width</span>
                            <div className="bg-slate-50 dark:bg-white/[0.03] border dark:border-white/10 border-slate-200 rounded-lg md:rounded-xl px-3 md:px-5 py-2 md:py-3 flex items-center justify-end">
                                <EditableValue value={settings.minWidth || 0} unit="px" onSave={(v) => handleChange('minWidth', v)} />
                            </div>
                        </div>
                        <div className="space-y-1.5 md:space-y-2">
                            <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-tight pl-1 opacity-60">Height</span>
                            <div className="bg-slate-50 dark:bg-white/[0.03] border dark:border-white/10 border-slate-200 rounded-lg md:rounded-xl px-3 md:px-5 py-2 md:py-3 flex items-center justify-end">
                                <EditableValue value={settings.minHeight || 0} unit="px" onSave={(v) => handleChange('minHeight', v)} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Hardware Footer */}
        <div className="mt-auto pt-6 md:pt-8 border-t dark:border-white/10 border-slate-200/60 flex items-center justify-between opacity-50">
            <div className="flex items-center gap-2 md:gap-3">
                <HardDrive size={12} className="text-blue-500 md:w-3.5 md:h-3.5" />
                <span className="text-[8px] md:text-[9px] font-black uppercase dark:text-white text-slate-900 tracking-tight">HW Accelerated</span>
            </div>
            <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-tight">v3.2.0 Stable</span>
        </div>
      </div>
      <style>{`
        .slider-input::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 28px;
            height: 28px;
            cursor: pointer;
        }
      `}</style>
    </div>
  );
};
