import React from 'react';
import { Link } from 'react-router-dom';
import type { JobApplication } from '../../types';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import { Building2, MapPin, ExternalLink, Edit3, Trash2, Calendar, Eye } from 'lucide-react';

interface ApplicationTableProps {
  applications: JobApplication[];
  onEdit: (application: JobApplication) => void;
  onDelete: (application: JobApplication) => void;
}

export const ApplicationTable: React.FC<ApplicationTableProps> = ({
  applications,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4 sm:px-6">Company & Role</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Location</th>
              <th className="py-3.5 px-4">Applied Date</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {applications.map((app) => (
              <tr
                key={app.id}
                className="hover:bg-slate-800/40 transition-colors group"
              >
                {/* Company & Role */}
                <td className="py-4 px-4 sm:px-6">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 mt-0.5 shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center space-x-2">
                        <Link
                          to={`/applications/${app.id}`}
                          className="hover:text-indigo-400 transition-colors"
                        >
                          {app.companyName}
                        </Link>
                        {app.jobUrl && (
                          <a
                            href={app.jobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-indigo-400 transition-colors"
                            title="Open Job Posting"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-medium">{app.jobRole}</div>
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="py-4 px-4 whitespace-nowrap">
                  <ApplicationStatusBadge status={app.status} />
                </td>

                {/* Location */}
                <td className="py-4 px-4 text-xs text-slate-400 whitespace-nowrap">
                  {app.location ? (
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{app.location}</span>
                    </span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>

                {/* Applied Date */}
                <td className="py-4 px-4 text-xs text-slate-300 whitespace-nowrap">
                  {app.appliedDate ? (
                    <span className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{app.appliedDate}</span>
                    </span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-4 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end space-x-1">
                    <Link
                      to={`/applications/${app.id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="View Details, Comments & Documents"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => onEdit(app)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Application"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(app)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete Application"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
