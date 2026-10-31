import React from 'react';
import { DatabaseState, UserRole } from '../types';
import { StorageService } from '../services/storage';
import { 
  Users, 
  CalendarCheck, 
  DollarSign, 
  AlertCircle, 
  ArrowUpRight, 
  Plus, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  GraduationCap,
  Sparkles,
  Monitor,
  Mic,
  Award,
  CreditCard,
  FileCheck,
  MessageCircle,
} from 'lucide-react';
import { FeePayment } from '../types';

interface Props {
  db: DatabaseState;
  role: UserRole;
  onNavigate: (tab: string) => void;
  onOpenReceipt: (paymentId: string) => void;
  onQuickCollectFee: (studentId?: string) => void;
  onShareWhatsApp?: (payment: FeePayment) => void;
}

export const DashboardView: React.FC<Props> = ({
  db,
  role,
  onNavigate,
  onOpenReceipt,
  onQuickCollectFee,
  onShareWhatsApp,
}) => {
  const { students, payments, attendance, classes, settings, exams } = db;

  const activeStudents = students.filter((s) => s.status === 'active');
  const totalStudents = students.length;

  // Breakdown by wings
  const academicStudents = students.filter((s) => s.programType === 'academic');
  const computerStudents = students.filter((s) => s.programType === 'computer_vocational');
  const englishStudents = students.filter((s) => s.programType === 'spoken_english');

  // Today's attendance
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter((a) => a.date === today);
  const presentToday = todayAttendance.filter((a) => a.status === 'present').length;
  const absentToday = todayAttendance.filter((a) => a.status === 'absent').length;
  const leaveToday = todayAttendance.filter((a) => a.status === 'leave').length;
  const attendanceRate =
    todayAttendance.length > 0
      ? Math.round((presentToday / todayAttendance.length) * 100)
      : 0;

  // Monthly fees collected
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const currentMonthPayments = payments.filter((p) => {
    return (
      p.billingMonth.toLowerCase().includes(currentMonth.toLowerCase()) ||
      p.paymentDate.startsWith(today.slice(0, 7))
    );
  });
  const feesCollectedThisMonth = currentMonthPayments.reduce(
    (sum, p) => sum + Number(p.amountPaid || 0),
    0
  );

  // Total outstanding fees
  let totalOutstanding = 0;
  let defaultersCount = 0;
  activeStudents.forEach((student) => {
    const financials = StorageService.getStudentFinancials(student.id, db);
    if (financials.outstandingBalance > 0) {
      totalOutstanding += financials.outstandingBalance;
      defaultersCount++;
    }
  });

  // Recent payments
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.createdAt || b.paymentDate).getTime() - new Date(a.createdAt || a.paymentDate).getTime())
    .slice(0, 6);

  const isTeacher = role === 'teacher';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0B192C] via-[#152e4d] to-[#0B192C] p-6 sm:p-8 text-white shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Operational Console · Haveli Lakha, Okara</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                role === 'admin'
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                  : role === 'teacher'
                  ? 'bg-blue-400/20 text-blue-300 border-blue-400/30'
                  : 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30'
              }`}>
                {role === 'admin'
                  ? 'ADMINISTRATOR EXECUTIVE ACCESS'
                  : role === 'teacher'
                  ? 'FACULTY ACADEMIC CONSOLE'
                  : 'ACCOUNTANT FINANCIAL CONSOLE'}
              </span>
              {settings.isDemoMode && (
                <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded text-[10px] font-mono border border-amber-400/30">
                  DEMO ACTIVE
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {settings.name}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              School, College, Computer Academy & Spoken English Center · Session {settings.academicYear} ·{' '}
              <span className="text-amber-400 font-semibold">Powered by {settings.poweredBy}</span>
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {!isTeacher && (
              <button
                onClick={() => onQuickCollectFee()}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 hover:bg-amber-400 shadow-md active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Collect Fee</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('attendance')}
              className="flex items-center gap-2 rounded-xl bg-slate-800/90 border border-slate-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-700 active:scale-95 transition"
            >
              <CalendarCheck className="w-4 h-4 text-amber-400" />
              <span>Attendance</span>
            </button>

            <button
              onClick={() => onNavigate('spoken_english')}
              className="flex items-center gap-2 rounded-xl bg-slate-800/90 border border-slate-700 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition"
            >
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>Spoken English</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Statistic Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Students */}
        <div
          onClick={() => onNavigate('students')}
          className="cursor-pointer rounded-xl bg-white p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Enrolled</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {totalStudents}
            </span>
            <span className="text-xs text-slate-500 font-medium">Candidates</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-blue-700">{academicStudents.length} Academic</span>
            <span>·</span>
            <span className="font-semibold text-amber-700">{computerStudents.length} IT Academy</span>
            <span>·</span>
            <span className="font-semibold text-emerald-700">{englishStudents.length} Spoken Eng</span>
          </div>
        </div>

        {/* Card 2: Today's Attendance */}
        <div
          onClick={() => onNavigate('attendance')}
          className="cursor-pointer rounded-xl bg-white p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Present Today</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {presentToday}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              / {todayAttendance.length} marked ({attendanceRate}%)
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="text-rose-600 font-semibold">{absentToday} Absent</span>
            <span>·</span>
            <span>{leaveToday} On Leave</span>
          </div>
        </div>

        {/* Card 3: Fee Collected (Hidden for Teachers) */}
        {!isTeacher ? (
          <div
            onClick={() => onNavigate('fees')}
            className="cursor-pointer rounded-xl bg-white p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Collected ({currentMonth.split(' ')[0]})</span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold text-slate-600">{settings.currencySymbol}</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                {feesCollectedThisMonth.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
              <span className="text-emerald-600 font-semibold">{currentMonthPayments.length} receipts</span>
              <span>·</span>
              <span>Cleared this month</span>
            </div>
          </div>
        ) : (
          <div
            onClick={() => onNavigate('exams')}
            className="cursor-pointer rounded-xl bg-white p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Examinations & Tests</span>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                <FileCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                {exams.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">Evaluated</span>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Subject results & report cards
            </div>
          </div>
        )}

        {/* Card 4: Outstanding Fees (Hidden for Teachers) */}
        {!isTeacher ? (
          <div
            onClick={() => onNavigate('reports')}
            className="cursor-pointer rounded-xl bg-white p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Outstanding Dues</span>
              <div className="p-2 rounded-lg bg-rose-50 text-rose-700">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold text-slate-600">{settings.currencySymbol}</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-mono tabular-nums">
                {totalOutstanding.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
              <span className="text-rose-600 font-semibold">{defaultersCount} Students</span>
              <span>·</span>
              <span>Pending fee settlement</span>
            </div>
          </div>
        ) : (
          <div
            onClick={() => onNavigate('classes')}
            className="cursor-pointer rounded-xl bg-white p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Classes & Courses</span>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                {classes.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">Programs</span>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              School, IT & Spoken English
            </div>
          </div>
        )}
      </div>

      {/* Program Wings Quick Cards Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Academic Card */}
        <div
          onClick={() => onNavigate('classes')}
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs cursor-pointer hover:border-slate-300 transition"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">School & College Wing</h4>
              <span className="text-xs text-slate-500">Class 5 to Matric, FA, FSc, ICS, BA</span>
            </div>
          </div>
          <div className="mt-3 flex justify-between items-center text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span>Enrolled Students:</span>
            <strong className="text-slate-950 font-mono text-sm">{academicStudents.length}</strong>
          </div>
        </div>

        {/* Computer Academy Card */}
        <div
          onClick={() => onNavigate('classes')}
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs cursor-pointer hover:border-slate-300 transition"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Computer Academy & IT</h4>
              <span className="text-xs text-slate-500">DIT, Graphic Design, Web, Office, SEO</span>
            </div>
          </div>
          <div className="mt-3 flex justify-between items-center text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span>Enrolled Students:</span>
            <strong className="text-slate-950 font-mono text-sm">{computerStudents.length}</strong>
          </div>
        </div>

        {/* Spoken English Card */}
        <div
          onClick={() => onNavigate('spoken_english')}
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs cursor-pointer hover:border-slate-300 transition"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Spoken English Center</h4>
              <span className="text-xs text-slate-500">Foundation, Fluency & IELTS Batches</span>
            </div>
          </div>
          <div className="mt-3 flex justify-between items-center text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span>Enrolled Students:</span>
            <strong className="text-slate-950 font-mono text-sm">{englishStudents.length}</strong>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Payments & Class Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {!isTeacher ? (
          <div className="lg:col-span-2 rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Recent Institutional Receipts</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latest tuition, admission, and course fee payments received
                </p>
              </div>
              <button
                onClick={() => onNavigate('fees')}
                className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1 transition"
              >
                <span>View Full Ledger</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Receipt</th>
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Program / Class</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-slate-900 block">
                          {p.receiptNumber}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">{p.paymentDate}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{p.studentName}</span>
                        <span className="text-[11px] text-slate-500">S/O {p.fatherName}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        <span className="truncate max-w-[150px] block" title={p.className}>
                          {p.className}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums">
                        {settings.currencySymbol} {p.amountPaid.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {p.balanceRemaining > 0 ? (
                          <span className="text-amber-700 font-semibold">
                            {settings.currencySymbol} {p.balanceRemaining.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium">Cleared</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {onShareWhatsApp && (
                            <button
                              type="button"
                              onClick={() => onShareWhatsApp(p)}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
                              title="Send Full Receipt on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onOpenReceipt(p.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                            title="Print official receipt"
                          >
                            <Receipt className="w-3.5 h-3.5 text-amber-600" />
                            <span>Receipt</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {recentPayments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No payments recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 rounded-xl bg-white border border-slate-200 shadow-xs p-6">
            <h3 className="font-bold text-slate-900 text-base mb-2">Faculty Hub & Student Evaluations</h3>
            <p className="text-xs text-slate-500 mb-6">
              Welcome, Faculty Member. As designated faculty, financial ledgers are restricted.
              You have full access to student rosters, daily roll call, examinations marks, and viva assessments.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => onNavigate('attendance')}
                className="p-5 rounded-xl border border-slate-200 hover:border-amber-400/50 hover:bg-amber-50/30 transition cursor-pointer"
              >
                <CalendarCheck className="w-8 h-8 text-amber-500 mb-3" />
                <h4 className="font-bold text-slate-900 text-sm">Mark Daily Roll Call</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Take daily attendance by class, course, or batch timing.
                </p>
              </div>
              <div
                onClick={() => onNavigate('exams')}
                className="p-5 rounded-xl border border-slate-200 hover:border-amber-400/50 hover:bg-amber-50/30 transition cursor-pointer"
              >
                <FileCheck className="w-8 h-8 text-blue-600 mb-3" />
                <h4 className="font-bold text-slate-900 text-sm">Examinations & Marks</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Enter student examination marks and generate official report cards.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Right Col: Today's Class Roll Call summary */}
        <div className="rounded-xl bg-white border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">Today's Class Roll Call</h3>
              <span className="text-xs text-slate-500 font-mono">{today}</span>
            </div>

            <div className="mt-4 space-y-3">
              {classes.slice(0, 5).map((cls) => {
                const classStudents = activeStudents.filter((s) => s.classId === cls.id);
                const classAtt = todayAttendance.filter((a) => a.classId === cls.id);
                const markedPresent = classAtt.filter((a) => a.status === 'present').length;
                const isMarked = classAtt.length > 0;

                return (
                  <div key={cls.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-900 text-xs truncate max-w-[170px]">
                        {cls.name}
                      </span>
                      {isMarked ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Marked ({markedPresent}/{classStudents.length})
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{cls.shiftTiming}</span>
                      <span>Teacher: {cls.assignedTeacherName || 'Faculty'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onNavigate('attendance')}
            className="mt-5 w-full rounded-lg bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            Open Attendance Module
          </button>
        </div>
      </div>
    </div>
  );
};
