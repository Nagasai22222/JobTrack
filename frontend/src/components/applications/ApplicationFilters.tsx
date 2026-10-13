import React from 'react';
import type { ApplicationStatus, GetApplicationsParams } from '../../types';
import { Search, ArrowUpDown, RotateCcw, X, Filter } from 'lucide-react';

interface ApplicationFiltersProps {
  params: GetApplicationsParams;
  onChange: (updatedParams: Partial<GetApplicationsParams>) => void;
  onReset: () => void;
}

const ALL_STATUSES: { value: ApplicationStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'APPLIED', label: 'Applied' },
  { value: 'SCREENING', label: 'Screening' },
  { value: 'INTERVIEW', label: 'Interview' },
  { value: 'OFFER', label: 'Offer' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
];

const SORT_FIELDS: { value: NonNullable<GetApplicationsParams['sortBy']>; label: string }[] = [
  { value: 'appliedDate', label: 'Applied Date' },
  { value: 'companyName', label: 'Company Name' },
  { value: 'jobRole', label: 'Job Role' },
  { value: 'status', label: 'Status' },
  { value: 'createdAt', label: 'Created At' },
];

export const ApplicationFilters: React.FC<ApplicationFiltersProps> = ({
  params,
  onChange,
  onReset,
}) => {
  const hasActiveFilters = Boolean(
    params.search || params.status || params.fromDate || params.toDate
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Primary Toolbar Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Search Company or Role
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={params.search || ''}
              onChange={(e) => onChange({ search: e.target.value, page: 0 })}
              placeholder="Search by company or job title..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Filter by Status
          </label>
          <div className="relative">
            <select
              value={params.status || ''}
              onChange={(e) => onChange({ status: e.target.value as ApplicationStatus | '', page: 0 })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 cursor-pointer"
              aria-label="Filter applications by status"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Sort By
          </label>
          <div className="flex space-x-2">
            <select
              value={params.sortBy || 'appliedDate'}
              onChange={(e) => onChange({ sortBy: e.target.value as any, page: 0 })}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 cursor-pointer"
              aria-label="Sort applications by"
            >
              {SORT_FIELDS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => onChange({ direction: params.direction === 'asc' ? 'desc' : 'asc', page: 0 })}
              className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer flex items-center justify-center"
              title={`Toggle direction (${params.direction === 'asc' ? 'Ascending' : 'Descending'})`}
              aria-label="Toggle sort direction"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Date Range & Reset Row */}
      <div className="flex flex-wrap items-end justify-between gap-3 pt-3 border-t border-slate-800/60">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={params.fromDate || ''}
              onChange={(e) => onChange({ fromDate: e.target.value, page: 0 })}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              aria-label="Filter from date"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={params.toDate || ''}
              onChange={(e) => onChange({ toDate: e.target.value, page: 0 })}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              aria-label="Filter to date"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Active Filter Badges Row */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/40 text-xs">
          <span className="text-slate-500 text-[11px] font-semibold flex items-center space-x-1">
            <Filter className="w-3 h-3" />
            <span>Active Filters:</span>
          </span>

          {params.search && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700 text-[11px]">
              <span>Search: "{params.search}"</span>
              <button
                onClick={() => onChange({ search: '', page: 0 })}
                className="hover:text-white cursor-pointer ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {params.status && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700 text-[11px]">
              <span>Status: {params.status}</span>
              <button
                onClick={() => onChange({ status: '', page: 0 })}
                className="hover:text-white cursor-pointer ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {params.fromDate && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
              <span>From: {params.fromDate}</span>
              <button
                onClick={() => onChange({ fromDate: '', page: 0 })}
                className="hover:text-white cursor-pointer ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {params.toDate && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
              <span>To: {params.toDate}</span>
              <button
                onClick={() => onChange({ toDate: '', page: 0 })}
                className="hover:text-white cursor-pointer ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
