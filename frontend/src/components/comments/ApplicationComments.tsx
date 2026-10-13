import React, { useState, useEffect } from 'react';
import { applicationService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { CommentResponse } from '../../types';
import { LoadingState } from '../common/LoadingState';
import { ErrorMessage } from '../common/ErrorMessage';
import { SuccessMessage } from '../common/SuccessMessage';
import { EmptyState } from '../common/EmptyState';
import {
  MessageSquare,
  Send,
  Edit2,
  Trash2,
  X,
  Check,
  Loader2,
  User,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface ApplicationCommentsProps {
  applicationId: number;
  onCommentChange?: () => void;
}

export const ApplicationComments: React.FC<ApplicationCommentsProps> = ({
  applicationId,
  onCommentChange,
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New comment state
  const [newContent, setNewContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Deleting state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchComments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await applicationService.getComments(applicationId);
      // Sort newest first
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setComments(sorted);
    } catch (err: any) {
      setError(err.message || 'Failed to load application comments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [applicationId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = newContent.trim();
    if (!trimmed) {
      setError('Comment content cannot be empty.');
      return;
    }
    if (trimmed.length > 2000) {
      setError('Comment content must not exceed 2000 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await applicationService.createComment(applicationId, { content: trimmed });
      setNewContent('');
      setSuccessMsg('Comment added.');
      fetchComments();
      if (onCommentChange) onCommentChange();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (comment: CommentResponse) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (commentId: number) => {
    setError(null);
    const trimmed = editContent.trim();
    if (!trimmed) {
      setError('Comment content cannot be empty.');
      return;
    }
    if (trimmed.length > 2000) {
      setError('Comment content must not exceed 2000 characters.');
      return;
    }

    setIsUpdating(true);
    try {
      await applicationService.updateComment(applicationId, commentId, { content: trimmed });
      setEditingId(null);
      setEditContent('');
      setSuccessMsg('Comment updated.');
      fetchComments();
      if (onCommentChange) onCommentChange();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update comment');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    setIsDeleting(true);
    setError(null);
    try {
      await applicationService.deleteComment(applicationId, commentId);
      setDeletingId(null);
      setSuccessMsg('Comment deleted.');
      fetchComments();
      if (onCommentChange) onCommentChange();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete comment');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Application Notes & Comments</h3>
            <p className="text-xs text-slate-400">Record interview observations, recruiter communications, and notes</p>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-full border border-slate-700">
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </span>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      {successMsg && <SuccessMessage message={successMsg} onDismiss={() => setSuccessMsg(null)} />}

      {/* New Comment Input Form */}
      <form onSubmit={handleAddComment} className="space-y-3">
        <div className="relative">
          <textarea
            rows={3}
            maxLength={2000}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Add a new comment or interview note (up to 2000 characters)..."
            className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
            disabled={isSubmitting}
          />
          <div className="absolute bottom-3 right-3 text-[11px] text-slate-500 font-mono">
            {newContent.length} / 2000
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !newContent.trim()}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Post Comment</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Comment List */}
      {isLoading ? (
        <LoadingState message="Fetching comments..." />
      ) : comments.length === 0 ? (
        <EmptyState
          title="No comments recorded yet"
          description="Use the form above to add your first interview note or update log for this position."
        />
      ) : (
        <div className="space-y-4 pt-2">
          {comments.map((comment) => {
            const isOwner = user?.username === comment.username;
            const isEditingThis = editingId === comment.id;

            return (
              <div
                key={comment.id}
                className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-3 hover:border-slate-700/60 transition-all"
              >
                {/* User & Timestamp Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-white">{comment.username}</span>
                    <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                      <Clock className="w-3 h-3 ml-1" />
                      <span>{new Date(comment.createdAt).toLocaleString()}</span>
                    </span>
                  </div>

                  {/* Owner Controls */}
                  {isOwner && !isEditingThis && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleStartEdit(comment)}
                        className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit Comment"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(comment.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Delete Comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline Editing Mode */}
                {isEditingThis ? (
                  <div className="space-y-3 pt-1">
                    <textarea
                      rows={3}
                      maxLength={2000}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                      disabled={isUpdating}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {editContent.length} / 2000
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating || !editContent.trim()}
                          onClick={() => handleSaveEdit(comment.id)}
                          className="px-3 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center space-x-1 cursor-pointer"
                        >
                          {isUpdating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {comment.content}
                  </p>
                )}

                {/* Delete Prompt inline confirmation */}
                {deletingId === comment.id && (
                  <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between text-xs text-rose-300">
                    <span className="flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Delete this comment?</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-2.5 py-1 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={isDeleting}
                        className="px-2.5 py-1 bg-rose-600 text-white hover:bg-rose-500 rounded-lg flex items-center space-x-1 cursor-pointer font-semibold"
                      >
                        {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
