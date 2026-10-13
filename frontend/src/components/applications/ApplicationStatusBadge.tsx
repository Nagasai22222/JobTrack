import React from 'react';
import type { ApplicationStatus } from '../../types';

interface BadgeProps {
  status: ApplicationStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<ApplicationStatus, { label: string; styles: string }> = {
  APPLIED: {
    label: 'Applied',
    styles: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  },
  SCREENING: {
    label: 'Screening',
    styles: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
  INTERVIEW: {
    label: 'Interview',
    styles: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  },
  OFFER: {
    label: 'Offer',
    styles: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  REJECTED: {
    label: 'Rejected',
    styles: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    styles: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  },
};

export const ApplicationStatusBadge: React.FC<BadgeProps> = ({ status, size = 'sm' }) => {
  const config = statusConfig[status] || {
    label: status,
    styles: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  };

  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${config.styles} ${sizeClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {config.label}
    </span>
  );
};
