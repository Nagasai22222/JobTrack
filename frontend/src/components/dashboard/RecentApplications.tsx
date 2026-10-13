import React from 'react';
import type { JobApplication } from '../../types';
import { ApplicationStatusBadge } from '../applications/ApplicationStatusBadge';
import { Building2, Calendar, ArrowRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RecentApplicationsProps {
  applications: JobApplication[];
  onAddClick: () => void;
}

export const RecentApplications: React.FC<RecentApplicationsProps> = ({
  applications,
  onAddClick,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Recent Job Applications</h3>
          <p className="text-xs text-slate-400">Latest entries in your tracking pipeline</p>
        </div>
        <Link
          to="/applications"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="py-8 text-center space-y-3 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl">
          <p className="text-xs text-slate-400">No applications recorded yet.</p>
          <button
            onClick={onAddClick}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-all cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Your First Application</span>
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/80">
          {applications.map((app) => (
            <Link
              key={app.id}
              to={`/applications/${app.id}`}
              className="py-3.5 flex items-center justify-between hover:bg-slate-800/40 px-3 rounded-xl transition-colors group cursor-pointer block"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {app.companyName}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">{app.jobRole}</div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {app.appliedDate && (
                  <span className="hidden sm:flex items-center space-x-1 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{app.appliedDate}</span>
                  </span>
                )}
                <ApplicationStatusBadge status={app.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
