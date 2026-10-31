/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DatabaseState, FeePayment, UserRole, Student, ClassCourse, ExamResult, User } from './types';
import { initialDatabase } from './data/initialData';
import { StorageService } from './services/storage';
import { AuthService } from './services/auth';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { PWAInstallButton } from './components/PWAInstallButton';
import { PrintableReceipt } from './components/PrintableReceipt';
import { PrintableResultCard } from './components/PrintableResultCard';
import { DashboardView } from './components/DashboardView';
import { StudentsView } from './components/StudentsView';
import { FeeManagementView } from './components/FeeManagementView';
import { AttendanceView } from './components/AttendanceView';
import { ClassesView } from './components/ClassesView';
import { SpokenEnglishView } from './components/SpokenEnglishView';
import { ExamsView } from './components/ExamsView';
import { StaffView } from './components/StaffView';
import { CertificatesAndIdCardsView } from './components/CertificatesAndIdCardsView';
import { ReportsView } from './components/ReportsView';
import { SettingsAndDeploymentModal } from './components/SettingsAndDeploymentModal';
import { LoginModal } from './components/LoginModal';
import { LoginPage } from './components/LoginPage';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { WhatsAppReceiptModal } from './components/WhatsAppReceiptModal';

import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarCheck,
  GraduationCap,
  FileText,
  Settings,
  UserCheck,
  Menu,
  X,
  Mic,
  FileCheck,
  Briefcase,
  Award,
  WifiOff,
  LogOut,
  KeyRound,
  Shield,
} from 'lucide-react';

