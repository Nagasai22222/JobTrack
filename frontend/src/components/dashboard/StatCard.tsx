import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  count: number;
  icon: LucideIcon;
  colorTheme: 'indigo' | 'amber' | 'purple' | 'emerald' | 'rose' | 'slate';
  onClick?: () => void;
}

const colorMap = {
  indigo: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    iconBg: 'bg-indigo-500/15 text-indigo-400',
    text: 'text-indigo-400',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    iconBg: 'bg-amber-500/15 text-amber-400',
    text: 'text-amber-400',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    iconBg: 'bg-purple-500/15 text-purple-400',
    text: 'text-purple-400',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/15 text-emerald-400',
    text: 'text-emerald-400',
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    iconBg: 'bg-rose-500/15 text-rose-400',
    text: 'text-rose-400',
  },
  slate: {
    bg: 'bg-slate-800/40',
    border: 'border-slate-800',
    iconBg: 'bg-slate-800 text-slate-400',
    text: 'text-slate-400',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  count,
  icon: Icon,
  colorTheme,
  onClick,
}) => {
  const theme = colorMap[colorTheme] || colorMap.slate;

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl border ${theme.bg} ${theme.border} transition-all duration-200 hover:scale-[1.02] ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`p-2.5 rounded-xl border border-current/20 ${theme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-3xl font-extrabold text-white tracking-tight">{count}</div>
    </div>
  );
};
