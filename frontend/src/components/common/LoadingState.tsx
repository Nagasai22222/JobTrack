import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  inline?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  inline = false,
}) => {
  if (inline) {
    return (
      <div className="flex items-center space-x-2 text-indigo-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-3 text-indigo-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-300">{message}</p>
    </div>
  );
};
