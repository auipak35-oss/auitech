import React, { useState, useMemo } from 'react';
import { DatabaseState, ExamResult, SubjectMarks, UserRole, Student } from '../types';
import { StorageService, CSVUtils } from '../services/storage';
import {
  FileCheck,
  Plus,
  Search,
  Download,
  Printer,
  Trash2,
  Award,
  CheckCircle,
  X,
  AlertCircle,
  Layers,
} from 'lucide-react';

interface Props {
  db: DatabaseState;
  role: UserRole;
  onUpdateDb: (newDb: DatabaseState) => void;
  onPrintResultCard: (exam: ExamResult) => void;
}

export const ExamsView: React.FC<Props> = ({
  db,
  role,
  onUpdateDb,
  onPrintResultCard,
}) => {
  const { exams, students, classes, settings } = db;
  const isTeacher = role === 'teacher';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWingFilter, setSelectedWingFilter] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  // Add Exam Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [examName, setExamName] = useState('Midterm Examination 2026');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [subjectsList, setSubjectsList] = useState<SubjectMarks[]>([
    { name: 'Mathematics', totalMarks: 100, obtainedMarks: 85 },
    { name: 'English', totalMarks: 100, obtainedMarks: 78 },
    { name: 'Computer / Science', totalMarks: 100, obtainedMarks: 90 },
  ]);
  const [examRemarks, setExamRemarks] = useState('Satisfactory performance. Continue consistent practice.');

  // Selected student for new exam
  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId),
    [students, selectedStudentId]
  );

  // When student changes in modal, auto-populate default subjects from class if available!
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    const st = students.find((s) => s.id === studentId);
    if (st) {
      const cls = classes.find((c) => c.id === st.classId);
      if (cls && cls.subjects && cls.subjects.length > 0) {
        setSubjectsList(
          cls.subjects.map((sub) => ({
            name: sub,
            totalMarks: 100,
            obtainedMarks: 75,
          }))
        );
      }
    }
  };

  // Add subject row in modal
  const handleAddSubjectRow = () => {
    setSubjectsList([...subjectsList, { name: '', totalMarks: 100, obtainedMarks: 0 }]);
  };

  // Remove subject row
  const handleRemoveSubjectRow = (idx: number) => {
    setSubjectsList(subjectsList.filter((_, i) => i !== idx));
  };

  // Update subject field
  const handleSubjectChange = (idx: number, field: keyof SubjectMarks, val: any) => {
    const updated = [...subjectsList];
    updated[idx] = { ...updated[idx], [field]: val };
    setSubjectsList(updated);
  };

  // Submit Exam Record
  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (subjectsList.length === 0) {
      alert('Please include at least one subject.');
      return;
    }

    const totalMarks = subjectsList.reduce((sum, s) => sum + Number(s.totalMarks || 0), 0);
    const obtainedMarks = subjectsList.reduce((sum, s) => sum + Number(s.obtainedMarks || 0), 0);
    const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 1000) / 10 : 0;

    let grade: ExamResult['grade'] = 'F';
    if (percentage >= 85) grade = 'A+';
    else if (percentage >= 75) grade = 'A';
    else if (percentage >= 65) grade = 'B';
    else if (percentage >= 50) grade = 'C';
    else if (percentage >= 40) grade = 'D';

    const newResult: ExamResult = {
      id: `exam-${Date.now()}`,
      examName,
      date: examDate,
      studentId: selectedStudent.id,
      studentName: selectedStudent.fullName,
      fatherName: selectedStudent.fatherName,
      classId: selectedStudent.classId,
      className: selectedStudent.className,
      programType: selectedStudent.programType,
      subjects: subjectsList,
      totalMarks,
      obtainedMarks,
      percentage,
      grade,
      status: percentage >= 40 ? 'Pass' : 'Fail',
      remarks: examRemarks,
    };

    await StorageService.saveExamResult(newResult);
    onUpdateDb(StorageService.getDatabase());
    setIsAddModalOpen(false);
  };

  // Delete Exam
  const handleDeleteExam = async (id: string) => {
    if (confirm('Delete this examination record?')) {
      await StorageService.deleteExamResult(id);
      onUpdateDb(StorageService.getDatabase());
    }
  };

  // Filtered Exams
  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      if (selectedWingFilter !== 'all' && e.programType !== selectedWingFilter) return false;
      if (selectedClassFilter !== 'all' && e.classId !== selectedClassFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          e.studentName.toLowerCase().includes(q) ||
          e.fatherName.toLowerCase().includes(q) ||
          e.studentId.toLowerCase().includes(q) ||
          e.examName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [exams, selectedWingFilter, selectedClassFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-amber-500" />
            <span>Examinations, Results & Report Cards</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Record subject-wise marks, compute grades & percentages, and generate official printable
            report cards
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => CSVUtils.exportExams(filteredExams)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setSelectedStudentId(students[0]?.id || '');
              handleStudentSelect(students[0]?.id || '');
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 active:scale-95 transition"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Record Exam Result</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, roll number, or exam..."
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={selectedWingFilter}
            onChange={(e) => setSelectedWingFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
          >
            <option value="all">All Academic & Vocational Wings</option>
            <option value="academic">School & College (Matric / FA / FSc / ICS / BA)</option>
            <option value="computer_vocational">Computer Academy & IT Diplomas</option>
            <option value="spoken_english">Spoken English & Language Wing</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
          >
            <option value="all">All Classes / Programs</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Roll No.</th>
                <th className="py-3 px-4">Student & Father Name</th>
                <th className="py-3 px-4">Exam Title</th>
                <th className="py-3 px-4">Class / Program</th>
                <th className="py-3 px-4 text-center">Marks Obtained</th>
                <th className="py-3 px-4 text-center">Percentage</th>
                <th className="py-3 px-4 text-center">Grade</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExams.map((ex) => (
                <tr key={ex.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{ex.studentId}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{ex.studentName}</span>
                    <span className="text-[11px] text-slate-500">S/O {ex.fatherName}</span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    <span className="block">{ex.examName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{ex.date}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <span className="truncate max-w-[150px] block">{ex.className}</span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 tabular-nums">
                    {ex.obtainedMarks} / {ex.totalMarks}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-extrabold text-slate-900 tabular-nums">
                    {ex.percentage}%
                  </td>
                  <td className="py-3 px-4 text-center font-bold">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs ${
                        ex.grade.startsWith('A')
                          ? 'bg-emerald-100 text-emerald-800'
                          : ex.grade === 'B'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ex.grade}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ex.status === 'Pass'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {ex.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onPrintResultCard(ex)}
                        className="flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 text-xs font-semibold transition"
                        title="Print Official Result Card"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Report Card</span>
                      </button>
                      <button
                        onClick={() => handleDeleteExam(ex.id)}
                        className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete exam record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredExams.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No examination records found. Click "Record Exam Result" to add marks.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD EXAM RESULT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Record Student Examination Result</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Student *
                  </label>
                  <select
                    required
                    value={selectedStudentId}
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.id}) · {s.className}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Examination Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Midterm Board Exam 2026"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class / Program</label>
                  <input
                    type="text"
                    disabled
                    value={selectedStudent?.className || 'Select student above'}
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600"
                  />
                </div>
              </div>

              {/* Subject Breakdown Builder */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Subjects & Marks Breakdown
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSubjectRow}
                    className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Subject</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {subjectsList.map((sub, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Subject Name (e.g. Mathematics)"
                        value={sub.name}
                        onChange={(e) => handleSubjectChange(idx, 'name', e.target.value)}
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs sm:text-sm text-slate-900"
                      />
                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Total"
                          value={sub.totalMarks}
                          onChange={(e) =>
                            handleSubjectChange(idx, 'totalMarks', Number(e.target.value))
                          }
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs sm:text-sm text-slate-900 font-mono text-center"
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          min="0"
                          required
                          placeholder="Obt"
                          value={sub.obtainedMarks}
                          onChange={(e) =>
                            handleSubjectChange(idx, 'obtainedMarks', Number(e.target.value))
                          }
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs sm:text-sm text-slate-900 font-mono text-center font-bold"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubjectRow(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Examiner Remarks & Feedback
                </label>
                <textarea
                  rows={2}
                  value={examRemarks}
                  onChange={(e) => setExamRemarks(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Save Result & Compute Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
