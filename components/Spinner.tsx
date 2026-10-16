import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner: React.FC<{ label?: string }> = ({ label }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      {label && <p className="text-slate-600 font-medium animate-pulse">{label}</p>}
    </div>
  );
};