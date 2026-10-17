import React from 'react';
import { initialsOf } from '../lib/auth';

export const Avatar: React.FC<{ name: string; size?: 'sm' | 'lg' }> = ({ name, size = 'sm' }) => (
  <span
    className={`${size === 'lg' ? 'w-12 h-12 text-base' : 'w-8 h-8 text-xs'} rounded-full bg-brand-100 text-brand-800 font-semibold flex items-center justify-center shrink-0`}
    aria-hidden="true"
  >
    {initialsOf(name)}
  </span>
);
