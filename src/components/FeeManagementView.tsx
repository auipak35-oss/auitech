import React, { useState, useMemo } from 'react';
import { DatabaseState, FeePayment, PaymentMethod, UserRole } from '../types';
import { StorageService, CSVUtils } from '../services/storage';
import {
  CreditCard,
  Plus,
  Search,
  Download,
  Receipt,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileText,
  DollarSign,
  Filter,
  Printer,
  MessageCircle,
} from 'lucide-react';

interface Props {
  db: DatabaseState;
  role: UserRole;
  initialStudentId?: string;
  onUpdateDb: (newDb: DatabaseState) => void;
  onOpenReceipt: (paymentId: string) => void;
  onShareWhatsApp: (payment: FeePayment) => void;
}

export const FeeManagementView: React.FC<Props> = ({
  db,
  role,
  initialStudentId,
  onUpdateDb,
  onOpenReceipt,
  onShareWhatsApp,
}) => {
  const { students, payments, settings, classes } = db;

  // Active sub-tab: 'ledger' | 'collect' | 'daily' | 'monthly'
  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'collect' | 'daily' | 'monthly'>('ledger');

  // Search & Filter state for Ledger
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethodFilter, setSelectedMethodFilter] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  // Form state for Fee Collection
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || (students[0]?.id || '')
  );
  const [billingMonth, setBillingMonth] = useState<string>(
    new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  );
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [receivedBy, setReceivedBy] = useState<string>('Accounts Officer');
  const [cashierNotes, setCashierNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [lastSavedPayment, setLastSavedPayment] = useState<FeePayment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected student financials
  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId),
    [students, selectedStudentId]
  );

  const studentFinancials = useMemo(() => {
    if (!selectedStudentId) return null;
    return StorageService.getStudentFinancials(selectedStudentId, db);
  }, [selectedStudentId, db]);

  // Default suggested payment amount when student changes
  React.useEffect(() => {
    if (studentFinancials) {
      const suggested = studentFinancials.outstandingBalance > 0
        ? studentFinancials.outstandingBalance
        : studentFinancials.netMonthly;
      setPaymentAmount(String(suggested));
      // Auto generate reference number hint
      setReferenceNumber(`TXN-${Date.now().toString().slice(-6)}`);
    }
  }, [selectedStudentId, studentFinancials]);

  // Live calculation of remaining balance
  const liveBalanceRemaining = useMemo(() => {
    if (!studentFinancials) return 0;
    const due = studentFinancials.outstandingBalance > 0
      ? studentFinancials.outstandingBalance
      : studentFinancials.netMonthly;
    const paid = Number(paymentAmount) || 0;
    return Math.max(0, due - paid);
  }, [studentFinancials, paymentAmount]);

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (selectedMethodFilter !== 'all' && p.paymentMethod !== selectedMethodFilter) {
        return false;
      }
      if (selectedClassFilter !== 'all' && p.className !== selectedClassFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          p.receiptNumber.toLowerCase().includes(q) ||
          p.studentName.toLowerCase().includes(q) ||
          p.studentId.toLowerCase().includes(q) ||
          p.referenceNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [payments, selectedMethodFilter, selectedClassFilter, searchQuery]);

  // Submit payment handler
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedStudentId) {
      setErrorMessage('Please select a student.');
      return;
    }

    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMessage('Please enter a valid payment amount greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await StorageService.recordPayment({
        studentId: selectedStudentId,
        billingMonth,
        amountPaid: amount,
        paymentMethod,
        referenceNumber: referenceNumber.trim(),
        receivedBy: receivedBy.trim(),
        notes: cashierNotes.trim(),
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to record payment');
        setIsSubmitting(false);
        return;
      }

      // Update state
      const freshDb = StorageService.getDatabase();
      onUpdateDb(freshDb);

      setSuccessMessage(`Payment recorded successfully! Receipt #${result.receiptNumber} generated.`);
      setCashierNotes('');
      if (result.payment) {
        setLastSavedPayment(result.payment);
        onOpenReceipt(result.payment.id);
      }
      setActiveSubTab('ledger');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error occurred while saving payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Daily collection grouping
  const dailyCollections = useMemo(() => {
    const groups: { [date: string]: { total: number; count: number; methods: { [m: string]: number } } } = {};
    payments.forEach((p) => {
      const d = p.paymentDate;
      if (!groups[d]) {
        groups[d] = { total: 0, count: 0, methods: {} };
      }
      groups[d].total += p.amountPaid;
      groups[d].count += 1;
      groups[d].methods[p.paymentMethod] = (groups[d].methods[p.paymentMethod] || 0) + p.amountPaid;
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [payments]);

  // Monthly collection summary
  const monthlyCollections = useMemo(() => {
    const groups: { [month: string]: { total: number; count: number } } = {};
    payments.forEach((p) => {
      const m = p.billingMonth;
      if (!groups[m]) {
        groups[m] = { total: 0, count: 0 };
      }
      groups[m].total += p.amountPaid;
      groups[m].count += 1;
    });
    return Object.entries(groups);
  }, [payments]);

  return (
    <div className="space-y-6">
      {/* Top Banner and Navigation Tabs */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-500" />
            <span>Fee Collection & Financial Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Issue official receipts, record partial/full payments, and calculate outstanding dues
          </p>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg flex-wrap">
          <button
            onClick={() => setActiveSubTab('ledger')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeSubTab === 'ledger'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Payments Ledger
          </button>
          <button
            onClick={() => setActiveSubTab('collect')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1 ${
              activeSubTab === 'collect'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Collect Fee</span>
          </button>
          <button
            onClick={() => setActiveSubTab('daily')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeSubTab === 'daily'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Report
          </button>
          <button
            onClick={() => setActiveSubTab('monthly')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeSubTab === 'monthly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Summary
          </button>
        </div>
      </div>

      {/* RECENT SAVED PAYMENT SUCCESS BANNER WITH WHATSAPP ACTION */}
      {lastSavedPayment && (
        <div className="rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-emerald-950 text-sm sm:text-base">
                  Payment Recorded Successfully!
                </h4>
                <span className="font-mono text-xs bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold">
                  {lastSavedPayment.receiptNumber}
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Received <strong>{settings.currencySymbol} {lastSavedPayment.amountPaid.toLocaleString()}</strong> from <strong>{lastSavedPayment.studentName}</strong> ({lastSavedPayment.className}). Remaining balance: <strong>{settings.currencySymbol} {lastSavedPayment.balanceRemaining.toLocaleString()}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => onShareWhatsApp(lastSavedPayment)}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-4 py-2 text-xs sm:text-sm font-bold shadow-xs transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send Full Receipt on WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenReceipt(lastSavedPayment.id)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-3 py-2 text-xs font-semibold shadow-2xs transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Receipt</span>
            </button>

            <button
              type="button"
              onClick={() => setLastSavedPayment(null)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              title="Dismiss banner"
            >
              <span className="text-xs font-bold">✕</span>
            </button>
          </div>
        </div>
      )}

      {/* SUB-VIEW 1: RECORD NEW PAYMENT (COLLECT FEE) */}
      {activeSubTab === 'collect' && (
        <div className="rounded-xl bg-white border border-slate-200 shadow-xs p-6 max-w-3xl mx-auto">
          <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Record Student Fee Payment</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculate balance automatically, prevent duplicate records, and generate receipt
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
              Next Receipt #{settings.receiptPrefix || 'AUI-REC-'}{settings.nextReceiptSeq || 1001}
            </span>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleRecordPayment} className="space-y-5">
            {/* Student Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Student (Search by name or roll number) *
              </label>
              <select
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 font-medium focus:border-amber-500 focus:outline-hidden"
              >
                <option value="">-- Choose Student --</option>
                {students
                  .filter((s) => s.status !== 'archived')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.id}) · {s.className} · Net Fee: {settings.currencySymbol} {s.netMonthlyFee}
                    </option>
                  ))}
              </select>
            </div>

            {/* Selected Student Ledger Preview Card */}
            {selectedStudent && studentFinancials && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Class / Program</span>
                    <span className="font-semibold text-slate-900 text-xs truncate block">
                      {selectedStudent.className}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Net Monthly Fee</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {settings.currencySymbol} {studentFinancials.netMonthly.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Total Paid to Date</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      {settings.currencySymbol} {studentFinancials.totalPaid.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Current Outstanding</span>
                    <span className="font-mono font-bold text-rose-600 text-sm">
                      {settings.currencySymbol} {studentFinancials.outstandingBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Billing Month */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Billing Cycle / Month *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. October 2026"
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Amount Paid */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount to Pay ({settings.currencySymbol}) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                >
                  <option value="Cash">Cash at Counter</option>
                  <option value="Bank Transfer">Bank Transfer / Online Deposit</option>
                  <option value="EasyPaisa/JazzCash">EasyPaisa / JazzCash</option>
                  <option value="Online Card">Credit / Debit Card</option>
                  <option value="Cheque">Bank Cheque / Pay Order</option>
                </select>
              </div>

              {/* Reference / Transaction ID (Unique Check) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference / Transaction No. (Duplicate Check) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSH-1029 or TRX-8823"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:border-amber-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Prevents accidental duplicate entry of the same receipt
                </span>
              </div>
            </div>

            {/* Real-time Calculation Summary Box */}
            <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-amber-900 font-semibold uppercase block">
                    Calculated Balance Remaining
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xs font-bold text-amber-900">{settings.currencySymbol}</span>
                    <span className="text-2xl font-extrabold font-mono text-amber-950 tabular-nums">
                      {liveBalanceRemaining.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      liveBalanceRemaining === 0
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {liveBalanceRemaining === 0 ? 'Full Settlement (Cleared)' : 'Partial Payment'}
                  </span>
                </div>
              </div>
            </div>

            {/* Received By & Cashier Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Receiving Cashier / Staff
                </label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="Optional receipt note or installment remark"
                  value={cashierNotes}
                  onChange={(e) => setCashierNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveSubTab('ledger')}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-800 active:scale-95 transition shadow-sm disabled:opacity-50"
              >
                <Receipt className="w-4 h-4 text-amber-400" />
                <span>Save Payment & Generate Official Receipt</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-VIEW 2: PAYMENTS LEDGER */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search receipts by number, student name, or ref..."
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-4">
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
              >
                <option value="all">All Classes ({classes.length})</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3 flex gap-2">
              <select
                value={selectedMethodFilter}
                onChange={(e) => setSelectedMethodFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
              >
                <option value="all">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="EasyPaisa/JazzCash">EasyPaisa/JazzCash</option>
                <option value="Online Card">Card</option>
                <option value="Cheque">Cheque</option>
              </select>

              <button
                onClick={() => CSVUtils.exportPayments(filteredPayments)}
                className="shrink-0 flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                title="Download CSV report of payment transactions"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">CSV</span>
              </button>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Receipt No.</th>
                    <th className="py-3 px-4">Student & Roll No.</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4">Channel / Ref</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {p.receiptNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{p.studentName}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{p.studentId}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="truncate max-w-[130px] block" title={p.className}>
                          {p.className}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{p.billingMonth}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums">
                        {settings.currencySymbol} {p.amountPaid.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {p.balanceRemaining > 0 ? (
                          <span className="text-amber-700 font-semibold">
                            {settings.currencySymbol} {p.balanceRemaining.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium text-xs">Cleared</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-medium text-slate-800 block">
                          {p.paymentMethod}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Ref: {p.referenceNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {p.paymentDate}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onShareWhatsApp(p)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 active:scale-95 transition shadow-2xs"
                            title="Send Full Receipt on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenReceipt(p.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition shadow-2xs"
                            title="Print or view official receipt"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-600" />
                            <span className="hidden sm:inline">Print</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400">
                        No payments found matching the current search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: DAILY COLLECTION REPORT */}
      {activeSubTab === 'daily' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Daily Collection Breakdown</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily receipts aggregate by cash, bank deposit, and mobile wallet
              </p>
            </div>
            <button
              onClick={() => {
                const csv = [
                  'Date,Total Collected,Receipt Count',
                  ...dailyCollections.map(([d, data]) => `"${d}",${data.total},${data.count}`),
                ].join('\n');
                CSVUtils.downloadCSV(csv, `Daily-Collection-Report-${new Date().toISOString().split('T')[0]}.csv`);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export Daily CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dailyCollections.map(([date, data]) => (
              <div key={date} className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
                  <span className="font-mono font-bold text-slate-900 text-sm">{date}</span>
                  <span className="text-xs text-slate-500 font-medium">{data.count} Payments</span>
                </div>
                <div className="mb-4">
                  <span className="text-[11px] text-slate-500 uppercase block">Total Collected</span>
                  <span className="text-2xl font-extrabold font-mono text-emerald-700">
                    {settings.currencySymbol} {data.total.toLocaleString()}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  {Object.entries(data.methods).map(([method, amount]) => (
                    <div key={method} className="flex justify-between">
                      <span>{method}:</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {settings.currencySymbol} {amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: MONTHLY COLLECTION SUMMARY */}
      {activeSubTab === 'monthly' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Monthly Billing & Revenue Summary</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cumulative revenue collected across academic billing cycles
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase">
                <tr>
                  <th className="py-3 px-4">Billing Month</th>
                  <th className="py-3 px-4 text-center">Receipts Count</th>
                  <th className="py-3 px-4 text-right">Total Revenue Collected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyCollections.map(([m, data]) => (
                  <tr key={m} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{m}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600">{data.count}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums text-base">
                      {settings.currencySymbol} {data.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
