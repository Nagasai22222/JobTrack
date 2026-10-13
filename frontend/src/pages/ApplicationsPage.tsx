import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { applicationService } from '../services/api';
import { useToast } from '../context/ToastContext';
import type {
  ApplicationStatus,
  GetApplicationsParams,
  JobApplication,
  JobApplicationRequest,
  PagedApplicationResponse,
} from '../types';
import { ApplicationFilters } from '../components/applications/ApplicationFilters';
import { ApplicationTable } from '../components/applications/ApplicationTable';
import { ApplicationForm } from '../components/applications/ApplicationForm';
import { DeleteApplicationDialog } from '../components/applications/DeleteApplicationDialog';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';
import { Plus, ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';

export const ApplicationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  // Query Parameters State
  const [params, setParams] = useState<GetApplicationsParams>({
    search: searchParams.get('search') || '',
    status: (searchParams.get('status') as ApplicationStatus) || '',
    fromDate: searchParams.get('fromDate') || '',
    toDate: searchParams.get('toDate') || '',
    sortBy: (searchParams.get('sortBy') as any) || 'appliedDate',
    direction: (searchParams.get('direction') as any) || 'desc',
    page: parseInt(searchParams.get('page') || '0', 10),
    size: 10,
  });

  const [pagedData, setPagedData] = useState<PagedApplicationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form Modal State (Create & Edit)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete Modal State
  const [deletingApp, setDeletingApp] = useState<JobApplication | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const hasActiveFilters = Boolean(
    params.search || params.status || params.fromDate || params.toDate
  );

  // Fetch applications from server
  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await applicationService.getApplications(params);
      setPagedData(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch applications');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Handle parameter changes
  const handleParamsChange = (newParams: Partial<GetApplicationsParams>) => {
    setParams((prev) => {
      const updated = { ...prev, ...newParams };
      // Update URL search query params
      const urlParams: Record<string, string> = {};
      if (updated.search) urlParams.search = updated.search;
      if (updated.status) urlParams.status = updated.status;
      if (updated.fromDate) urlParams.fromDate = updated.fromDate;
      if (updated.toDate) urlParams.toDate = updated.toDate;
      if (updated.sortBy) urlParams.sortBy = updated.sortBy;
      if (updated.direction) urlParams.direction = updated.direction;
      if (updated.page) urlParams.page = updated.page.toString();

      setSearchParams(urlParams, { replace: true });
      return updated;
    });
  };

  const handleResetFilters = () => {
    const defaultParams: GetApplicationsParams = {
      search: '',
      status: '',
      fromDate: '',
      toDate: '',
      sortBy: 'appliedDate',
      direction: 'desc',
      page: 0,
      size: 10,
    };
    setParams(defaultParams);
    setSearchParams({}, { replace: true });
  };

  // Create or Update Submission
  const handleFormSubmit = async (formData: JobApplicationRequest) => {
    setIsSubmitting(true);
    try {
      if (editingApp) {
        await applicationService.updateApplication(editingApp.id, formData);
        showToast('Job application updated successfully!', 'success');
      } else {
        await applicationService.createApplication(formData);
        showToast('Job application created successfully!', 'success');
      }
      setIsFormOpen(false);
      setEditingApp(null);
      fetchApplications();
    } catch (err: any) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deletingApp) return;
    setIsDeleting(true);
    try {
      await applicationService.deleteApplication(deletingApp.id);
      showToast(`Application for ${deletingApp.jobRole} at ${deletingApp.companyName} deleted.`, 'success');
      setDeletingApp(null);
      fetchApplications();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete application', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingApp(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (app: JobApplication) => {
    setEditingApp(app);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center space-x-2 tracking-tight">
            <Briefcase className="w-6 h-6 text-indigo-400" />
            <span>Job Applications</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage, search, filter, and track all your active job applications
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Application</span>
        </button>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* Filters Component */}
      <ApplicationFilters
        params={params}
        onChange={handleParamsChange}
        onReset={handleResetFilters}
      />

      {/* Main Data Content */}
      {isLoading ? (
        <LoadingState message="Fetching job applications..." />
      ) : !pagedData || pagedData.content.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="No applications match your filter criteria"
            description="No applications were found matching your current search term, status selection, or date range. Try clearing your filters."
            actionLabel="Clear All Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <EmptyState
            title="Your job application pipeline is empty"
            description="Record your active job search by adding your first job application."
            actionLabel="Add Your First Application"
            onAction={handleOpenCreate}
          />
        )
      ) : (
        <div className="space-y-4">
          <ApplicationTable
            applications={pagedData.content}
            onEdit={handleOpenEdit}
            onDelete={(app) => setDeletingApp(app)}
          />

          {/* Server-Side Pagination Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-400">
            <div>
              Showing <span className="text-white font-semibold">{pagedData.content.length}</span> of{' '}
              <span className="text-white font-semibold">{pagedData.totalElements}</span> applications
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-slate-400">
                Page <span className="text-white font-semibold">{pagedData.currentPage + 1}</span> of{' '}
                <span className="text-white font-semibold">{Math.max(1, pagedData.totalPages)}</span>
              </span>

              <div className="flex items-center space-x-1">
                <button
                  disabled={pagedData.currentPage === 0 || isLoading}
                  onClick={() => handleParamsChange({ page: pagedData.currentPage - 1 })}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition-colors cursor-pointer"
                  title="Previous Page"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  disabled={pagedData.currentPage >= pagedData.totalPages - 1 || isLoading}
                  onClick={() => handleParamsChange({ page: pagedData.currentPage + 1 })}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition-colors cursor-pointer"
                  title="Next Page"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal Form */}
      <ApplicationForm
        isOpen={isFormOpen}
        applicationToEdit={editingApp}
        isSubmitting={isSubmitting}
        onSubmit={handleFormSubmit}
        onClose={() => {
          setIsFormOpen(false);
          setEditingApp(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteApplicationDialog
        isOpen={Boolean(deletingApp)}
        application={deletingApp}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingApp(null)}
      />
    </div>
  );
};
