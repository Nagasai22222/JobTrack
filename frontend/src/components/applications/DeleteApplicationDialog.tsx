import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { JobApplication } from '../../types';

interface DeleteDialogProps {
  isOpen: boolean;
  application: JobApplication | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteApplicationDialog: React.FC<DeleteDialogProps> = ({
  isOpen,
  application,
  isDeleting,
  onConfirm,
  onClose,
}) => {
  if (!isOpen || !application) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Delete Job Application</h3>
            <p className="text-xs text-slate-400">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-sm text-slate-300">
          Are you sure you want to delete your application for{' '}
          <strong className="text-white">{application.jobRole}</strong> at{' '}
          <strong className="text-white">{application.companyName}</strong>?
        </p>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:bg-rose-600/50 transition-all flex items-center space-x-2 cursor-pointer shadow-lg shadow-rose-600/20"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Application</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
