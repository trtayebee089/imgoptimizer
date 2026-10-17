import React from 'react';
import { passwordStrength } from '../lib/validation';

const COLORS = ['bg-line', 'bg-danger-500', 'bg-warning-500', 'bg-brand-500', 'bg-brand-700'];
const TEXT = ['text-muted', 'text-danger-600', 'text-warning-700', 'text-brand-800', 'text-brand-800'];

export const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
  const { score, label } = passwordStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map(i => <span key={i} className={`h-1 flex-1 rounded-full ${i <= score ? COLORS[score] : 'bg-line'}`} />)}
      </div>
      <p className={`mt-1 text-xs font-medium ${TEXT[score]}`}>Password strength: {label}</p>
    </div>
  );
};
