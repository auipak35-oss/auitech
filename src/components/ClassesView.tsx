import React, { useState, useMemo } from 'react';
import { DatabaseState, ClassCourse, UserRole, ProgramType } from '../types';
import { StorageService } from '../services/storage';
import {
  GraduationCap,
  Plus,
  Edit2,
  Users,
  DollarSign,
  X,
  Check,
  BookOpen,
  Monitor,
  Mic,
  Clock,
  Layers,
  Power,
} from 'lucide-react';

interface Props {
  db: DatabaseState;
  role: UserRole;
  onUpdateDb: (newDb: DatabaseState) => void;
  onNavigateToStudents: (classId: string) => void;
}

export const ClassesView: React.FC<Props> = ({
  db,
  role,
  onUpdateDb,
  onNavigateToStudents,
}) => {
  const { classes, students, settings } = db;
  const isAccountant = role === 'accountant';

  const [selectedWingTab, setSelectedWingTab] = useState<'all' | ProgramType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassCourse | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    programType: ProgramType;
    category: string;
    duration: string;
    shiftTiming: string;
    baseMonthlyFee: number;
    admissionFee: number;
    assignedTeacherName: string;
    room: string;
    capacity: number;
    subjectsString: string;
    description: string;
    status: 'active' | 'inactive';
  }>({
    name: '',
    code: '',
    programType: 'academic',
    category: 'College Intermediate',
    duration: '2 Years',
    shiftTiming: 'Morning 08:30 AM',
    baseMonthlyFee: 4500,
    admissionFee: 2000,
    assignedTeacherName: 'Sir Usman Ali',
    room: 'Hall 201',
    capacity: 35,
    subjectsString: 'English, Urdu, Computer, Mathematics',
    description: '',
    status: 'active',
  });

  const filteredClasses = useMemo(() => {
    if (selectedWingTab === 'all') return classes;
    return classes.filter((c) => c.programType === selectedWingTab);
  }, [classes, selectedWingTab]);

  const handleOpenAdd = (wing?: ProgramType) => {
    setEditingClass(null);
    const targetWing = wing || (selectedWingTab !== 'all' ? selectedWingTab : 'academic');
    setFormData({
      name: '',
      code: '',
      programType: targetWing,
      category: targetWing === 'academic' ? 'College' : targetWing === 'computer_vocational' ? 'Computer Diploma' : 'Language Wing',
      duration: targetWing === 'academic' ? '1 Year' : '3 Months',
      shiftTiming: 'Morning 08:30 AM',
      baseMonthlyFee: 4000,
      admissionFee: 1500,
      assignedTeacherName: 'Sir Usman Ali',
      room: 'Room 101',
      capacity: 30,
      subjectsString: 'Module 1, Module 2, Practicals',
      description: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassCourse) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      code: cls.code,
      programType: cls.programType || 'academic',
      category: cls.category || 'General',
      duration: cls.duration || 'Ongoing',
      shiftTiming: cls.shiftTiming || 'Morning',
      baseMonthlyFee: cls.baseMonthlyFee,
      admissionFee: cls.admissionFee || 1500,
      assignedTeacherName: cls.assignedTeacherName || 'Faculty',
      room: cls.room || 'Room 101',
      capacity: cls.capacity,
      subjectsString: (cls.subjects || []).join(', '),
      description: cls.description || '',
      status: cls.status || 'active',
    });
    setIsModalOpen(true);
  };

  // Toggle active/inactive
  const handleToggleStatus = async (cls: ClassCourse) => {
    const newStatus = cls.status === 'active' ? 'inactive' : 'active';
    const updated = classes.map((c) => (c.id === cls.id ? { ...c, status: newStatus as any } : c));
    const newDb: DatabaseState = { ...db, classes: updated };
    await StorageService.saveDatabase(newDb);
    onUpdateDb(newDb);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const subjects = formData.subjectsString
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingClass) {
      const updated = classes.map((c) =>
        c.id === editingClass.id
          ? {
              ...c,
              ...formData,
              subjects,
            }
          : c
      );
      const newDb: DatabaseState = { ...db, classes: updated };
      await StorageService.saveDatabase(newDb);
      onUpdateDb(newDb);
    } else {
      const newClass: ClassCourse = {
        id: `cls-${Date.now().toString().slice(-6)}`,
        ...formData,
        code: formData.code.trim() || `PRG-${classes.length + 1}`,
        subjects,
        createdAt: new Date().toISOString().split('T')[0],
      };
      const newDb: DatabaseState = {
        ...db,
        classes: [...db.classes, newClass],
      };
      await StorageService.saveDatabase(newDb);
      onUpdateDb(newDb);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-500" />
            <span>Academic Programs & Technical Academy Courses</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure School & College classes (5th to B.Com), IT Diplomas, and Spoken English
          </p>
        </div>

        {!isAccountant && (
          <button
            onClick={() => handleOpenAdd()}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition shadow-xs"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Create Course / Program</span>
          </button>
        )}
      </div>

      {/* Wing Filter Strip */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit flex-wrap">
        <button
          onClick={() => setSelectedWingTab('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            selectedWingTab === 'all'
              ? 'bg-white text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All Programs ({classes.length})</span>
        </button>
        <button
          onClick={() => setSelectedWingTab('academic')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            selectedWingTab === 'academic'
              ? 'bg-white text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-blue-600" />
          <span>School & College (Class 5 - B.Com)</span>
        </button>
        <button
          onClick={() => setSelectedWingTab('computer_vocational')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            selectedWingTab === 'computer_vocational'
              ? 'bg-white text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Monitor className="w-4 h-4 text-amber-600" />
          <span>Computer Academy & IT</span>
        </button>
        <button
          onClick={() => setSelectedWingTab('spoken_english')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            selectedWingTab === 'spoken_english'
              ? 'bg-white text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Mic className="w-4 h-4 text-emerald-600" />
          <span>Spoken English Center</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClasses.map((cls) => {
          const enrolled = students.filter((s) => s.classId === cls.id && s.status === 'active');
          const totalMonthlyEst = enrolled.reduce((sum, s) => sum + s.netMonthlyFee, 0);

          return (
            <div
              key={cls.id}
              className={`rounded-xl bg-white border p-5 shadow-xs flex flex-col justify-between transition ${
                cls.status === 'inactive'
                  ? 'border-slate-300 opacity-60 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {cls.code}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                          cls.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {cls.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">{cls.name}</h3>
                  </div>

                  {!isAccountant && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleStatus(cls)}
                        className={`p-1.5 rounded-lg transition ${
                          cls.status === 'active'
                            ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={cls.status === 'active' ? 'Deactivate Program' : 'Activate Program'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(cls)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                        title="Edit program"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Wing / Department:</span>
                    <strong className="text-slate-800">
                      {cls.programType === 'academic'
                        ? 'School / College'
                        : cls.programType === 'computer_vocational'
                        ? 'Computer Academy'
                        : 'Spoken English'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Shift / Timing:</span>
                    <span className="font-medium text-slate-800">{cls.shiftTiming}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration:</span>
                    <span className="font-mono text-slate-700">{cls.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Teacher:</span>
                    <strong className="text-slate-900">{cls.assignedTeacherName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monthly Tuition:</span>
                    <strong className="font-mono text-emerald-700 text-sm">
                      {settings.currencySymbol} {cls.baseMonthlyFee.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {cls.subjects && cls.subjects.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                      Curriculum / Subjects:
                    </span>
                    <div className="flex flex-wrap gap-1 text-[11px] text-slate-600">
                      {cls.subjects.map((sub, i) => (
                        <span key={i} className="bg-slate-100 px-2 py-0.5 rounded">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">
                  <strong className="text-slate-900 font-mono">{enrolled.length}</strong> / {cls.capacity} Enrolled
                </span>
                <button
                  onClick={() => onNavigateToStudents(cls.id)}
                  className="font-bold text-amber-600 hover:text-amber-700"
                >
                  View Roster &rarr;
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT PROGRAM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingClass ? 'Edit Program / Course' : 'Create New Program / Course'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Program Wing / Department *
                </label>
                <select
                  value={formData.programType}
                  onChange={(e) => setFormData({ ...formData, programType: e.target.value as any })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                >
                  <option value="academic">School & College (Matric / FA / FSc / ICS / BA / B.Com)</option>
                  <option value="computer_vocational">Technical & Computer Academy (DIT / Web / Graphic)</option>
                  <option value="spoken_english">Spoken English & IELTS Wing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course / Class Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 9 Matric Science or DIT (1 Year)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MAT-09"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 Year or 3 Months"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly Tuition Fee ({settings.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.baseMonthlyFee}
                    onChange={(e) => setFormData({ ...formData, baseMonthlyFee: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Admission Fee ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.admissionFee}
                    onChange={(e) => setFormData({ ...formData, admissionFee: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shift / Timings</label>
                  <input
                    type="text"
                    placeholder="Morning 08:30 AM"
                    value={formData.shiftTiming}
                    onChange={(e) => setFormData({ ...formData, shiftTiming: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Teacher</label>
                  <input
                    type="text"
                    value={formData.assignedTeacherName}
                    onChange={(e) => setFormData({ ...formData, assignedTeacherName: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subjects / Modules (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Physics, Chemistry, Biology, Mathematics"
                  value={formData.subjectsString}
                  onChange={(e) => setFormData({ ...formData, subjectsString: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-800"
                >
                  {editingClass ? 'Save Changes' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
