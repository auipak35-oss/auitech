import React, { useState, useMemo } from 'react';
import { DatabaseState, UserRole } from '../types';
import { StorageService, CSVUtils } from '../services/storage';
import {
  FileText,
  AlertTriangle,
  Download,
  Printer,
  Search,
  Calendar,
  Users,
  DollarSign,
  CheckCircle,
  Eye,
  Filter,
  MessageCircle,
} from 'lucide-react';
import { FeePayment } from '../types';

interface Props {
  db: DatabaseState;
  role: UserRole;
  onOpenReceipt: (paymentId: string) => void;
  onQuickCollectFee: (studentId: string) => void;
  onShareWhatsApp?: (payment: FeePayment) => void;
}

export const ReportsView: React.FC<Props> = ({
  db,
  role,
  onOpenReceipt,
  onQuickCollectFee,
  onShareWhatsApp,
}) => {
  const { students, payments, attendance, classes, settings } = db;
  const isTeacher = role === 'teacher';

  // Report category tabs
  const availableTabs = useMemo(() => {
    if (isTeacher) {
      return [
        { id: 'students', label: 'Student Directory' },
        { id: 'attendance', label: 'Attendance Reports' },
      ];
    }
    return [
      { id: 'defaulters', label: 'Unpaid Fees & Defaulters' },
      { id: 'payments', label: 'Payments History' },
      { id: 'daily_collection', label: 'Daily Collection' },
      { id: 'monthly_revenue', label: 'Monthly Revenue' },
      { id: 'students', label: 'Student Directory' },
      { id: 'attendance', label: 'Attendance Reports' },
    ];
  }, [isTeacher]);

  const [activeTab, setActiveTab] = useState<string>(
    isTeacher ? 'students' : 'defaulters'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  // Printable Notice State for Fee Defaulter
  const [printDefaulterNotice, setPrintDefaulterNotice] = useState<any | null>(null);

  // 1. Defaulters calculation
  const defaultersList = useMemo(() => {
    const list: Array<{
      id: string;
      fullName: string;
      fatherName: string;
      className: string;
      classId: string;
      phone: string;
      netMonthly: number;
      totalPaid: number;
      outstandingBalance: number;
      lastPaymentDate?: string;
    }> = [];

    students
      .filter((s) => s.status === 'active')
      .forEach((student) => {
        const financials = StorageService.getStudentFinancials(student.id, db);
        if (financials.outstandingBalance > 0) {
          const lastPayment = financials.payments[0]?.paymentDate;
          list.push({
            id: student.id,
            fullName: student.fullName,
            fatherName: student.fatherName,
            className: student.className,
            classId: student.classId,
            phone: student.phone,
            netMonthly: financials.netMonthly,
            totalPaid: financials.totalPaid,
            outstandingBalance: financials.outstandingBalance,
            lastPaymentDate: lastPayment,
          });
        }
      });

    return list.sort((a, b) => b.outstandingBalance - a.outstandingBalance);
  }, [students, db]);

  // Filtered Defaulters
  const filteredDefaulters = useMemo(() => {
    return defaultersList.filter((d) => {
      if (classFilter !== 'all' && d.classId !== classFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          d.fullName.toLowerCase().includes(q) ||
          d.fatherName.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q) ||
          d.phone.includes(q)
        );
      }
      return true;
    });
  }, [defaultersList, classFilter, searchQuery]);

  // 2. Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          p.receiptNumber.toLowerCase().includes(q) ||
          p.studentName.toLowerCase().includes(q) ||
          p.studentId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [payments, searchQuery]);

  // 3. Daily Collections
  const dailyReport = useMemo(() => {
    const map: { [date: string]: { total: number; count: number; methods: { [k: string]: number } } } = {};
    payments.forEach((p) => {
      const d = p.paymentDate;
      if (!map[d]) {
        map[d] = { total: 0, count: 0, methods: {} };
      }
      map[d].total += p.amountPaid;
      map[d].count += 1;
      map[d].methods[p.paymentMethod] = (map[d].methods[p.paymentMethod] || 0) + p.amountPaid;
    });
    return Object.entries(map).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [payments]);

  // Handle generic print
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="no-print bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <span>Institution Reports & Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Official printable fee defaulters, payment ledgers, daily collections, and rosters
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="no-print flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchQuery('');
            }}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap rounded-lg transition ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* REPORT 1: UNPAID FEES & DEFAULTERS */}
      {activeTab === 'defaulters' && !isTeacher && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="no-print grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search defaulter by name, father name, or roll..."
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-4">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
              >
                <option value="all">All Classes ({classes.length})</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 flex justify-end">
              <button
                onClick={() => CSVUtils.exportDefaulters(filteredDefaulters)}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Printable Report Header (Visible in print or screen) */}
          <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Outstanding Fee & Defaulters Register
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Students with pending balances as of {new Date().toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Total Outstanding Balance</span>
                <span className="text-xl font-extrabold font-mono text-rose-600 tabular-nums">
                  {settings.currencySymbol}{' '}
                  {filteredDefaulters
                    .reduce((sum, d) => sum + d.outstandingBalance, 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Roll No.</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Father Name</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4 text-right">Net Monthly</th>
                    <th className="py-3 px-4 text-right">Total Paid</th>
                    <th className="py-3 px-4 text-right">Overdue Balance</th>
                    <th className="no-print py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDefaulters.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">{d.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{d.fullName}</td>
                      <td className="py-3 px-4 text-slate-600">{d.fatherName}</td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="truncate max-w-[130px] block">{d.className}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{d.phone}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        {settings.currencySymbol} {d.netMonthly.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-medium">
                        {settings.currencySymbol} {d.totalPaid.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-rose-600 text-sm">
                        {settings.currencySymbol} {d.outstandingBalance.toLocaleString()}
                      </td>
                      <td className="no-print py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onQuickCollectFee(d.id)}
                            className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
                            title="Collect payment now"
                          >
                            Collect
                          </button>
                          <button
                            onClick={() => setPrintDefaulterNotice(d)}
                            className="px-2 py-1 rounded border border-slate-300 bg-white text-slate-700 text-xs hover:bg-slate-50"
                            title="Generate printable fee reminder notice"
                          >
                            Notice
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredDefaulters.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400">
                        All student fees are up to date! No defaulters found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: PAYMENTS HISTORY */}
      {activeTab === 'payments' && !isTeacher && (
        <div className="space-y-4">
          <div className="no-print flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search payment ledger..."
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-hidden"
              />
            </div>
            <button
              onClick={() => CSVUtils.exportPayments(filteredPayments)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Billing Month</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4">Method & Ref</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="no-print py-3 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.studentName}</td>
                    <td className="py-3 px-4 text-slate-600">{p.billingMonth}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {settings.currencySymbol} {p.amountPaid.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {settings.currencySymbol} {p.balanceRemaining.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {p.paymentMethod} ({p.referenceNumber})
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{p.paymentDate}</td>
                    <td className="no-print py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {onShareWhatsApp && (
                          <button
                            type="button"
                            onClick={() => onShareWhatsApp(p)}
                            className="rounded p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            title="Send Full Receipt on WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onOpenReceipt(p.id)}
                          className="rounded p-1 text-slate-600 hover:text-amber-600 hover:bg-slate-100 transition"
                          title="View printable receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 3: DAILY COLLECTION */}
      {activeTab === 'daily_collection' && !isTeacher && (
        <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Collection Date</th>
                <th className="py-3 px-4 text-center">Receipts Count</th>
                <th className="py-3 px-4">Breakdown by Channel</th>
                <th className="py-3 px-4 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dailyReport.map(([d, data]) => (
                <tr key={d} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{d}</td>
                  <td className="py-3 px-4 text-center font-mono text-slate-700">{data.count}</td>
                  <td className="py-3 px-4 text-xs text-slate-600">
                    {Object.entries(data.methods)
                      .map(([m, a]) => `${m}: ${settings.currencySymbol} ${a.toLocaleString()}`)
                      .join(' · ')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-base">
                    {settings.currencySymbol} {data.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* REPORT 4: MONTHLY REVENUE */}
      {activeTab === 'monthly_revenue' && !isTeacher && (
        <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Monthly Billing Performance</h3>
          <p className="text-xs text-slate-500">
            Total revenue generated across months from enrolled student tuition fees
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block">Total Lifetime Collections</span>
              <span className="text-2xl font-extrabold font-mono text-emerald-700">
                {settings.currencySymbol}{' '}
                {payments.reduce((s, p) => s + p.amountPaid, 0).toLocaleString()}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block">Total Receipts Issued</span>
              <span className="text-2xl font-extrabold font-mono text-slate-900">
                {payments.length}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block">Total Pending Dues</span>
              <span className="text-2xl font-extrabold font-mono text-rose-600">
                {settings.currencySymbol}{' '}
                {defaultersList.reduce((s, d) => s + d.outstandingBalance, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 5: STUDENT DIRECTORY */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="no-print flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-700">
              Master Enrollment Roster ({students.length} students)
            </span>
            <button
              onClick={() =>
                CSVUtils.exportStudents(
                  students,
                  new Map(classes.map((c) => [c.id, c.name]))
                )
              }
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export Master Roster CSV</span>
            </button>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Roll No.</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Father Name</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Admission Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">{s.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{s.fullName}</td>
                    <td className="py-3 px-4 text-slate-600">{s.fatherName}</td>
                    <td className="py-3 px-4 text-slate-700">{s.className}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{s.phone}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{s.admissionDate}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 6: ATTENDANCE REPORTS */}
      {activeTab === 'attendance' && (
        <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Campus Attendance Register Summary</h3>
          <p className="text-xs text-slate-500">
            Total attendance records logged across all academic sessions: {attendance.length} entries
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs text-emerald-800 block">Total Present Marked</span>
              <span className="text-2xl font-extrabold font-mono text-emerald-900">
                {attendance.filter((a) => a.status === 'present').length}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-xs text-rose-800 block">Total Absences Logged</span>
              <span className="text-2xl font-extrabold font-mono text-rose-900">
                {attendance.filter((a) => a.status === 'absent').length}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-xs text-amber-800 block">Total Approved Leaves</span>
              <span className="text-2xl font-extrabold font-mono text-amber-900">
                {attendance.filter((a) => a.status === 'leave').length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Fee Defaulter Printable Reminder Notice Modal */}
      {printDefaulterNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="no-print flex items-center justify-between bg-slate-900 p-4 text-white">
              <h3 className="font-bold text-sm">Official Fee Due Reminder Notice</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
                >
                  Print Notice
                </button>
                <button
                  onClick={() => setPrintDefaulterNotice(null)}
                  className="text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-8 text-slate-900 space-y-6">
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold uppercase">{settings.name}</h2>
                <p className="text-xs text-slate-500">{settings.subTitle || settings.address} · {settings.phone}</p>
                <p className="text-xs font-semibold text-rose-700 mt-2 uppercase tracking-wide">
                  OFFICIAL FEE DUES NOTICE
                </p>
              </div>

              <div className="text-sm space-y-2 leading-relaxed">
                <p>
                  <strong>Date:</strong> {new Date().toLocaleDateString()}
                </p>
                <p>
                  <strong>To:</strong> Respected Parent / Guardian of{' '}
                  <span className="font-bold text-slate-950">{printDefaulterNotice.fullName}</span> (S/O{' '}
                  {printDefaulterNotice.fatherName})
                </p>
                <p>
                  <strong>Student ID:</strong> {printDefaulterNotice.id} ·{' '}
                  <strong>Class:</strong> {printDefaulterNotice.className}
                </p>

                <div className="my-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex justify-between py-1">
                    <span>Current Outstanding Dues:</span>
                    <strong className="font-mono text-rose-700 text-base">
                      {settings.currencySymbol}{' '}
                      {printDefaulterNotice.outstandingBalance.toLocaleString()}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 text-xs text-slate-500">
                    <span>Monthly Tuition Fee:</span>
                    <span>
                      {settings.currencySymbol} {printDefaulterNotice.netMonthly.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-xs text-slate-500">
                    <span>Last Payment Received:</span>
                    <span>{printDefaulterNotice.lastPaymentDate || 'No payment recorded'}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-700">
                  Kindly clear the overdue amount with the accounts office at your earliest convenience to
                  maintain uninterrupted academic records and examinations eligibility.
                </p>
              </div>

              <div className="pt-8 flex justify-between text-xs text-center">
                <div>
                  <div className="w-36 border-b border-slate-400 pb-1 font-semibold">
                    Accounts Office
                  </div>
                  <span className="text-slate-500 mt-1 block">Bursar Department</span>
                </div>
                <div>
                  <div className="w-36 border-b border-slate-400 pb-1 font-semibold">
                    {settings.principalName}
                  </div>
                  <span className="text-slate-500 mt-1 block">Campus Principal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
