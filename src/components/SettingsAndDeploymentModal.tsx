import React, { useState } from 'react';
import { DatabaseState, InstitutionSettings } from '../types';
import { StorageService } from '../services/storage';
import {
  Settings,
  X,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Globe,
  ShieldCheck,
  Server,
  Database,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface Props {
  db: DatabaseState;
  isOpen: boolean;
  onClose: () => void;
  onUpdateDb: (newDb: DatabaseState) => void;
}

export const SettingsAndDeploymentModal: React.FC<Props> = ({
  db,
  isOpen,
  onClose,
  onUpdateDb,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'settings' | 'backup' | 'deployment' | 'security'>('deployment');

  // Institution settings form
  const [settingsForm, setSettingsForm] = useState<InstitutionSettings>({
    ...db.settings,
  });

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDb: DatabaseState = {
      ...db,
      settings: settingsForm,
    };
    await StorageService.saveDatabase(updatedDb);
    onUpdateDb(updatedDb);
    setFeedbackMessage({ type: 'success', text: 'Institution settings updated successfully!' });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Restore file picker
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = await StorageService.restoreFromJson(content);
      if (res.success) {
        const freshDb = StorageService.getDatabase();
        onUpdateDb(freshDb);
        setFeedbackMessage({ type: 'success', text: 'Backup restored successfully!' });
      } else {
        setFeedbackMessage({ type: 'error', text: res.error || 'Failed to restore backup' });
      }
    };
    reader.readAsText(file);
  };

  // Reset to Demo Data
  const handleResetDemo = async () => {
    if (confirm('Are you sure you want to restore the DEMO dataset with sample students and fees?')) {
      const fresh = await StorageService.resetDatabase('demo');
      onUpdateDb(fresh);
      setFeedbackMessage({ type: 'success', text: 'Demo dataset loaded successfully!' });
    }
  };

  // Clean Institute (for real students)
  const handleCleanInstitute = async () => {
    if (
      confirm(
        'Are you ready to use this app with REAL students? This will clear all sample demo students, payments, and attendance records, giving you a fresh, clean database.'
      )
    ) {
      const fresh = await StorageService.resetDatabase('clean');
      onUpdateDb(fresh);
      setFeedbackMessage({
        type: 'success',
        text: 'Clean institute initialized! All demo data cleared. You can now enroll real students.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Campus Settings & Deployment Guide</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('deployment')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'deployment'
                ? 'border-amber-500 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-4 h-4 text-amber-500" />
            <span>Free Deployment & Limits Guide</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-amber-500 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Institute Details</span>
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'border-amber-500 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4 text-slate-500" />
            <span>Database Backup & Reset</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-amber-500 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>Security & Staff Accounts</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {feedbackMessage && (
            <div
              className={`mb-5 p-3.5 rounded-lg border text-xs flex items-center gap-2 ${
                feedbackMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {feedbackMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
          )}

          {/* TAB 1: FREE DEPLOYMENT & USAGE LIMITS GUIDE */}
          {activeTab === 'deployment' && (
            <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
              <div className="rounded-xl bg-gradient-to-r from-slate-900 to-[#10233b] p-5 text-white">
                <span className="text-amber-400 font-bold text-xs uppercase tracking-wide block mb-1">
                  Beginner Guide for AUI Digi Agency
                </span>
                <h4 className="text-lg font-bold text-white">
                  How to Publish & Run AUI Campus Manager for Free
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  You can deploy and use this complete management system for your school, college, or
                  academy with zero software license fees and free cloud hosting options.
                </p>
              </div>

              {/* Free Option 1 */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                <h5 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[11px] font-bold">
                    1
                  </span>
                  <span>Direct Preview & Permanent Cloud Run Hosting (Free)</span>
                </h5>
                <p className="text-xs text-slate-600 mt-2">
                  The application is currently hosted live on Google Cloud Run via Google AI Studio. You
                  can share the preview link with teachers, accountants, or administrators immediately:
                </p>
                <div className="mt-2 p-2.5 bg-white border border-slate-200 rounded font-mono text-xs text-slate-800 break-all select-all">
                  https://ais-pre-miyvubfhy5pg64am3a3ons-139831019952.asia-southeast1.run.app
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  <strong>Free Tier Allowance:</strong> 2 million requests/month, 360,000 vCPU-seconds
                  free every month forever.
                </div>
              </div>

              {/* Free Option 2 */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                <h5 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[11px] font-bold">
                    2
                  </span>
                  <span>Custom Domain on Vercel, Netlify, or Render (100% Free)</span>
                </h5>
                <p className="text-xs text-slate-600 mt-2">
                  If you want your own web address (like <code>campus.auiagency.com</code>):
                </p>
                <ol className="list-decimal list-inside text-xs text-slate-600 mt-1 space-y-1">
                  <li>Download or push this codebase to a free GitHub repository.</li>
                  <li>Sign up for a free Vercel or Render account and click "Import Project".</li>
                  <li>Connect your custom domain with 1-click free SSL HTTPS security.</li>
                </ol>
                <div className="mt-2 text-xs text-slate-500">
                  <strong>Free Allowance:</strong> 100 GB bandwidth / month, unlimited websites, 100%
                  free forever.
                </div>
              </div>

              {/* Database & Limits Explanation */}
              <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-3">
                <h5 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-500" />
                  <span>Database Persistence & Usage Limits Before Real Students</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <strong className="text-slate-900 block mb-1">Persistent File Storage:</strong>
                    Data is stored on server disk in <code>server/data/database.json</code> with atomic
                    writes and in your browser's offline storage.
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <strong className="text-slate-900 block mb-1">Capacity for Students:</strong>
                    Supports over <strong>1,500 students</strong> and <strong>20,000+ receipts</strong>{' '}
                    with instant search and sub-second receipt generation.
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <strong>Recommendation for Live Production:</strong>
                  <br />
                  Use the <strong>"Download Full Database Backup"</strong> button once a week to save a
                  safe copy on your computer. When you are ready for real admissions, click{' '}
                  <strong>"Clear Demo Data & Start Fresh"</strong> in the next tab.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INSTITUTE DETAILS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Institute / School Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={settingsForm.subTitle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, subTitle: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Phone Number
                  </label>
                  <input
                    type="text"
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={settingsForm.email}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Campus Physical Address (Appears on receipts)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Currency Symbol (e.g. Rs. or $ or PKR)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.currencySymbol}
                    onChange={(e) => setSettingsForm({ ...settingsForm, currencySymbol: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academic Session / Year
                  </label>
                  <input
                    type="text"
                    value={settingsForm.academicYear}
                    onChange={(e) => setSettingsForm({ ...settingsForm, academicYear: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Receipt Prefix
                  </label>
                  <input
                    type="text"
                    value={settingsForm.receiptPrefix}
                    onChange={(e) => setSettingsForm({ ...settingsForm, receiptPrefix: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Principal Name
                  </label>
                  <input
                    type="text"
                    value={settingsForm.principalName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, principalName: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Founder & Director
                  </label>
                  <input
                    type="text"
                    value={settingsForm.directorName || settingsForm.founderName || ''}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        directorName: e.target.value,
                        founderName: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Save Institute Settings
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: BACKUP & RESET */}
          {activeTab === 'backup' && (
            <div className="space-y-6 text-sm">
              {/* Export Backup */}
              <div className="rounded-xl border border-slate-200 p-5 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-900">Download Full Database Backup</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Exports students, classes, payments, attendance records, and settings to a secure
                    JSON file.
                  </p>
                </div>
                <button
                  onClick={() => StorageService.downloadJsonBackup()}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup (.json)</span>
                </button>
              </div>

              {/* Restore Backup */}
              <div className="rounded-xl border border-slate-200 p-5 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-900">Restore Database from Backup</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload a previously saved .json backup file to restore records.
                  </p>
                </div>
                <label className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 shrink-0">
                  <Upload className="w-4 h-4" />
                  <span>Select JSON File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileRestore}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Demo vs Fresh Institute Buttons */}
              <div className="rounded-xl border border-slate-200 p-5 bg-white space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">Institutional Data Lifecycle</h4>

                <div className="grid grid-cols-1 gap-4">
                  {/* Clean Fresh Institute */}
                  <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block mb-1">
                        Start Fresh Institute (Live Real Admissions)
                      </span>
                      <p className="text-xs text-slate-600">
                        Keeps all class and course configurations intact, and ensures all demo records remain cleared so you can enroll real students with custom timetables.
                      </p>
                    </div>
                    <button
                      onClick={handleCleanInstitute}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reset to Clean Slate</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Security Status Header */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950">
                  <span className="font-bold text-sm block mb-0.5">Campus Security Engine: Enforced</span>
                  All server endpoints, student records, fee receipts, and database operations are secured with session tokens and role-based access control. Public self-registration is permanently disabled.
                </div>
              </div>

              {/* Registered Staff Accounts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Authorized Personnel & Role Roster</h4>
                  <span className="text-[11px] font-semibold text-slate-500">Public Registration: DISABLED</span>
                </div>

                <div className="space-y-2">
                  {db.users.map((u) => (
                    <div
                      key={u.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                            u.role === 'admin'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : u.role === 'teacher'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {u.role === 'admin' ? 'A' : u.role === 'teacher' ? 'T' : '$'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">{u.name}</div>
                          <div className="text-slate-500 text-[11px]">{u.email} · {u.department || 'AUI Campus'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                            u.role === 'admin'
                              ? 'bg-amber-100 text-amber-900'
                              : u.role === 'teacher'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {u.role === 'admin' ? 'Executive Admin' : u.role === 'teacher' ? 'Faculty / Teacher' : 'Accountant'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Standards Summary */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs text-slate-600">
                <span className="font-bold text-slate-900 block">Security Protocols in Effect:</span>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong>Scrypt Cryptographic Hashing:</strong> Passwords are never stored in plaintext.</li>
                  <li><strong>Server-authoritative Verification:</strong> APIs verify active session tokens on each request.</li>
                  <li><strong>Teacher Role Guard:</strong> Faculty accounts are strictly restricted from seeing fee balances or financial ledgers.</li>
                  <li><strong>Administrative Exclusivity:</strong> Database resets, raw backups, and system settings are strictly accessible only by Administrator.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
