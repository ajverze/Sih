import React from 'react';
import { UserProfile, UserRole } from '../types/oiml';
import { ShieldCheck, Plus, FileText, BarChart3, Settings, Database } from 'lucide-react';

interface NavigationProps {
  activeTab: 'dashboard' | 'repository' | 'editor' | 'report' | 'rules';
  setActiveTab: (tab: 'dashboard' | 'repository' | 'editor' | 'report' | 'rules') => void;
  currentUser: UserProfile;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  onNewTest: () => void;
  hasActiveReport: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  setCurrentUser,
  onNewTest,
  hasActiveReport,
}) => {
  const roles: { role: UserRole; label: string }[] = [
    { role: 'engineer', label: 'Test Engineer' },
    { role: 'reviewer', label: 'Reviewer / Officer' },
    { role: 'admin', label: 'Administrator' },
    { role: 'viewer', label: 'Authorized Viewer' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs no-print">
      {/* Official Government of India & DoCA Top Sub-banner */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1 px-4 sm:px-8 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white tracking-wide">
            GOVERNMENT OF INDIA
          </span>
          <span className="text-slate-500">·</span>
          <span>Department of Consumer Affairs (DoCA)</span>
          <span className="text-slate-500">·</span>
          <span className="text-cyan-400">Legal Metrology Division (NAWI Type Approval)</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-slate-400">
          <span>OIML Recommendation R-76 Edition 2006</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300 font-mono text-[11px]">{currentUser.labName}</span>
        </div>
      </div>

      {/* Top Bar Contract (3 Zones) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-hidden"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
              R76
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">
              NAWI Test System
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-slate-100 text-blue-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('repository')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'repository'
                ? 'bg-slate-100 text-blue-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Database className="w-4 h-4 text-slate-500" />
            <span>Repository</span>
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'editor'
                ? 'bg-slate-100 text-blue-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Test Data Entry</span>
          </button>

          {hasActiveReport && (
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'report'
                  ? 'bg-slate-100 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Official Report</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-slate-100 text-blue-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>OIML Rules</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions and Role Selector */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Role switcher dropdown */}
          <div className="flex items-center gap-2">
            <span className="hidden lg:inline text-xs text-slate-500 font-medium">Role:</span>
            <select
              value={currentUser.role}
              onChange={(e) => {
                const newRole = e.target.value as UserRole;
                const found = roles.find((r) => r.role === newRole);
                setCurrentUser((prev) => ({
                  ...prev,
                  role: newRole,
                  designation:
                    newRole === 'engineer'
                      ? 'Senior Scientific Officer (Legal Metrology)'
                      : newRole === 'reviewer'
                      ? 'Joint Director / Reviewing Officer'
                      : newRole === 'admin'
                      ? 'System Administrator'
                      : 'Authorized Inspector / Viewer',
                }));
              }}
              className="text-xs font-semibold bg-slate-100 border border-slate-300 text-slate-800 rounded-md py-1.5 px-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r.role} value={r.role}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* New Test Button */}
          {currentUser.role !== 'viewer' && (
            <button
              onClick={onNewTest}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>New Test</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
