import React, { useEffect, useId, useState } from 'react';
import { OptimizationSettings, OutputFormat, CompressionMode } from '../types';
import { Info } from 'lucide-react';

interface SettingsPanelProps {
  settings: OptimizationSettings;
  onChange: (settings: OptimizationSettings) => void;
  className?: string;
}

// Values unchanged from the original panel (WEB / BAL / PRO).
export const PRESETS = [
  { id: 'efficient', shortName: 'WEB', label: 'Web', values: { targetSizeKB: 50, minQuality: 60, minDimension: 600 } },
  { id: 'balanced', shortName: 'BAL', label: 'Balanced', values: { targetSizeKB: 100, minQuality: 75, minDimension: 750 } },
  { id: 'high', shortName: 'PRO', label: 'High quality', values: { targetSizeKB: 500, minQuality: 90, minDimension: 1200 } }
];

export const getActivePreset = (settings: OptimizationSettings) =>
  PRESETS.find(p => p.values.targetSizeKB === settings.targetSizeKB && p.values.minQuality === settings.minQuality && p.values.minDimension === settings.minDimension);

/** Number input that commits on blur / Enter (same parsing rules as the original click-to-edit value). */
const NumberInput: React.FC<{
  value: number;
  unit: string;
  onCommit: (val: number) => void;
  label: string;
  id?: string;
  className?: string;
}> = ({ value, unit, onCommit, label, id, className = '' }) => {
  const [temp, setTemp] = useState(value.toString());
  useEffect(() => setTemp(value.toString()), [value]);

  const commit = () => {
    const num = parseFloat(temp);
    if (!isNaN(num)) onCommit(num);
    else setTemp(value.toString());
  };

  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        aria-label={label}
        value={temp}
        onChange={(e) => setTemp(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setTemp(value.toString());
        }}
        className="w-full h-9 rounded-lg border border-line-strong bg-white pl-2.5 pr-9 text-right text-sm font-semibold tabular-nums text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted pointer-events-none" aria-hidden="true">{unit}</span>
    </div>
  );
};

