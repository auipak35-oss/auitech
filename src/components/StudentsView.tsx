import React, { useState, useMemo } from 'react';
import { DatabaseState, Student, StudentStatus, UserRole, ProgramType } from '../types';
import { StorageService, CSVUtils } from '../services/storage';
import {
  Users,
  Search,
  Plus,
  Download,
  Edit2,
  Archive,
  RotateCcw,
  Eye,
  CheckCircle,
  X,
  CreditCard,
  Phone,
  Calendar,
  AlertTriangle,
  GraduationCap,
  Layers,
  Award,
  Clock,
} from 'lucide-react';

interface Props {
  db: DatabaseState;
  role: UserRole;
  onUpdateDb: (newDb: DatabaseState) => void;
  onQuickCollectFee: (studentId: string) => void;
  onViewIdCard?: (student: Student) => void;
}

export const StudentsView: React.FC<Props> = ({
  db,
  role,
  onUpdateDb,
  onQuickCollectFee,
  onViewIdCard,
}) => {
  const { students, classes, settings } = db;
  const isTeacher = role === 'teacher';

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWingFilter, setSelectedWingFilter] = useState<'all' | ProgramType>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | StudentStatus>('active');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    id: string;
    fullName: string;
    fatherName: string;
    gender: 'Male' | 'Female' | 'Other';
    dob: string;
    phone: string;
    guardianContact: string;
    email: string;
    address: string;
    admissionDate: string;
    programType: ProgramType;
    classId: string;
    batch: string;
    arrivalTime: string;
    departureTime: string;
    classDays: string;
    scheduleNotes: string;
    admissionFee: number;
    monthlyFee: number;
    discount: number;
    discountReason: string;
    status: StudentStatus;
    notes: string;
  }>({
    id: '',
    fullName: '',
    fatherName: '',
    gender: 'Male',
    dob: '2008-01-01',
    phone: '+92 ',
    guardianContact: '+92 ',
    email: '',
    address: 'Haveli Lakha, Okara',
    admissionDate: new Date().toISOString().split('T')[0],
    programType: 'academic',
    classId: classes[0]?.id || '',
    batch: '',
    arrivalTime: '',
    departureTime: '',
    classDays: '',
    scheduleNotes: '',
    admissionFee: 0,
    monthlyFee: classes[0]?.baseMonthlyFee || 0,
    discount: 0,
    discountReason: 'None',
    status: 'active',
    notes: '',
  });

  const [formError, setFormError] = useState('');

  // Classes map for quick lookup
  const classesMap = useMemo(() => new Map(classes.map((c) => [c.id, c.name])), [classes]);

  // Available classes according to selected program type in form
  const availableClassesInForm = useMemo(() => {
    return classes.filter((c) => c.programType === formData.programType && c.status === 'active');
  }, [classes, formData.programType]);

  // Filtered students list
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedWingFilter !== 'all' && s.programType !== selectedWingFilter) {
        return false;
      }
      if (selectedStatusFilter !== 'all' && s.status !== selectedStatusFilter) {
        return false;
      }
      if (selectedClassFilter !== 'all' && s.classId !== selectedClassFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.fullName.toLowerCase().includes(q);
        const matchFather = s.fatherName.toLowerCase().includes(q);
        const matchId = s.id.toLowerCase().includes(q);
        const matchPhone = s.phone.includes(q) || s.guardianContact?.includes(q);
        return matchName || matchFather || matchId || matchPhone;
      }
      return true;
    });
  }, [students, selectedWingFilter, selectedStatusFilter, selectedClassFilter, searchQuery]);

  // Handle open Add Modal
  const handleOpenAddModal = (presetWing?: ProgramType) => {
    setEditingStudent(null);
    const year = new Date().getFullYear();
    const count = students.length + 1;
    const padded = String(count).padStart(3, '0');
    const autoId = `${settings.code || 'AUI'}-${year}-${padded}`;

    const wing = presetWing || (selectedWingFilter !== 'all' ? selectedWingFilter : 'academic');
    const defaultClass = classes.find((c) => c.programType === wing) || classes[0];

    setFormData({
      id: autoId,
      fullName: '',
      fatherName: '',
      gender: 'Male',
      dob: '2008-01-01',
      phone: '+92 ',
      guardianContact: '+92 ',
      email: '',
      address: 'Haveli Lakha, Okara',
      admissionDate: new Date().toISOString().split('T')[0],
      programType: wing,
      classId: defaultClass ? defaultClass.id : '',
      batch: '',
      arrivalTime: '',
      departureTime: '',
      classDays: '',
      scheduleNotes: '',
      admissionFee: defaultClass ? defaultClass.admissionFee : 0,
      monthlyFee: defaultClass ? defaultClass.baseMonthlyFee : 0,
      discount: 0,
      discountReason: 'None',
      status: 'active',
      notes: '',
    });
    setFormError('');
    setIsAddEditModalOpen(true);
  };

  // Handle open Edit Modal
  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      id: student.id,
      fullName: student.fullName,
      fatherName: student.fatherName,
      gender: student.gender || 'Male',
      dob: student.dob || '2008-01-01',
      phone: student.phone,
      guardianContact: student.guardianContact || student.phone,
      email: student.email || '',
      address: student.address || 'Haveli Lakha, Okara',
      admissionDate: student.admissionDate,
      programType: student.programType || 'academic',
      classId: student.classId,
      batch: student.batch || '',
      arrivalTime: student.arrivalTime || '',
      departureTime: student.departureTime || '',
      classDays: student.classDays || '',
      scheduleNotes: student.scheduleNotes || '',
      admissionFee: student.admissionFee || 0,
      monthlyFee: student.monthlyFee,
      discount: student.discount,
      discountReason: student.discountReason || 'None',
      status: student.status,
      notes: student.notes || '',
    });
    setFormError('');
    setIsAddEditModalOpen(true);
  };

  // When Program Type changes in form
  const handleProgramTypeChangeInForm = (newWing: ProgramType) => {
    const firstMatchingClass = classes.find((c) => c.programType === newWing);
    setFormData((prev) => ({
      ...prev,
      programType: newWing,
      classId: firstMatchingClass ? firstMatchingClass.id : '',
      admissionFee: firstMatchingClass ? firstMatchingClass.admissionFee : prev.admissionFee,
      monthlyFee: firstMatchingClass ? firstMatchingClass.baseMonthlyFee : prev.monthlyFee,
    }));
  };

  // When Class changes in form
  const handleClassChangeInForm = (newClassId: string) => {
    const selected = classes.find((c) => c.id === newClassId);
    setFormData((prev) => ({
      ...prev,
      classId: newClassId,
      admissionFee: selected ? selected.admissionFee : prev.admissionFee,
      monthlyFee: selected ? selected.baseMonthlyFee : prev.monthlyFee,
    }));
  };

  // Save student
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.fullName.trim()) {
      setFormError('Please enter candidate full name.');
      return;
    }
    if (!formData.fatherName.trim()) {
      setFormError('Please enter father’s / guardian’s name.');
      return;
    }
    if (!formData.phone.trim()) {
      setFormError('Please enter candidate phone number.');
      return;
    }
    if (!formData.classId) {
      setFormError('Please select a course or class program.');
      return;
    }

    const netMonthlyFee = Math.max(0, Number(formData.monthlyFee) - Number(formData.discount));
    const selectedClass = classes.find((c) => c.id === formData.classId);
    const className = selectedClass ? selectedClass.name : 'General Program';

    if (editingStudent) {
      const updatedList = students.map((s) => {
        if (s.id === editingStudent.id) {
          return {
            ...s,
            ...formData,
            className,
            netMonthlyFee,
          };
        }
        return s;
      });

      const updatedDb: DatabaseState = { ...db, students: updatedList };
      await StorageService.saveDatabase(updatedDb);
      onUpdateDb(updatedDb);
    } else {
      if (students.some((s) => s.id.toLowerCase() === formData.id.toLowerCase().trim())) {
        setFormError(`A student with Roll No. "${formData.id}" already exists.`);
        return;
      }

      const newStudent: Student = {
        ...formData,
        id: formData.id.trim(),
        className,
        netMonthlyFee,
        createdAt: new Date().toISOString(),
      };

      const updatedDb: DatabaseState = {
        ...db,
        students: [newStudent, ...db.students],
      };
      await StorageService.saveDatabase(updatedDb);
      onUpdateDb(updatedDb);
    }

    setIsAddEditModalOpen(false);
  };

  // Archive / Reactivate
  const handleToggleArchive = async (student: Student) => {
    const newStatus: StudentStatus = student.status === 'archived' ? 'active' : 'archived';
    const updatedList = students.map((s) => {
      if (s.id === student.id) {
        return { ...s, status: newStatus };
      }
      return s;
    });
    const updatedDb: DatabaseState = { ...db, students: updatedList };
    await StorageService.saveDatabase(updatedDb);
    onUpdateDb(updatedDb);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <span>Student Admissions & Registry</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            School, College, Computer Academy & Spoken English enrollment management
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => CSVUtils.exportStudents(filteredStudents, classesMap)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {!isTeacher && (
            <button
              onClick={() => handleOpenAddModal()}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition shadow-xs"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Admit New Student</span>
            </button>
          )}
        </div>
      </div>

      {/* Program Wings Filter Strip */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit flex-wrap">
        <button
          onClick={() => setSelectedWingFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            selectedWingFilter === 'all'
              ? 'bg-white text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Wings ({students.length})
        </button>
        <button
          onClick={() => setSelectedWingFilter('academic')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            selectedWingFilter === 'academic'
              ? 'bg-white text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          School & College (Matric/FA/FSc/ICS/BA)
        </button>
        <button
          onClick={() => setSelectedWingFilter('computer_vocational')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            selectedWingFilter === 'computer_vocational'
              ? 'bg-white text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Computer Academy & IT
        </button>
        <button
          onClick={() => setSelectedWingFilter('spoken_english')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            selectedWingFilter === 'spoken_english'
              ? 'bg-white text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Spoken English Wing
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, father name, roll number, or phone..."
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
          >
            <option value="all">All Classes & Courses ({classes.length})</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
          >
            <option value="all">All Statuses ({students.length})</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived / Alumni</option>
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Roll No.</th>
                <th className="py-3 px-4">Student & Father Name</th>
                <th className="py-3 px-4">Program & Class</th>
                <th className="py-3 px-4">Timetable / Batch</th>
                <th className="py-3 px-4">Phone / Guardian</th>
                {!isTeacher && <th className="py-3 px-4 text-right">Net Monthly</th>}
                {!isTeacher && <th className="py-3 px-4 text-right">Balance Due</th>}
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => {
                const financials = StorageService.getStudentFinancials(student.id, db);
                const hasDue = financials.outstandingBalance > 0;

                return (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {student.id}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{student.fullName}</span>
                      <span className="text-[11px] text-slate-500">S/O {student.fatherName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 block truncate max-w-[170px]">
                        {classesMap.get(student.classId) || student.className}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">
                        {student.programType === 'academic'
                          ? 'School/College'
                          : student.programType === 'computer_vocational'
                          ? 'Computer Academy'
                          : 'Spoken English'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {student.batch ? (
                        <span className="font-semibold text-slate-800 block text-[11px]">
                          {student.batch}
                        </span>
                      ) : null}
                      {(student.arrivalTime || student.departureTime) ? (
                        <span className="text-[11px] font-mono text-amber-800 font-medium flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-amber-600 inline shrink-0" />
                          {student.arrivalTime || '--'} - {student.departureTime || '--'}
                        </span>
                      ) : (
                        !student.batch && <span className="text-slate-400 italic text-[11px]">Custom (Not Set)</span>
                      )}
                      {student.classDays && (
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          📅 {student.classDays}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-600">
                      <span className="block">{student.phone}</span>
                      {student.guardianContact && (
                        <span className="text-[10px] text-slate-400">G: {student.guardianContact}</span>
                      )}
                    </td>

                    {!isTeacher && (
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                        {settings.currencySymbol} {student.netMonthlyFee.toLocaleString()}
                        {student.discount > 0 && (
                          <span className="block text-[10px] text-emerald-600">
                            (-{settings.currencySymbol} {student.discount})
                          </span>
                        )}
                      </td>
                    )}

                    {!isTeacher && (
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {hasDue ? (
                          <span className="font-bold text-rose-600">
                            {settings.currencySymbol} {financials.outstandingBalance.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium text-xs">Cleared</span>
                        )}
                      </td>
                    )}

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                          student.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : student.status === 'archived'
                            ? 'bg-slate-100 text-slate-600 border border-slate-300'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingStudent(student)}
                          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                          title="View student ledger & details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {onViewIdCard && (
                          <button
                            onClick={() => onViewIdCard(student)}
                            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 transition"
                            title="Generate Student ID Card"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}

                        {!isTeacher && (
                          <button
                            onClick={() => onQuickCollectFee(student.id)}
                            className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition"
                            title="Collect fee payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}

                        {!isTeacher && (
                          <button
                            onClick={() => handleOpenEditModal(student)}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                            title="Edit student record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {!isTeacher && (
                          <button
                            onClick={() => handleToggleArchive(student)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                            title={student.status === 'archived' ? 'Reactivate student' : 'Archive student'}
                          >
                            {student.status === 'archived' ? (
                              <RotateCcw className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Archive className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={isTeacher ? 7 : 9} className="py-10 text-center text-slate-400">
                    No students found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT ADMISSION MODAL */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">
                  {editingStudent
                    ? `Edit Admission: ${editingStudent.fullName}`
                    : 'Candidate Admission Registration Form'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Wing Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Institutional Wing / Department *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleProgramTypeChangeInForm('academic')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition ${
                      formData.programType === 'academic'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    School & College
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProgramTypeChangeInForm('computer_vocational')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition ${
                      formData.programType === 'computer_vocational'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Computer Academy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProgramTypeChangeInForm('spoken_english')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition ${
                      formData.programType === 'spoken_english'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Spoken English
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Roll No */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student ID / Registration Roll No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    disabled={!!editingStudent}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 font-mono disabled:bg-slate-100 focus:outline-hidden"
                  />
                </div>

                {/* Admission Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Admission Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.admissionDate}
                    onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-hidden"
                  />
                </div>

                {/* Candidate Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Candidate Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muhammad Ali"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-hidden"
                  />
                </div>

                {/* Father Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Father’s / Guardian’s Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muhammad Boota"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-hidden"
                  />
                </div>

                {/* Gender & DOB */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>

                {/* Phone & Guardian Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guardian Emergency Contact *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.guardianContact}
                    onChange={(e) => setFormData({ ...formData, guardianContact: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900"
                  />
                </div>

                {/* Class / Course Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Program / Class *
                  </label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => handleClassChangeInForm(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  >
                    {availableClassesInForm.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({settings.currencySymbol} {cls.baseMonthlyFee}/mo)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Student Timetable & Class Schedule Section */}
                <div className="sm:col-span-2 p-4 rounded-xl border border-amber-200 bg-amber-50/50 shadow-2xs">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Custom Student Timetable & Schedule
                      </h4>
                    </div>
                    <span className="text-[10px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded font-medium">
                      Individual Timing
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Batch / Group Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Batch / Section Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Batch 1, Morning Regular, Afternoon"
                        value={formData.batch}
                        onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Class Days */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Class Days
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mon - Fri, Mon-Wed-Fri, Weekend"
                        value={formData.classDays}
                        onChange={(e) => setFormData({ ...formData, classDays: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                      />
                      {/* Suggestion Chips */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {['Mon - Fri', 'Mon - Sat', 'Mon, Wed, Fri', 'Weekend (Sat-Sun)'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setFormData({ ...formData, classDays: opt })}
                            className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-slate-600 hover:text-amber-900 transition border border-slate-200"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Arrival Time */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Arrival Time
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 08:30 AM or 04:00 PM"
                        value={formData.arrivalTime}
                        onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:border-amber-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Departure Time */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Departure Time
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 11:30 AM or 06:00 PM"
                        value={formData.departureTime}
                        onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:border-amber-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Schedule / Room Notes */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Room / Lab / Schedule Notes
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Computer Lab 1, Seat 12, or Hall 2"
                        value={formData.scheduleNotes}
                        onChange={(e) => setFormData({ ...formData, scheduleNotes: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Admission Fee */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Admission / Registration Fee ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.admissionFee}
                    onChange={(e) => setFormData({ ...formData, admissionFee: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900"
                  />
                </div>

                {/* Monthly Fee */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly Tuition Fee ({settings.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.monthlyFee}
                    onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900"
                  />
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Concession / Discount ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900"
                  />
                </div>

                {/* Net Monthly Fee */}
                <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200">
                  <span className="text-[11px] font-semibold text-amber-900 uppercase block">
                    Effective Net Monthly Due
                  </span>
                  <span className="font-mono text-lg font-bold text-amber-900">
                    {settings.currencySymbol}{' '}
                    {Math.max(0, Number(formData.monthlyFee) - Number(formData.discount)).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  placeholder="Haveli Lakha, Okara"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks / Admission Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional admission remarks"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-800"
                >
                  {editingStudent ? 'Save Changes' : 'Confirm Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW STUDENT PROFILE & FINANCIAL LEDGER MODAL */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <div>
                <span className="text-xs text-amber-400 font-mono block">Candidate Dossier</span>
                <h3 className="text-lg font-bold text-white">{viewingStudent.fullName}</h3>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-sm">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 block">Roll / Student ID</span>
                  <strong className="font-mono text-slate-900">{viewingStudent.id}</strong>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Father’s Name</span>
                  <span className="font-semibold text-slate-900">{viewingStudent.fatherName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Program Wing</span>
                  <span className="font-bold text-amber-800 text-xs uppercase">
                    {viewingStudent.programType === 'academic'
                      ? 'School/College'
                      : viewingStudent.programType === 'computer_vocational'
                      ? 'Computer Academy'
                      : 'Spoken English'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Class / Course</span>
                  <span className="font-semibold text-slate-900">{viewingStudent.className}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Batch / Section</span>
                  <span className="font-semibold text-slate-800">{viewingStudent.batch || 'Not Set'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Class Timetable</span>
                  <span className="font-mono text-amber-800 font-semibold text-xs flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600 inline shrink-0" />
                    {viewingStudent.arrivalTime || viewingStudent.departureTime
                      ? `${viewingStudent.arrivalTime || '?'} - ${viewingStudent.departureTime || '?'}`
                      : 'Manual / Flexible'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Class Days</span>
                  <span className="font-medium text-slate-800 text-xs">
                    {viewingStudent.classDays || 'Standard Schedule'}
                  </span>
                </div>
                {viewingStudent.scheduleNotes && (
                  <div className="sm:col-span-2">
                    <span className="text-xs text-slate-500 block">Room / Lab / Schedule Notes</span>
                    <span className="text-xs text-slate-700 italic">{viewingStudent.scheduleNotes}</span>
                  </div>
                )}
                <div>
                  <span className="text-xs text-slate-500 block">Contact Phone</span>
                  <span className="font-mono text-slate-900">{viewingStudent.phone}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Guardian Phone</span>
                  <span className="font-mono text-slate-900">{viewingStudent.guardianContact}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Admission Date</span>
                  <span className="font-mono text-slate-900">{viewingStudent.admissionDate}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Status</span>
                  <span className="font-bold uppercase text-xs text-emerald-700">
                    {viewingStudent.status}
                  </span>
                </div>
              </div>

              {!isTeacher && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-amber-500" />
                      <span>Financial Balance & Receipts</span>
                    </h4>
                    <button
                      onClick={() => {
                        const sid = viewingStudent.id;
                        setViewingStudent(null);
                        onQuickCollectFee(sid);
                      }}
                      className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-amber-400"
                    >
                      Record Fee Payment
                    </button>
                  </div>

                  {(() => {
                    const fin = StorageService.getStudentFinancials(viewingStudent.id, db);
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-[11px] text-slate-500 block">Net Monthly Fee</span>
                            <span className="font-mono font-bold text-slate-900">
                              {settings.currencySymbol} {fin.netMonthly.toLocaleString()}
                            </span>
                          </div>
                          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                            <span className="text-[11px] text-emerald-700 block">Total Paid</span>
                            <span className="font-mono font-bold text-emerald-800">
                              {settings.currencySymbol} {fin.totalPaid.toLocaleString()}
                            </span>
                          </div>
                          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                            <span className="text-[11px] text-rose-700 block">Outstanding Due</span>
                            <span className="font-mono font-bold text-rose-800">
                              {settings.currencySymbol} {fin.outstandingBalance.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                          <div className="bg-slate-50 p-2.5 text-xs font-semibold text-slate-700 border-b border-slate-200">
                            Fee Receipts ({fin.payments.length})
                          </div>
                          <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                            {fin.payments.map((p) => (
                              <div key={p.id} className="p-2.5 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-mono font-bold text-slate-800 block">
                                    {p.receiptNumber} · {p.billingMonth}
                                  </span>
                                  <span className="text-slate-500 text-[11px]">
                                    {p.paymentDate} via {p.paymentMethod}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="font-mono font-bold text-emerald-700 block">
                                    {settings.currencySymbol} {p.amountPaid.toLocaleString()}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    Bal: {settings.currencySymbol} {p.balanceRemaining.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
