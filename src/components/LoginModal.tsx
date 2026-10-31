import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ShieldCheck, UserCheck, Lock, GraduationCap, DollarSign, ArrowRight } from 'lucide-react';

interface Props {
  users: User[];
  currentRole: UserRole;
  isOpen: boolean;
  onLogin: (role: UserRole) => void;
  onClose: () => void;
}

export const LoginModal: React.FC<Props> = ({
  users,
  currentRole,
  isOpen,
  onLogin,
  onClose,
}) => {
  if (!isOpen) return null;

  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('aui123');

  const roleDescriptions = {
    admin: {
      title: 'Administrator',
      desc: 'Full system access: student admissions, fee structures, financial ledgers, reports, staff & backup controls.',
      badge: 'Full Executive Access',
      icon: ShieldCheck,
      color: 'border-amber-400 bg-amber-50/40 text-amber-900',
    },
    teacher: {
      title: 'Teacher / Faculty',
      desc: 'Student rosters, daily roll call, and attendance registers. Financial reports and fee details are strictly protected.',
      badge: 'Academic Only (No Financials)',
      icon: GraduationCap,
      color: 'border-blue-400 bg-blue-50/40 text-blue-900',
    },
    accountant: {
      title: 'Accountant / Bursar',
      desc: 'Fee collections, issuing receipts, balance calculations, daily/monthly revenue reports, and defaulter tracking.',
      badge: 'Financial & Ledger Access',
      icon: DollarSign,
      color: 'border-emerald-400 bg-emerald-50/40 text-emerald-900',
    },
  };

  const handleSelectAndLogin = (role: UserRole) => {
    onLogin(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header Banner */}
        <div className="bg-slate-900 p-6 text-white text-center border-b border-slate-800">
          <div className="mx-auto w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold text-xl mb-3 shadow-md">
            AUI
          </div>
          <h3 className="text-xl font-extrabold text-white">AUI Campus Manager</h3>
          <p className="text-xs text-slate-400 mt-1">
            Role-Based Authentication · Developed by AUI Digi Agency
          </p>
        </div>

        {/* Role Selection Grid */}
        <div className="p-6 space-y-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Choose Your Operational Role
          </div>

          <div className="space-y-3">
            {(['admin', 'teacher', 'accountant'] as UserRole[]).map((r) => {
              const info = roleDescriptions[r];
              const Icon = info.icon;
              const isSelected = selectedRole === r;

              return (
                <div
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3.5 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-lg shrink-0 ${
                      r === 'admin'
                        ? 'bg-amber-100 text-amber-800'
                        : r === 'teacher'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">{info.title}</h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {info.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-normal">{info.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Login Action Button */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-2"
            >
              Continue as Current
            </button>
            <button
              type="button"
              onClick={() => handleSelectAndLogin(selectedRole)}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 active:scale-95 transition shadow-sm"
            >
              <span>Sign In as {roleDescriptions[selectedRole].title}</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
