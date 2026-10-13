import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { applicationService } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { DashboardSummary, JobApplication, JobApplicationRequest } from '../types';
import { StatCard } from '../components/dashboard/StatCard';
import { RecentApplications } from '../components/dashboard/RecentApplications';
import { ApplicationForm } from '../components/applications/ApplicationForm';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorMessage } from '../components/common/ErrorMessage';
import {
  Briefcase,
  Send,
  SearchCheck,
  UserCheck,
  Trophy,
  XCircle,
  Archive,
  Plus,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentApps, setRecentApps] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Application modal state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sumData, recentData] = await Promise.all([
        applicationService.getDashboardSummary(),
        applicationService.getRecentApplications(),
      ]);
      setSummary(sumData);
      setRecentApps(recentData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateApplication = async (data: JobApplicationRequest) => {
    setIsSubmitting(true);
    try {
      await applicationService.createApplication(data);
      setIsFormOpen(false);
      showToast('Job application created successfully!', 'success');
      fetchDashboardData();
    } catch (err: any) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading dashboard pipeline..." />;
  }

  // Calculate Pipeline Funnel Percentages
  const total = summary?.totalApplications || 0;
  const applied = summary?.applied || 0;
  const screening = summary?.screening || 0;
  const interview = summary?.interview || 0;
  const offers = summary?.offers || 0;
  const rejected = summary?.rejected || 0;
  const withdrawn = summary?.withdrawn || 0;

  const getPercent = (count: number) => (total > 0 ? ((count / total) * 100).toFixed(1) : '0');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>JobTrack Executive Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-indigo-400">{user?.username || 'User'}</span>!
            </h1>
            <p className="mt-1 text-slate-400 text-xs sm:text-sm max-w-xl">
              Track your real-time job application funnel, interview pipeline, and offer status in one central hub.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Application</span>
            </button>
            <button
              onClick={() => navigate('/applications')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              <span>View All Applications</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* Visual Pipeline Funnel Progress Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Application Pipeline Funnel</h3>
              <p className="text-xs text-slate-400">Visual distribution of job application stages</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Total Tracked: <strong className="text-white">{total}</strong>
          </span>
        </div>

        {/* Visual Multi-Segment Bar */}
        {total === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
            No application data available yet to build visual pipeline funnel.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
              <div
                style={{ width: `${getPercent(applied)}%` }}
                className="bg-indigo-500 transition-all duration-500"
                title={`Applied: ${applied} (${getPercent(applied)}%)`}
              />
              <div
                style={{ width: `${getPercent(screening)}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`Screening: ${screening} (${getPercent(screening)}%)`}
              />
              <div
                style={{ width: `${getPercent(interview)}%` }}
                className="bg-purple-500 transition-all duration-500"
                title={`Interview: ${interview} (${getPercent(interview)}%)`}
              />
              <div
                style={{ width: `${getPercent(offers)}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Offers: ${offers} (${getPercent(offers)}%)`}
              />
              <div
                style={{ width: `${getPercent(rejected)}%` }}
                className="bg-rose-500 transition-all duration-500"
                title={`Rejected: ${rejected} (${getPercent(rejected)}%)`}
              />
              <div
                style={{ width: `${getPercent(withdrawn)}%` }}
                className="bg-slate-600 transition-all duration-500"
                title={`Withdrawn: ${withdrawn} (${getPercent(withdrawn)}%)`}
              />
            </div>

            {/* Stage Legend Labels */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[11px] pt-1">
              <div className="flex items-center space-x-1.5 text-indigo-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                <span>Applied ({applied})</span>
              </div>
              <div className="flex items-center space-x-1.5 text-amber-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span>Screening ({screening})</span>
              </div>
              <div className="flex items-center space-x-1.5 text-purple-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                <span>Interview ({interview})</span>
              </div>
              <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Offers ({offers})</span>
              </div>
              <div className="flex items-center space-x-1.5 text-rose-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span>Rejected ({rejected})</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600 shrink-0" />
                <span>Withdrawn ({withdrawn})</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dashboard Summary Statistics Cards Grid */}
      <div>
        <h2 className="text-base font-bold text-white mb-4">Pipeline Metric Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Applications"
            count={summary?.totalApplications ?? 0}
            icon={Briefcase}
            colorTheme="indigo"
            onClick={() => navigate('/applications')}
          />
          <StatCard
            title="Applied"
            count={summary?.applied ?? 0}
            icon={Send}
            colorTheme="indigo"
            onClick={() => navigate('/applications?status=APPLIED')}
          />
          <StatCard
            title="Screening"
            count={summary?.screening ?? 0}
            icon={SearchCheck}
            colorTheme="amber"
            onClick={() => navigate('/applications?status=SCREENING')}
          />
          <StatCard
            title="Interview"
            count={summary?.interview ?? 0}
            icon={UserCheck}
            colorTheme="purple"
            onClick={() => navigate('/applications?status=INTERVIEW')}
          />
          <StatCard
            title="Offers"
            count={summary?.offers ?? 0}
            icon={Trophy}
            colorTheme="emerald"
            onClick={() => navigate('/applications?status=OFFER')}
          />
          <StatCard
            title="Rejected"
            count={summary?.rejected ?? 0}
            icon={XCircle}
            colorTheme="rose"
            onClick={() => navigate('/applications?status=REJECTED')}
          />
          <StatCard
            title="Withdrawn"
            count={summary?.withdrawn ?? 0}
            icon={Archive}
            colorTheme="slate"
            onClick={() => navigate('/applications?status=WITHDRAWN')}
          />
        </div>
      </div>

      {/* Recent Applications Section */}
      <RecentApplications
        applications={recentApps}
        onAddClick={() => setIsFormOpen(true)}
      />

      {/* Create Application Form Modal */}
      <ApplicationForm
        isOpen={isFormOpen}
        isSubmitting={isSubmitting}
        onSubmit={handleCreateApplication}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
};
