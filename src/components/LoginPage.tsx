import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { AuthService } from '../services/auth';
import {
  ShieldCheck,
  GraduationCap,
  DollarSign,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Building2,
  Phone,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  onLoginSuccess: (user: User) => void;
  logoUrl?: string;
}

export const LoginPage: React.FC<Props> = ({ onLoginSuccess, logoUrl }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [email, setEmail] = useState('admin@auiinstitute.edu.pk');
  const [password, setPassword] = useState('Admin@Aui2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const roleConfigs = {
    admin: {
      title: 'Administrator',
      subtitle: 'Executive Office & Management',
      badge: 'Full Executive Access',
      defaultEmail: 'admin@auiinstitute.edu.pk',
      defaultPass: 'Admin@Aui2026!',
      icon: ShieldCheck,
      color: 'border-amber-500 bg-amber-500/10 text-amber-400',
      activeTabColor: 'bg-amber-500 text-slate-950 font-bold',
      desc: 'Complete control: admissions, fee structures, financial records, examinations, staff salaries, system settings, and backups.',
    },
    teacher: {
      title: 'Teacher / Faculty',
      subtitle: 'Academic Wing & Instructors',
      badge: 'Academic Register Only',
      defaultEmail: 'usman.ali@auiinstitute.edu.pk',
      defaultPass: 'Teacher@Aui2026!',
      icon: GraduationCap,
      color: 'border-blue-500 bg-blue-500/10 text-blue-400',
      activeTabColor: 'bg-blue-600 text-white font-bold',
      desc: 'Academic tools: student roll rosters, daily attendance, class schedules, exam marks, and spoken English batches. Financials are protected.',
    },
    accountant: {
      title: 'Accountant / Bursar',
      subtitle: 'Accounts & Fee Collection Office',
      badge: 'Financial & Ledger Access',
      defaultEmail: 'accounts@auiinstitute.edu.pk',
      defaultPass: 'Accountant@Aui2026!',
      icon: DollarSign,
      color: 'border-emerald-500 bg-emerald-500/10 text-emerald-400',
      activeTabColor: 'bg-emerald-600 text-white font-bold',
      desc: 'Fee collections, issuing thermal & A4 receipts, student dues, fee arrears, daily collection ledger, and staff payroll payments.',
    },
  };

  const handleRoleTabChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    setEmail(roleConfigs[role].defaultEmail);
    setPassword(roleConfigs[role].defaultPass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your institute email or username.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await AuthService.login(email, password);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Connection failure. Please check your network.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070F1B] text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* Top Institute Header Banner */}
      <header className="border-b border-slate-800 bg-[#0B192C]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logoUrl || '/assets/aistudio/adsas_4f29c8b1.jpg'}
              alt="AUI Logo"
              className="w-10 h-10 rounded-full object-contain bg-white border border-amber-400/40 shadow-xs"
            />
            <div>
              <div className="text-sm sm:text-base font-extrabold tracking-tight text-white uppercase leading-tight">
                Anwaar-Ul-Islam Technical Institute
              </div>
              <div className="text-[11px] text-amber-400 font-semibold tracking-wider uppercase">
                Haveli Lakha, District Okara · Powered by AUI Digi
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              0312-1266130 / 0329-8294648
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              People Chowk, Haveli Lakha
            </span>
          </div>
        </div>
      </header>

      {/* Main Login Workspace */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl">
          {/* Main Card */}
          <div className="rounded-3xl bg-[#0E1F35] border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Card Header */}
            <div className="p-6 sm:p-8 border-b border-slate-800 bg-linear-to-b from-slate-900/60 to-transparent">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide">
                  <Lock className="w-3.5 h-3.5" />
                  SECURE AUTHENTICATION GATEWAY
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Session v3.2</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Institute Management Portal
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                Sign in with authorized credentials to manage admissions, student records, fee collection, and institute operations.
              </p>

              {/* Role Selection Tabs */}
              <div className="mt-6 grid grid-cols-3 gap-2 p-1.5 bg-slate-950/60 rounded-2xl border border-slate-800">
                {(['admin', 'teacher', 'accountant'] as UserRole[]).map((r) => {
                  const cfg = roleConfigs[r];
                  const Icon = cfg.icon;
                  const isActive = selectedRole === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleTabChange(r)}
                      className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition text-center ${
                        isActive
                          ? cfg.activeTabColor + ' shadow-md scale-100'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span className="text-xs font-bold leading-tight">{cfg.title.split(' ')[0]}</span>
                      <span className="text-[10px] opacity-80 hidden sm:inline">{cfg.title.split(' ')[1] || 'Role'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
              {/* Role Scope Notice */}
              <div className={`p-3.5 rounded-xl border text-xs leading-normal flex items-start gap-3 ${roleConfigs[selectedRole].color}`}>
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">{roleConfigs[selectedRole].title} Scope</div>
                  <div className="opacity-90 mt-0.5">{roleConfigs[selectedRole].desc}</div>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Email / Username */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Email Address / Username
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@auiinstitute.edu.pk"
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-700 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400/20 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400">Encrypted with scrypt</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-700 pl-10 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400/20 transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-6 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-sm hover:bg-amber-400 active:scale-98 transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Credentials & Starting Session...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In as {roleConfigs[selectedRole].title}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick autofill helper */}
              <div className="pt-3 border-t border-slate-800/80">
                <div className="text-[11px] text-slate-400 mb-2 font-medium flex items-center justify-between">
                  <span>Quick-fill authorized credentials:</span>
                  <span className="text-amber-400/80">One-click testing</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['admin', 'teacher', 'accountant'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleTabChange(r)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                        selectedRole === r
                          ? 'border-amber-400/60 bg-amber-500/20 text-amber-300'
                          : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      {roleConfigs[r].title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Security policy note: Registration Disabled */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Public registration disabled:</strong> Student rosters and staff access are strictly managed by the Campus Administrator.
                </span>
              </div>
            </form>
          </div>

          {/* Footer Institute Credits */}
          <div className="mt-6 text-center text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-400">
              Anwaar-ul-Islam Technical Institute · Established under the Patronage of Professor Muhammad Anwaar Rizvi (R.A)
            </p>
            <p className="text-[11px]">
              Principal: Hafiz Israr Ahmad Rizvi · System Architect: AUI Digi Agency
            </p>
          </div>
        </div>
      </main>

      {/* Footer bar */}
      <footer className="border-t border-slate-900 py-3 text-center text-[11px] text-slate-500">
        &copy; {new Date().getFullYear()} Anwaar-ul-Islam Technical Institute. All rights reserved. Secure server session enabled.
      </footer>
    </div>
  );
};
