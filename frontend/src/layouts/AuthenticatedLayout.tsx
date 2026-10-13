import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, LogOut, LayoutDashboard, ListFilter, Menu, X, User } from 'lucide-react';

export const AuthenticatedLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isDashboardActive = location.pathname === '/dashboard';
  const isApplicationsActive = location.pathname.startsWith('/applications');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header / Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Branding & Navigation */}
          <div className="flex items-center space-x-8">
            <Link
              to="/dashboard"
              className="flex items-center space-x-3 text-indigo-400 font-extrabold text-xl tracking-tight hover:opacity-90 transition-opacity"
            >
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                <Briefcase className="w-5 h-5 text-indigo-400" />
              </div>
              <span>JobTrack</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
              <Link
                to="/dashboard"
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isDashboardActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/applications"
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isApplicationsActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ListFilter className="w-4 h-4" />
                <span>Applications</span>
              </Link>
            </nav>
          </div>

          {/* Desktop User Profile & Logout */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2 bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-xl">
                <div className="p-1 bg-indigo-500/10 text-indigo-400 rounded-lg">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-white">{user.username}</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                    Candidate
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer"
              title="Sign out of JobTrack"
              aria-label="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Hamburger Menu Toggle Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-3 animate-fade-in">
            <nav className="flex flex-col space-y-1">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isDashboardActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/applications"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isApplicationsActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <ListFilter className="w-5 h-5" />
                <span>Applications</span>
              </Link>
            </nav>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              {user && (
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white">{user.username}</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-500">
        JobTrack System &copy; {new Date().getFullYear()} — Production Ready API Integrated Architecture
      </footer>
    </div>
  );
};