const SliderField: React.FC<{
  label: string; help: string; value: number; min: number; max: number; step: number; unit: string; onChange: (val: number) => void;
}> = ({ label, help, value, min, max, step, unit, onChange }) => {
  const id = useId();
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">{label}</label>
        <NumberInput value={value} unit={unit} onCommit={onChange} label={`${label} (${unit})`} className="w-[92px]" />
      </div>
      <p className="text-xs text-muted mt-0.5 mb-2.5">{help}</p>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${value} ${unit}`}
        className="op-range w-full"
        style={{ ['--pct' as any]: `${pct}%` }}
      />
      <div className="flex justify-between text-[11px] text-subtle mt-1 tabular-nums" aria-hidden="true">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
};

function Segmented<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-1 p-1 bg-canvas border border-line rounded-lg" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(o => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={`h-8 rounded-md text-[13px] font-semibold transition-colors ${selected ? 'bg-white text-brand-600 shadow-card ring-1 ring-line' : 'text-muted hover:text-ink'}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const Section: React.FC<{ title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }> = ({ title, description, action, children }) => (
  <section className="py-5 first:pt-0 border-b border-line last:border-b-0">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <h3 className="text-[13px] font-semibold text-ink font-sans">{title}</h3>
        {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onChange, className = '' }) => {
  const handleChange = (key: keyof OptimizationSettings, value: any) => onChange({ ...settings, [key]: value });
  const activePreset = getActivePreset(settings)?.id;
  const minWidthId = useId();
  const minHeightId = useId();

  return (
    <div className={className}>
      <Section title="Compression mode" description={settings.mode === 'smart' ? 'Iteratively adjusts quality and size to reach your target.' : 'Encodes once at 90% quality, keeping original dimensions.'}>
        <Segmented<CompressionMode>
          label="Compression mode"
          value={settings.mode}
          onChange={(v) => handleChange('mode', v)}
          options={[{ value: 'smart', label: 'Smart' }, { value: 'basic', label: 'Basic' }]}
        />
      </Section>

      <Section title="Output format">
        <Segmented<OutputFormat>
          label="Output format"
          value={settings.outputFormat}
          onChange={(v) => handleChange('outputFormat', v)}
          options={[{ value: 'webp', label: 'WebP' }, { value: 'jpeg', label: 'JPEG' }, { value: 'png', label: 'PNG' }]}
        />
        {settings.outputFormat === 'png' && (
          <p className="text-xs text-muted mt-2 flex gap-1.5"><Info size={13} className="mt-0.5 shrink-0" aria-hidden="true" />PNG is lossless, so only dimensions are reduced to approach the target size.</p>
        )}
      </Section>

      {settings.mode === 'basic' && (
        <div className="mt-5 rounded-lg bg-brand-50 border border-brand-100 px-3 py-2.5 text-xs text-brand-800 flex gap-2">
          <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>The settings below apply to Smart mode. They are kept for when you switch back.</span>
        </div>
      )}

      <Section title="Optimization profile" description="Presets set target size, quality floor and minimum edge.">
        <div role="radiogroup" aria-label="Optimization profile" className="grid grid-cols-3 gap-2">
          {PRESETS.map((p) => {
            const selected = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange({ ...settings, ...p.values })}
                className={`rounded-lg border px-2 py-2.5 text-left transition-colors ${selected ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-line-strong bg-white hover:border-subtle'}`}
              >
                <span className={`block text-[13px] font-semibold ${selected ? 'text-brand-700' : 'text-ink'}`}>{p.label}</span>
                <span className="block text-[11px] text-muted mt-0.5 tabular-nums">{p.values.targetSizeKB} KB · {p.values.minQuality}%</span>
              </button>
            );
          })}
        </div>
        {!activePreset && <p className="text-xs text-muted mt-2">Custom values</p>}

        <div className="space-y-5 mt-5">
          <SliderField label="Target size" help="Aim for files at or below this size." value={settings.targetSizeKB} min={10} max={1000} step={10} unit="KB" onChange={(v) => handleChange('targetSizeKB', v)} />
          <SliderField label="Quality floor" help="Quality is never reduced below this level." value={settings.minQuality} min={10} max={100} step={5} unit="%" onChange={(v) => handleChange('minQuality', v)} />
        </div>
      </Section>

      <Section
        title="Dimensions"
        description={settings.useSmartDimension ? 'The shorter side is never reduced below the minimum edge.' : 'Set a minimum width and height in pixels.'}
      >
        <Segmented<'smart' | 'manual'>
          label="Dimension bounds"
          value={settings.useSmartDimension ? 'smart' : 'manual'}
          onChange={(v) => handleChange('useSmartDimension', v === 'smart')}
          options={[{ value: 'smart', label: 'Min edge' }, { value: 'manual', label: 'Width × height' }]}
        />
        <div className="mt-4">
          {settings.useSmartDimension ? (
            <SliderField label="Minimum edge" help="Smallest allowed length of the shorter side." value={settings.minDimension} min={100} max={3000} step={50} unit="px" onChange={(v) => handleChange('minDimension', v)} />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={minWidthId} className="block text-sm font-medium text-ink mb-1.5">Min width</label>
                  <NumberInput id={minWidthId} value={settings.minWidth || 0} unit="px" onCommit={(v) => handleChange('minWidth', v)} label="Minimum width (px)" />
                </div>
                <div>
                  <label htmlFor={minHeightId} className="block text-sm font-medium text-ink mb-1.5">Min height</label>
                  <NumberInput id={minHeightId} value={settings.minHeight || 0} unit="px" onCommit={(v) => handleChange('minHeight', v)} label="Minimum height (px)" />
                </div>
              </div>
              <p className="text-xs text-muted mt-2">With both at 0, images may be reduced to 50 px wide.</p>
            </>
          )}
        </div>
      </Section>

      <style>{`
        .op-range { -webkit-appearance: none; appearance: none; height: 20px; background: transparent; cursor: pointer; }
        .op-range:focus { outline: none; }
        .op-range::-webkit-slider-runnable-track { height: 6px; border-radius: 999px; background: linear-gradient(to right, #2965F1 var(--pct), #E3E8F2 var(--pct)); }
        .op-range::-moz-range-track { height: 6px; border-radius: 999px; background: #E3E8F2; }
        .op-range::-moz-range-progress { height: 6px; border-radius: 999px; background: #2965F1; }
        .op-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; margin-top: -6px; border-radius: 999px; background: #fff; border: 2px solid #2965F1; box-shadow: 0 1px 3px rgba(17,24,39,.2); }
        .op-range::-moz-range-thumb { width: 14px; height: 14px; border-radius: 999px; background: #fff; border: 2px solid #2965F1; box-shadow: 0 1px 3px rgba(17,24,39,.2); }
        .op-range:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 4px rgba(41,101,241,.3); }
        .op-range:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 4px rgba(41,101,241,.3); }
      `}</style>
    </div>
  );
};

/** One-line summary of the current settings, used by the collapsed mobile panel. */
export const summarizeSettings = (s: OptimizationSettings) => {
  const fmt = s.outputFormat.toUpperCase();
  if (s.mode === 'basic') return `Basic · ${fmt}`;
  const bounds = s.useSmartDimension ? `${s.minDimension}px edge` : `${s.minWidth || 0}×${s.minHeight || 0}px`;
  return `Smart · ${fmt} · ${s.targetSizeKB} KB · ${s.minQuality}% · ${bounds}`;
};
