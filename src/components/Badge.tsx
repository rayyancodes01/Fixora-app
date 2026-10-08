import React from 'react';
import { TestStatus, Priority, Severity } from '../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'pass' | 'fail' | 'skipped' | 'priority' | 'severity' | 'neutral' | 'info';
  status?: TestStatus;
  priority?: Priority;
  severity?: Severity;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  status,
  priority,
  severity,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  if (status) {
    if (status === 'PASS') {
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses} ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          PASS
        </span>
      );
    }
    if (status === 'FAIL') {
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 ${sizeClasses} ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
          FAIL
        </span>
      );
    }
    if (status === 'WARNING') {
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 ${sizeClasses} ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          WARNING
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 font-medium rounded-md bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 ${sizeClasses} ${className}`}>
        {status}
      </span>
    );
  }

  if (priority) {
    const map: Record<string, string> = {
      P0: 'bg-red-500/15 text-red-300 border-red-500/30',
      P1: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      P2: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      P3: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      High: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      Low: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    };
    const style = map[priority] || map.Medium;
    return (
      <span className={`inline-flex items-center font-medium rounded-md border ${style} ${sizeClasses} ${className}`}>
        {priority}
      </span>
    );
  }

  if (severity) {
    const map = {
      Critical: 'bg-red-500/15 text-red-300 border-red-500/30',
      High: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      Low: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    };
    return (
      <span className={`inline-flex items-center font-semibold rounded-md border ${map[severity]} ${sizeClasses} ${className}`}>
        {severity}
      </span>
    );
  }

  if (variant === 'info') {
    return (
      <span className={`inline-flex items-center font-medium rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 ${sizeClasses} ${className}`}>
        {children}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 ${sizeClasses} ${className}`}>
      {children}
    </span>
  );
};
