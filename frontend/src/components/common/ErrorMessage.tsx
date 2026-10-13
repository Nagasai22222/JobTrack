import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onDismiss }) => {
  return (
    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start justify-between space-x-3 text-rose-400 text-sm">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
        <div>
          <strong className="font-semibold block mb-0.5">Error</strong>
          <span>{message}</span>
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-rose-400 hover:text-rose-200 transition-colors p-1"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
