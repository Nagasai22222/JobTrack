import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { applicationService } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { ApplicationStatus, JobApplication, JobApplicationRequest } from '../types';
import { ApplicationStatusBadge } from '../components/applications/ApplicationStatusBadge';
import { ApplicationForm } from '../components/applications/ApplicationForm';
import { DeleteApplicationDialog } from '../components/applications/DeleteApplicationDialog';
import { ApplicationComments } from '../components/comments/ApplicationComments';
import { ApplicationTimeline } from '../components/history/ApplicationTimeline';
import { ApplicationDocuments } from '../components/documents/ApplicationDocuments';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorMessage } from '../components/common/ErrorMessage';
import {
  ArrowLeft,
  Building2,
  Briefcase,
  MapPin,
  Calendar,
  ExternalLink,
  Edit3,
  Trash2,
  MessageSquare,
  History,
  FileText,
  Loader2,
  FileCheck,
} from 'lucide-react';

const ALL_STATUSES: { value: ApplicationStatus; label: string }[] = [
  { value: 'APPLIED', label: 'Applied' },
  { value: 'SCREENING', label: 'Screening' },
  { value: 'INTERVIEW', label: 'Interview' },
  { value: 'OFFER', label: 'Offer' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
];

export const ApplicationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const applicationId = parseInt(id || '0', 10);

  const [application, setApplication] = useState<JobApplication | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Status transition state
  const [isChangingStatus, setIsChangingStatus] = useState<boolean>(false);

  // Activity Summary Counters State
  const [commentsCount, setCommentsCount] = useState<number>(0);
  const [documentsCount, setDocumentsCount] = useState<number>(0);
  const [historyCount, setHistoryCount] = useState<number>(0);

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'comments' | 'documents' | 'history'>('comments');

  // Activity Timeline Refresh Counter
  const [timelineRefreshTrigger, setTimelineRefreshTrigger] = useState<number>(0);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchApplicationDetails = useCallback(async () => {
    if (!applicationId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await applicationService.getApplication(applicationId);
      setApplication(data);

      // Load sub-counts in parallel
      const [comments, documents, history] = await Promise.all([
        applicationService.getComments(applicationId).catch(() => []),
        applicationService.getDocuments(applicationId).catch(() => []),
        applicationService.getApplicationHistory(applicationId).catch(() => []),
      ]);
      setCommentsCount(comments.length);
      setDocumentsCount(documents.length);
      setHistoryCount(history.length);
    } catch (err: any) {
      setError(err.message || 'Failed to load application details');
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchApplicationDetails();
  }, [fetchApplicationDetails]);

  // Handle Quick Status Transition
  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!application || application.status === newStatus) return;
    setIsChangingStatus(true);
    try {
      const payload: JobApplicationRequest = {
        companyName: application.companyName,
        jobRole: application.jobRole,
        location: application.location,
        status: newStatus,
        appliedDate: application.appliedDate,
        jobUrl: application.jobUrl,
        notes: application.notes,
      };

      const updated = await applicationService.updateApplication(applicationId, payload);
      setApplication(updated);
      showToast(`Status updated to ${newStatus}`, 'success');
      setTimelineRefreshTrigger((prev) => prev + 1);

      // Refresh history count
      const history = await applicationService.getApplicationHistory(applicationId).catch(() => []);
      setHistoryCount(history.length);
    } catch (err: any) {
      showToast(err.message || 'Failed to update application status', 'error');
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleUpdate = async (formData: JobApplicationRequest) => {
    setIsSubmitting(true);
    try {
      const updated = await applicationService.updateApplication(applicationId, formData);
      setApplication(updated);
      setIsEditOpen(false);
      showToast('Job application updated successfully!', 'success');
      setTimelineRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!application) return;
    setIsDeleting(true);
    try {
      await applicationService.deleteApplication(applicationId);
      showToast(`Application for ${application.jobRole} at ${application.companyName} deleted.`, 'success');
      navigate('/applications');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete application', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubFeatureChange = async () => {
    setTimelineRefreshTrigger((prev) => prev + 1);
    // Refresh sub-counts
    const [comments, documents, history] = await Promise.all([
      applicationService.getComments(applicationId).catch(() => []),
      applicationService.getDocuments(applicationId).catch(() => []),
      applicationService.getApplicationHistory(applicationId).catch(() => []),
    ]);
    setCommentsCount(comments.length);
    setDocumentsCount(documents.length);
    setHistoryCount(history.length);
  };

  if (isLoading) {
    return <LoadingState message="Loading application details..." />;
  }

  if (error || !application) {
    return (
      <div className="space-y-4">
        <Link
          to="/applications"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Applications</span>
        </Link>
        <ErrorMessage message={error || 'Application not found'} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/applications"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-400" />
          <span>Back to Applications</span>
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Edit Application</span>
          </button>
          <button
            onClick={() => setIsDeleteOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="flex items-start space-x-4">
            <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400 shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  {application.companyName}
                </h1>
                {application.jobUrl && (
                  <a
                    href={application.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-indigo-400 bg-slate-800/80 rounded-lg transition-colors"
                    title="Open External Job Posting"
                    aria-label="Open job posting in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              <p className="text-sm font-semibold text-indigo-400 mt-1 flex items-center space-x-2">
                <Briefcase className="w-4 h-4" />
                <span>{application.jobRole}</span>
              </p>
            </div>
          </div>

          {/* Interactive Status Transition Dropdown / Control */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 p-2 rounded-2xl">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1">
                Status:
              </span>
              <div className="relative inline-flex items-center">
                <select
                  value={application.status}
                  disabled={isChangingStatus}
                  onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
                  className="bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold py-1.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer disabled:opacity-50"
                  aria-label="Change application status"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {isChangingStatus && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 ml-2" />
                )}
              </div>
            </div>
            <ApplicationStatusBadge status={application.status} size="md" />
          </div>
        </div>

        {/* Quick Information Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
            <span className="text-slate-400 font-medium">Location</span>
            <div className="text-slate-200 font-semibold flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>{application.location || 'Not Specified'}</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
            <span className="text-slate-400 font-medium">Applied Date</span>
            <div className="text-slate-200 font-semibold flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{application.appliedDate || 'Not Specified'}</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
            <span className="text-slate-400 font-medium">Created On</span>
            <div className="text-slate-200 font-semibold">
              {new Date(application.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Notes Block */}
        <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Description & Notes
          </span>
          {application.notes ? (
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
              {application.notes}
            </p>
          ) : (
            <p className="text-xs text-slate-500 italic">No notes or referral details recorded for this application.</p>
          )}
        </div>

        {/* Activity Summary Counters Overview Block */}
        <div className="pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2 text-indigo-400">
                <MessageSquare className="w-4 h-4" />
                <span className="font-semibold">Comments Logged</span>
              </div>
              <span className="font-bold text-white text-sm">{commentsCount}</span>
            </div>

            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-400">
                <FileCheck className="w-4 h-4" />
                <span className="font-semibold">Documents Attached</span>
              </div>
              <span className="font-bold text-white text-sm">{documentsCount}</span>
            </div>

            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-400">
                <History className="w-4 h-4" />
                <span className="font-semibold">Lifecycle Events</span>
              </div>
              <span className="font-bold text-white text-sm">{historyCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Header */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('comments')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'comments'
              ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Comments & Notes ({commentsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'documents'
              ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Documents & Attachments ({documentsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Activity Timeline ({historyCount})</span>
        </button>
      </div>

      {/* Tab Panels Content */}
      <div className="space-y-6">
        {activeTab === 'comments' && (
          <ApplicationComments
            applicationId={applicationId}
            onCommentChange={handleSubFeatureChange}
          />
        )}

        {activeTab === 'documents' && (
          <ApplicationDocuments
            applicationId={applicationId}
            onDocumentChange={handleSubFeatureChange}
          />
        )}

        {activeTab === 'history' && (
          <ApplicationTimeline
            applicationId={applicationId}
            refreshTrigger={timelineRefreshTrigger}
          />
        )}
      </div>

      {/* Edit Form Modal */}
      <ApplicationForm
        isOpen={isEditOpen}
        applicationToEdit={application}
        isSubmitting={isSubmitting}
        onSubmit={handleUpdate}
        onClose={() => setIsEditOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteApplicationDialog
        isOpen={isDeleteOpen}
        application={application}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setIsDeleteOpen(false)}
      />
    </div>
  );
};
