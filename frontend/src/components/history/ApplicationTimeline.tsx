import React, { useState, useEffect } from 'react';
import { applicationService } from '../../services/api';
import type { HistoryResponse } from '../../types';
import { LoadingState } from '../common/LoadingState';
import { ErrorMessage } from '../common/ErrorMessage';
import { EmptyState } from '../common/EmptyState';
import {
  History,
  PlusCircle,
  Edit3,
  RefreshCw,
  MessageSquare,
  FileText,
  Trash2,
  Clock,
  User,
} from 'lucide-react';

interface ApplicationTimelineProps {
  applicationId: number;
  refreshTrigger?: number;
}

const getActionConfig = (action: string) => {
  switch (action) {
    case 'APPLICATION_CREATED':
      return {
        icon: PlusCircle,
        color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
        label: 'Application Created',
      };
    case 'APPLICATION_UPDATED':
      return {
        icon: Edit3,
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
        label: 'Application Updated',
      };
    case 'APPLICATION_STATUS_CHANGED':
      return {
        icon: RefreshCw,
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        label: 'Status Changed',
      };
    case 'COMMENT_ADDED':
    case 'COMMENT_UPDATED':
      return {
        icon: MessageSquare,
        color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
        label: 'Comment Logged',
      };
    case 'COMMENT_DELETED':
      return {
        icon: Trash2,
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        label: 'Comment Removed',
      };
    case 'DOCUMENT_UPLOADED':
      return {
        icon: FileText,
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        label: 'Document Uploaded',
      };
    case 'DOCUMENT_DELETED':
      return {
        icon: Trash2,
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        label: 'Document Removed',
      };
    default:
      return {
        icon: Clock,
        color: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
        label: action,
      };
  }
};

export const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({
  applicationId,
  refreshTrigger,
}) => {
  const [history, setHistory] = useState<HistoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await applicationService.getApplicationHistory(applicationId);
      // Newest events first
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setHistory(sorted);
    } catch (err: any) {
      setError(err.message || 'Failed to load activity timeline');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [applicationId, refreshTrigger]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Activity History Timeline</h3>
            <p className="text-xs text-slate-400">Chronological audit trail of all lifecycle events</p>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-full border border-slate-700">
          {history.length} {history.length === 1 ? 'Event' : 'Events'}
        </span>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <LoadingState message="Fetching activity history..." />
      ) : history.length === 0 ? (
        <EmptyState
          title="No history events logged"
          description="Activity logs will appear automatically as you update status, add comments, or attach documents."
        />
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
          {history.map((item) => {
            const config = getActionConfig(item.action);
            const Icon = config.icon;

            return (
              <div key={item.id} className="relative group">
                {/* Timeline Icon Node */}
                <div
                  className={`absolute -left-6 top-0 p-1.5 rounded-full border ${config.color} transform -translate-x-1/2 bg-slate-900 shadow-md`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Event Card Content */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1 hover:border-slate-700/60 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center space-x-2">
                      <span>{config.label}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{item.description}</p>

                  <div className="flex items-center space-x-1.5 pt-1 text-[10px] text-slate-500 font-medium">
                    <User className="w-3 h-3 text-slate-600" />
                    <span>Performed by {item.username}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
