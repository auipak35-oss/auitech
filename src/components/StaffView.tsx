import React, { useState, useMemo } from 'react';
import { DatabaseState, StaffMember, StaffSalaryPayment, UserRole, PaymentMethod } from '../types';
import { StorageService, CSVUtils } from '../services/storage';
import {
  Briefcase,
  Plus,
  Search,
  Download,
  DollarSign,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  CheckCircle,
  X,
  Edit2,
  FileText,
} from 'lucide-react';

interface Props {
  db: DatabaseState;
  role: UserRole;
  onUpdateDb: (newDb: DatabaseState) => void;
}

export const StaffView: React.FC<Props> = ({ db, role, onUpdateDb }) => {
  const { staff, salaries, settings, classes } = db;
  const isTeacher = role === 'teacher';

  const [activeSubTab, setActiveSubTab] = useState<'staff_list' | 'salaries'>('staff_list');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Add / Edit Staff Modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [staffForm, setStaffForm] = useState({
    name: '',
    fatherName: '',
    designation: 'Senior Computer Instructor',
    department: 'Computer Academy',
    qualification: 'BS / MS Computer Science',
    phone: '',
    email: '',
    monthlySalary: 45000,
    joiningDate: new Date().toISOString().split('T')[0],
    assignedCourses: [] as string[],
    status: 'active' as 'active' | 'inactive',
  });

  // Salary Payment Modal
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [salaryForm, setSalaryForm] = useState({
    staffId: '',
    salaryMonth: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    basicSalary: 40000,
    allowance: 0,
    deduction: 0,
    paymentMethod: 'Bank Transfer' as PaymentMethod,
    receiptRef: `SAL-${Date.now().toString().slice(-4)}`,
    notes: 'Monthly faculty salary cleared.',
  });

  // Handle open add staff
  const handleOpenAddStaff = () => {
    setEditingStaff(null);
    setStaffForm({
      name: '',
      fatherName: '',
      designation: 'Faculty Instructor',
      department: 'Computer Academy',
      qualification: 'Master / Graduate',
      phone: '+92 300 ',
      email: '',
      monthlySalary: 40000,
      joiningDate: new Date().toISOString().split('T')[0],
      assignedCourses: [],
      status: 'active',
    });
    setIsStaffModalOpen(true);
  };

  // Handle open edit staff
  const handleOpenEditStaff = (stf: StaffMember) => {
    setEditingStaff(stf);
    setStaffForm({
      name: stf.name,
      fatherName: stf.fatherName || '',
      designation: stf.designation,
      department: stf.department,
      qualification: stf.qualification,
      phone: stf.phone,
      email: stf.email || '',
      monthlySalary: stf.monthlySalary,
      joiningDate: stf.joiningDate,
      assignedCourses: stf.assignedCourses,
      status: stf.status,
    });
    setIsStaffModalOpen(true);
  };

  // Save Staff Member
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name.trim()) return;

    const id = editingStaff ? editingStaff.id : `stf-${String(staff.length + 1).padStart(3, '0')}`;
    const newStaffMember: StaffMember = {
      ...staffForm,
      id,
    };

    await StorageService.saveStaffMember(newStaffMember);
    onUpdateDb(StorageService.getDatabase());
    setIsStaffModalOpen(false);
  };

  // Open Salary Payment Modal
  const handleOpenSalaryModal = (stf?: StaffMember) => {
    const target = stf || staff[0];
    if (target) {
      setSalaryForm({
        staffId: target.id,
        salaryMonth: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        basicSalary: target.monthlySalary,
        allowance: 0,
        deduction: 0,
        paymentMethod: 'Bank Transfer',
        receiptRef: `SAL-${Date.now().toString().slice(-4)}`,
        notes: `Salary disbursement for ${target.name}.`,
      });
      setIsSalaryModalOpen(true);
    }
  };

  // Save Salary Payment
  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    const stf = staff.find((s) => s.id === salaryForm.staffId);
    if (!stf) return;

    const netPaid =
      Number(salaryForm.basicSalary) + Number(salaryForm.allowance) - Number(salaryForm.deduction);

    const newPayment: StaffSalaryPayment = {
      id: `sal-${Date.now()}`,
      staffId: stf.id,
      staffName: stf.name,
      salaryMonth: salaryForm.salaryMonth,
      basicSalary: Number(salaryForm.basicSalary),
      allowance: Number(salaryForm.allowance),
      deduction: Number(salaryForm.deduction),
      netPaid,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: salaryForm.paymentMethod,
      status: 'paid',
      receiptRef: salaryForm.receiptRef,
      notes: salaryForm.notes,
    };

    await StorageService.recordSalaryPayment(newPayment);
    onUpdateDb(StorageService.getDatabase());
    setIsSalaryModalOpen(false);
  };

  // Filtered Staff
  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      if (departmentFilter !== 'all' && s.department !== departmentFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          s.name.toLowerCase().includes(q) ||
          s.designation.toLowerCase().includes(q) ||
          s.phone.includes(q)
        );
      }
      return true;
    });
  }, [staff, departmentFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-amber-500" />
            <span>Faculty & Staff Administration</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Teachers, IT instructors, spoken English trainers, administrative staff & payroll
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => CSVUtils.exportStaff(filteredStaff)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          {!isTeacher && (
            <button
              onClick={() => handleOpenSalaryModal()}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500 bg-amber-50 text-amber-950 px-3.5 py-2 text-xs font-bold hover:bg-amber-100 transition"
            >
              <DollarSign className="w-4 h-4 text-amber-700" />
              <span>Disburse Salary</span>
            </button>
          )}
          {!isTeacher && (
            <button
              onClick={handleOpenAddStaff}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add Staff Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveSubTab('staff_list')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
            activeSubTab === 'staff_list'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Staff & Faculty Directory ({staff.length})
        </button>
        {!isTeacher && (
          <button
            onClick={() => setActiveSubTab('salaries')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeSubTab === 'salaries'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Salary Payments & History ({salaries.length})
          </button>
        )}
      </div>

      {/* SUB-VIEW 1: STAFF DIRECTORY */}
      {activeSubTab === 'staff_list' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="sm:col-span-8 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search faculty by name, designation, or phone..."
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
              />
            </div>
            <div className="sm:col-span-4">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
              >
                <option value="all">All Departments</option>
                <option value="Computer Academy">Computer Academy & IT</option>
                <option value="Language Wing">Language Wing (Spoken English)</option>
                <option value="School & College">School & College</option>
                <option value="Administration">Central Administration</option>
                <option value="Accounts Office">Accounts Office</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStaff.map((stf) => (
              <div
                key={stf.id}
                className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {stf.id}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base mt-1">{stf.name}</h3>
                      <span className="text-xs font-semibold text-slate-600 block">
                        {stf.designation}
                      </span>
                    </div>
                    {!isTeacher && (
                      <button
                        onClick={() => handleOpenEditStaff(stf)}
                        className="p-1 rounded text-slate-400 hover:text-slate-800"
                        title="Edit profile"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Department:</span>
                      <strong className="text-slate-800">{stf.department}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Qualification:</span>
                      <span className="text-slate-800">{stf.qualification}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <span className="font-mono text-slate-900">{stf.phone}</span>
                    </div>
                    {!isTeacher && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Monthly Salary:</span>
                        <strong className="font-mono text-emerald-700 text-sm">
                          {settings.currencySymbol} {stf.monthlySalary.toLocaleString()}
                        </strong>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Joining Date:</span>
                      <span className="font-mono text-slate-500">{stf.joiningDate}</span>
                    </div>
                  </div>

                  {stf.assignedCourses && stf.assignedCourses.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                        Assigned Programs:
                      </span>
                      <div className="flex flex-wrap gap-1 text-[11px] text-slate-700">
                        {stf.assignedCourses.map((c, i) => (
                          <span key={i} className="bg-slate-100 px-2 py-0.5 rounded">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {!isTeacher && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-emerald-700 font-bold uppercase">
                      ● Active Faculty
                    </span>
                    <button
                      onClick={() => handleOpenSalaryModal(stf)}
                      className="px-3 py-1 rounded bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition"
                    >
                      Pay Salary
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: SALARY PAYMENTS & HISTORY */}
      {activeSubTab === 'salaries' && !isTeacher && (
        <div className="space-y-4">
          <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Faculty & Staff Payroll Ledger</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Disbursements, basic salary, allowances, deductions, and receipt references
              </p>
            </div>
            <button
              onClick={() => handleOpenSalaryModal()}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Record Salary Payment</span>
            </button>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Ref #</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4 text-right">Basic</th>
                  <th className="py-3 px-4 text-right">Allowance</th>
                  <th className="py-3 px-4 text-right">Net Paid</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salaries.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.receiptRef}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{s.staffName}</td>
                    <td className="py-3 px-4 text-slate-700">{s.salaryMonth}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {settings.currencySymbol} {s.basicSalary.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700">
                      +{settings.currencySymbol} {s.allowance.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-950 text-sm">
                      {settings.currencySymbol} {s.netPaid.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{s.paymentMethod}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{s.paymentDate}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
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

      {/* ADD / EDIT STAFF MODAL */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingStaff ? 'Edit Staff Profile' : 'Add New Faculty / Staff Member'}
              </h3>
              <button onClick={() => setIsStaffModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sir Usman Ali"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Father’s Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Muhammad Akram"
                    value={staffForm.fatherName}
                    onChange={(e) => setStaffForm({ ...staffForm, fatherName: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior IT Lecturer"
                    value={staffForm.designation}
                    onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={staffForm.department}
                    onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="Computer Academy">Computer Academy</option>
                    <option value="Language Wing">Language Wing</option>
                    <option value="School & College">School & College</option>
                    <option value="Administration">Administration</option>
                    <option value="Accounts Office">Accounts Office</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    placeholder="e.g. MS Computer Science"
                    value={staffForm.qualification}
                    onChange={(e) => setStaffForm({ ...staffForm, qualification: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly Salary ({settings.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={staffForm.monthlySalary}
                    onChange={(e) => setStaffForm({ ...staffForm, monthlySalary: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-800"
                >
                  {editingStaff ? 'Save Changes' : 'Register Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISBURSE SALARY MODAL */}
      {isSalaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Disburse Faculty Salary</h3>
              <button onClick={() => setIsSalaryModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSalary} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Member *</label>
                <select
                  required
                  value={salaryForm.staffId}
                  onChange={(e) => {
                    const stf = staff.find((s) => s.id === e.target.value);
                    setSalaryForm({
                      ...salaryForm,
                      staffId: e.target.value,
                      basicSalary: stf ? stf.monthlySalary : salaryForm.basicSalary,
                    });
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Salary Month *</label>
                  <input
                    type="text"
                    required
                    value={salaryForm.salaryMonth}
                    onChange={(e) => setSalaryForm({ ...salaryForm, salaryMonth: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Basic Salary *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={salaryForm.basicSalary}
                    onChange={(e) => setSalaryForm({ ...salaryForm, basicSalary: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Allowance / Bonus</label>
                  <input
                    type="number"
                    min="0"
                    value={salaryForm.allowance}
                    onChange={(e) => setSalaryForm({ ...salaryForm, allowance: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deductions</label>
                  <input
                    type="number"
                    min="0"
                    value={salaryForm.deduction}
                    onChange={(e) => setSalaryForm({ ...salaryForm, deduction: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Net Payable preview */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex justify-between items-center">
                <span className="text-xs font-bold text-amber-950 uppercase">Net Salary Disbursed:</span>
                <span className="font-mono text-lg font-extrabold text-amber-950">
                  {settings.currencySymbol}{' '}
                  {(
                    Number(salaryForm.basicSalary) +
                    Number(salaryForm.allowance) -
                    Number(salaryForm.deduction)
                  ).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Channel</label>
                <select
                  value={salaryForm.paymentMethod}
                  onChange={(e) => setSalaryForm({ ...salaryForm, paymentMethod: e.target.value as any })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                >
                  <option value="Bank Transfer">Bank Transfer / Direct Deposit</option>
                  <option value="Cash">Cash in Hand</option>
                  <option value="Cheque">Official Bank Cheque</option>
                  <option value="EasyPaisa/JazzCash">EasyPaisa / JazzCash</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSalaryModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Confirm & Disburse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