export default function App() {
  const isOnline = useOnlineStatus();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Database State
  const [db, setDb] = useState<DatabaseState>(initialDatabase);
  const [isLoading, setIsLoading] = useState(true);

  // Active Role: 'admin' | 'teacher' | 'accountant'
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Mobile Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [activeReceiptPayment, setActiveReceiptPayment] = useState<FeePayment | null>(null);
  const [activeWhatsAppPayment, setActiveWhatsAppPayment] = useState<FeePayment | null>(null);
  const [activePrintResultCard, setActivePrintResultCard] = useState<ExamResult | null>(null);
  const [prefilledStudentId, setPrefilledStudentId] = useState<string | undefined>(undefined);

  // Initialize Session and DB from persistent storage
  useEffect(() => {
    async function initSessionAndData() {
      try {
        const sessionResult = await AuthService.verifySession();
        if (sessionResult.authenticated && sessionResult.user) {
          setCurrentUser(sessionResult.user);
          setCurrentRole(sessionResult.user.role);
          const loaded = await StorageService.init();
          setDb(loaded);
        } else {
          setCurrentUser(null);
        }
      } catch (e) {
        console.error('Failed to initialize session/data:', e);
      } finally {
        setIsAuthChecking(false);
        setIsLoading(false);
      }
    }
    initSessionAndData();
  }, []);

  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    setIsLoading(true);
    try {
      const loaded = await StorageService.init();
      setDb(loaded);
    } catch (e) {
      console.error('Failed to load data on login:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setCurrentUser(null);
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    setActiveTab('dashboard');
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    if (currentUser) {
      setCurrentUser({ ...currentUser, role });
    }
    setIsLoginOpen(false);
  };

  // Update DB handler
  const handleUpdateDb = (newDb: DatabaseState) => {
    setDb({ ...newDb });
  };

  // Quick action: Open fee collection for a student
  const handleQuickCollectFee = (studentId?: string) => {
    if (currentRole === 'teacher') return;
    setPrefilledStudentId(studentId);
    setActiveTab('fees');
  };

  // Open official receipt modal
  const handleOpenReceipt = (paymentId: string) => {
    const payment = db.payments.find((p) => p.id === paymentId);
    if (payment) {
      setActiveReceiptPayment(payment);
    }
  };

  // Open WhatsApp receipt modal
  const handleShareWhatsApp = (payment: FeePayment) => {
    setActiveWhatsAppPayment(payment);
  };

  // Navigation Items according to Role
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      allowed: ['admin', 'teacher', 'accountant'],
    },
    {
      id: 'students',
      label: 'Admissions',
      icon: Users,
      allowed: ['admin', 'teacher', 'accountant'],
    },
    {
      id: 'fees',
      label: 'Fee Management',
      icon: CreditCard,
      allowed: ['admin', 'accountant'], // Strictly hidden for Teachers
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: CalendarCheck,
      allowed: ['admin', 'teacher', 'accountant'],
    },
    {
      id: 'spoken_english',
      label: 'Spoken English',
      icon: Mic,
      allowed: ['admin', 'teacher', 'accountant'],
    },
    {
      id: 'classes',
      label: 'Programs & Courses',
      icon: GraduationCap,
      allowed: ['admin', 'teacher', 'accountant'],
    },
    {
      id: 'exams',
      label: 'Exams & Results',
      icon: FileCheck,
      allowed: ['admin', 'teacher', 'accountant'],
    },
    {
      id: 'staff',
      label: 'Teachers & Staff',
      icon: Briefcase,
      allowed: ['admin', 'teacher', 'accountant'],
    },
    {
      id: 'certificates',
      label: 'Certificates & IDs',
      icon: Award,
      allowed: ['admin', 'teacher', 'accountant'],
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      allowed: ['admin', 'teacher', 'accountant'],
    },
  ];

  const visibleNavItems = navigationItems.filter((item) =>
    item.allowed.includes(currentRole)
  );

  // If user is a teacher and was on fees tab, redirect to dashboard
  useEffect(() => {
    if (currentRole === 'teacher' && activeTab === 'fees') {
      setActiveTab('dashboard');
    }
  }, [currentRole, activeTab]);

  // 1. Splash check while authenticating session
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#070F1B] flex flex-col items-center justify-center text-white p-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center mb-4 shadow-xl shadow-amber-500/20">
          AUI
        </div>
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-amber-400 border-r-transparent mb-3" />
        <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest text-center">
          Verifying Campus Security Credentials...
        </p>
      </div>
    );
  }

  // 2. If not authenticated, render dedicated Admin & Staff Login Page
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        logoUrl={db.settings.logoUrl}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Offline Status Warning Bar */}
      {!isOnline && (
        <div className="no-print bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-semibold text-center flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode Active · Changes are safely preserved locally in your browser</span>
        </div>
      )}

      {/* Top Demo Banner (if demo mode enabled) */}
      {db.settings.isDemoMode && (
        <div className="no-print bg-slate-900 border-b border-amber-500/20 px-4 py-1.5 text-[11px] text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <span className="bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded text-[10px]">
              DEMO MODE
            </span>
            <span>
              Anwaar-ul-Islam Technical Institute, Haveli Lakha · Sample academic, IT & English batches active.
            </span>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="hidden sm:inline-flex items-center gap-1 font-semibold text-amber-400 hover:text-amber-300 transition"
          >
            <span>Clear Demo & Deploy Free</span>
            <span>&rarr;</span>
          </button>
        </div>
      )}

      {/* Main Top Navigation Bar */}
      <header className="no-print sticky top-0 z-40 bg-[#0B192C] text-white border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Brand Zone */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
              aria-label="Open navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('dashboard');
              }}
              className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group"
            >
              <img
                src={db.settings.logoUrl || '/assets/aistudio/adsas_4f29c8b1.jpg'}
                alt="AUI Logo"
                className="w-9 h-9 rounded-full object-contain border border-amber-400/40 shadow-xs group-hover:scale-105 transition shrink-0 bg-white"
              />
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-extrabold tracking-tight text-white leading-tight uppercase">
                  Anwaar-Ul-Islam
                </span>
                <span className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">
                  Technical Institute · Haveli Lakha
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 text-xs font-semibold text-slate-300">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-slate-800 text-amber-400 font-bold'
                      : 'hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Primary Actions & User Session */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <PWAInstallButton compact />

            {/* Authenticated User Profile Pill & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 rounded-xl bg-slate-800/90 border border-slate-700/80 px-2.5 py-1.5 text-xs text-slate-200 hover:text-white hover:bg-slate-700 transition"
                title={`${currentUser.name} (${currentUser.role})`}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center font-extrabold text-[10px] ${
                    currentRole === 'admin'
                      ? 'bg-amber-500 text-slate-950'
                      : currentRole === 'teacher'
                      ? 'bg-blue-500 text-white'
                      : 'bg-emerald-500 text-white'
                  }`}
                >
                  {currentRole === 'admin' ? 'A' : currentRole === 'teacher' ? 'T' : '$'}
                </div>
                <div className="flex flex-col text-left leading-tight hidden md:block">
                  <span className="font-bold text-white text-[11px] truncate max-w-[120px]">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-amber-400 capitalize font-medium">
                    {currentRole === 'admin'
                      ? 'Admin'
                      : currentRole === 'teacher'
                      ? 'Faculty'
                      : 'Accountant'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">▼</span>
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0B192C] border border-slate-700 shadow-2xl py-2 z-50 text-xs text-slate-200">
                  <div className="px-3.5 py-2 border-b border-slate-800">
                    <p className="font-bold text-white truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {currentRole === 'admin'
                        ? 'Administrator'
                        : currentRole === 'teacher'
                        ? 'Faculty Member'
                        : 'Accountant'}
                    </span>
                  </div>

                  {/* Switch Role option for testing if admin */}
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsLoginOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2 flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800 transition"
                    >
                      <UserCheck className="w-4 h-4 text-amber-400" />
                      <span>Switch Role View</span>
                    </button>
                  )}

                  {/* Change Password button */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsChangePasswordOpen(true);
                    }}
                    className="w-full text-left px-3.5 py-2 flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Change Password</span>
                  </button>

                  <div className="border-t border-slate-800 my-1" />

                  {/* Logout button */}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3.5 py-2 flex items-center gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Settings Button: STRICTLY ADMIN ONLY */}
            {currentRole === 'admin' && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Campus Settings & Security"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile / Tablet Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-800 bg-[#0B192C] px-4 py-3 space-y-1">
            <div className="grid grid-cols-2 gap-1 mb-2">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              {currentRole === 'admin' ? (
                <button
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 text-slate-300 hover:text-white py-1"
                >
                  <Settings className="w-4 h-4 text-amber-400" />
                  <span>Institute Settings</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsChangePasswordOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 text-slate-300 hover:text-white py-1"
                >
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Change Password</span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-rose-400 font-semibold py-1 hover:text-rose-300"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent align-[-0.125em]" />
            <p className="mt-4 text-sm font-semibold text-slate-600">
              Loading Anwaar-ul-Islam Technical Institute records...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                db={db}
                role={currentRole}
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenReceipt={handleOpenReceipt}
                onQuickCollectFee={handleQuickCollectFee}
                onShareWhatsApp={handleShareWhatsApp}
              />
            )}

            {activeTab === 'students' && (
              <StudentsView
                db={db}
                role={currentRole}
                onUpdateDb={handleUpdateDb}
                onQuickCollectFee={handleQuickCollectFee}
                onViewIdCard={(student) => {
                  setActiveTab('certificates');
                }}
              />
            )}

            {activeTab === 'fees' && currentRole !== 'teacher' && (
              <FeeManagementView
                db={db}
                role={currentRole}
                initialStudentId={prefilledStudentId}
                onUpdateDb={handleUpdateDb}
                onOpenReceipt={handleOpenReceipt}
                onShareWhatsApp={handleShareWhatsApp}
              />
            )}

            {activeTab === 'attendance' && (
              <AttendanceView
                db={db}
                role={currentRole}
                onUpdateDb={handleUpdateDb}
              />
            )}

            {activeTab === 'spoken_english' && (
              <SpokenEnglishView
                db={db}
                role={currentRole}
                onUpdateDb={handleUpdateDb}
                onQuickCollectFee={handleQuickCollectFee}
                onIssueCertificate={(student, course) => {
                  setActiveTab('certificates');
                }}
                onPrintResultCard={(exam) => {
                  setActivePrintResultCard(exam);
                }}
              />
            )}

            {activeTab === 'classes' && (
              <ClassesView
                db={db}
                role={currentRole}
                onUpdateDb={handleUpdateDb}
                onNavigateToStudents={(classId) => {
                  setActiveTab('students');
                }}
              />
            )}

            {activeTab === 'exams' && (
              <ExamsView
                db={db}
                role={currentRole}
                onUpdateDb={handleUpdateDb}
                onPrintResultCard={(exam) => {
                  setActivePrintResultCard(exam);
                }}
              />
            )}

            {activeTab === 'staff' && (
              <StaffView
                db={db}
                role={currentRole}
                onUpdateDb={handleUpdateDb}
              />
            )}

            {activeTab === 'certificates' && (
              <CertificatesAndIdCardsView
                db={db}
                role={currentRole}
                onUpdateDb={handleUpdateDb}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                db={db}
                role={currentRole}
                onOpenReceipt={handleOpenReceipt}
                onQuickCollectFee={handleQuickCollectFee}
                onShareWhatsApp={handleShareWhatsApp}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Phones) */}
      <nav className="no-print xl:hidden sticky bottom-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {visibleNavItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-1.5 rounded-lg text-[10px] font-semibold transition ${
                isActive ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>

      {/* Quiet Footer */}
      <footer className="no-print border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">ANWAAR-UL-ISLAM TECHNICAL INSTITUTE</span>
            <span>·</span>
            <span>Near Rubina Shaheen Medical Complex, People Chowk, Haveli Lakha, Okara</span>
            <span>·</span>
            <span className="font-semibold text-amber-700">Powered by AUI Digi</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-slate-800 transition"
            >
              Deployment & Backups
            </button>
            <span>·</span>
            <button
              onClick={() => StorageService.downloadJsonBackup()}
              className="hover:text-slate-800 transition"
            >
              Download Full Backup (.json)
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Official Printable Receipt Modal */}
      {activeReceiptPayment && (
        <PrintableReceipt
          payment={activeReceiptPayment}
          student={db.students.find((s) => s.id === activeReceiptPayment.studentId)}
          settings={db.settings}
          onClose={() => setActiveReceiptPayment(null)}
          onShareWhatsApp={(p) => {
            setActiveReceiptPayment(null);
            handleShareWhatsApp(p);
          }}
        />
      )}

      {/* 1b. Full Fee Receipt WhatsApp & SMS Sharing Modal */}
      {activeWhatsAppPayment && (
        <WhatsAppReceiptModal
          isOpen={!!activeWhatsAppPayment}
          payment={activeWhatsAppPayment}
          student={db.students.find((s) => s.id === activeWhatsAppPayment.studentId)}
          settings={db.settings}
          onClose={() => setActiveWhatsAppPayment(null)}
          onOpenPrintReceipt={() => {
            const p = activeWhatsAppPayment;
            setActiveWhatsAppPayment(null);
            setActiveReceiptPayment(p);
          }}
        />
      )}

      {/* 2. Official Printable Examination Result Card */}
      {activePrintResultCard && (
        <PrintableResultCard
          exam={activePrintResultCard}
          settings={db.settings}
          onClose={() => setActivePrintResultCard(null)}
        />
      )}

      {/* 3. Campus Settings & Deployment Guide Modal (Admin only) */}
      {currentRole === 'admin' && (
        <SettingsAndDeploymentModal
          db={db}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onUpdateDb={handleUpdateDb}
        />
      )}

      {/* 4. Role-Based Login & Switcher Modal */}
      <LoginModal
        users={db.users}
        currentRole={currentRole}
        isOpen={isLoginOpen}
        onLogin={handleRoleChange}
        onClose={() => setIsLoginOpen(false)}
      />

      {/* 5. Secure Change Password Modal */}
      {currentUser && (
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          userEmail={currentUser.email}
        />
      )}
    </div>
  );
}
