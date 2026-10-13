import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface SuccessMessageProps {
  message: string;
  onDismiss?: () => void;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ message, onDismiss }) => {
  return (
    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start justify-between space-x-3 text-emerald-400 text-sm">
      <div className="flex items-start space-x-3">
        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
        <div>
          <strong className="font-semibold block mb-0.5">Success</strong>
          <span>{message}</span>
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-emerald-400 hover:text-emerald-200 transition-colors p-1"
          aria-label="Dismiss message"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
