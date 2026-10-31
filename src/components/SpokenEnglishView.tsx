import React, { useState, useMemo } from 'react';
import { DatabaseState, Student, ExamResult, UserRole, ClassCourse } from '../types';
import { StorageService } from '../services/storage';
import {
  Mic,
  Users,
  CalendarCheck,
  Award,
  Plus,
  Search,
  CheckCircle,
  FileText,
  Volume2,
  Clock,
  Printer,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface Props {
  db: DatabaseState;
  role: UserRole;
  onUpdateDb: (newDb: DatabaseState) => void;
  onQuickCollectFee: (studentId: string) => void;
  onIssueCertificate: (student: Student, course: ClassCourse) => void;
  onPrintResultCard: (exam: ExamResult) => void;
}

export const SpokenEnglishView: React.FC<Props> = ({
  db,
  role,
  onUpdateDb,
  onQuickCollectFee,
  onIssueCertificate,
  onPrintResultCard,
}) => {
  const { students, classes, exams, attendance, settings } = db;
  const isTeacher = role === 'teacher';

  // Sub-tabs: 'batches' | 'students' | 'viva_tests' | 'progress'
  const [activeSubTab, setActiveSubTab] = useState<'batches' | 'students' | 'viva_tests' | 'progress'>('batches');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');

  // New Viva Test Modal State
  const [isVivaModalOpen, setIsVivaModalOpen] = useState(false);
  const [vivaForm, setVivaForm] = useState({
    studentId: '',
    examName: 'Spoken English Oral Viva & Fluency Evaluation',
    date: new Date().toISOString().split('T')[0],
    fluency: 22,
    pronunciation: 21,
    grammar: 20,
    confidence: 23,
    remarks: 'Consistent speaking practice observed. Accent and vocabulary are progressing well.',
  });

  // Filter Spoken English classes & students
  const spokenClasses = useMemo(
    () => classes.filter((c) => c.programType === 'spoken_english'),
    [classes]
  );

  const spokenStudents = useMemo(
    () => students.filter((s) => s.programType === 'spoken_english'),
    [students]
  );

  const filteredSpokenStudents = useMemo(() => {
    return spokenStudents.filter((s) => {
      if (selectedBatchId !== 'all' && s.classId !== selectedBatchId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          s.fullName.toLowerCase().includes(q) ||
          s.fatherName.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.phone.includes(q)
        );
      }
      return true;
    });
  }, [spokenStudents, selectedBatchId, searchQuery]);

  // Spoken English viva exam records
  const spokenExams = useMemo(
    () => exams.filter((e) => e.programType === 'spoken_english'),
    [exams]
  );

  // Submit Viva Assessment
  const handleSaveViva = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = spokenStudents.find((s) => s.id === vivaForm.studentId);
    if (!student) return;

    const subjects = [
      { name: 'Fluency & Flow of Speech', totalMarks: 25, obtainedMarks: Number(vivaForm.fluency) },
      { name: 'Pronunciation & Neutral Accent', totalMarks: 25, obtainedMarks: Number(vivaForm.pronunciation) },
      { name: 'Grammar & Sentence Construction', totalMarks: 25, obtainedMarks: Number(vivaForm.grammar) },
      { name: 'Stage Presentation & Confidence', totalMarks: 25, obtainedMarks: Number(vivaForm.confidence) },
    ];

    const obtainedMarks = subjects.reduce((sum, s) => sum + s.obtainedMarks, 0);
    const totalMarks = 100;
    const percentage = Math.round((obtainedMarks / totalMarks) * 100);
    let grade: ExamResult['grade'] = 'F';
    if (percentage >= 85) grade = 'A+';
    else if (percentage >= 75) grade = 'A';
    else if (percentage >= 65) grade = 'B';
    else if (percentage >= 50) grade = 'C';
    else if (percentage >= 40) grade = 'D';

    const newResult: ExamResult = {
      id: `viva-${Date.now()}`,
      examName: vivaForm.examName,
      date: vivaForm.date,
      studentId: student.id,
      studentName: student.fullName,
      fatherName: student.fatherName,
      classId: student.classId,
      className: student.className,
      programType: 'spoken_english',
      subjects,
      totalMarks,
      obtainedMarks,
      percentage,
      grade,
      status: percentage >= 50 ? 'Pass' : 'Fail',
      remarks: vivaForm.remarks,
    };

    await StorageService.saveExamResult(newResult);
    onUpdateDb(StorageService.getDatabase());
    setIsVivaModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0B192C] via-[#16304f] to-[#0B192C] p-6 sm:p-8 text-white border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Mic className="w-4 h-4" />
              <span>Language Wing & Fluency Training</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Spoken English & IELTS Academy
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-xl">
              Anwaar-ul-Islam Technical Institute · Haveli Lakha Branch. Comprehensive oral drills,
              accent neutralisation, viva assessments, and certificates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsVivaModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 hover:bg-amber-400 shadow-md active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Record Viva Assessment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex-wrap gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg flex-wrap">
          <button
            onClick={() => setActiveSubTab('batches')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeSubTab === 'batches'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Batches & Schedules ({spokenClasses.length})
          </button>
          <button
            onClick={() => setActiveSubTab('students')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeSubTab === 'students'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Registered Candidates ({spokenStudents.length})
          </button>
          <button
            onClick={() => setActiveSubTab('viva_tests')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeSubTab === 'viva_tests'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Oral Viva Evaluations ({spokenExams.length})
          </button>
          <button
            onClick={() => setActiveSubTab('progress')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeSubTab === 'progress'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fluency Benchmarks
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: BATCHES & TIMETABLE */}
      {activeSubTab === 'batches' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {spokenClasses.map((cls) => {
            const batchStudents = spokenStudents.filter((s) => s.classId === cls.id && s.status === 'active');
            const totalRevenue = batchStudents.reduce((sum, s) => sum + s.netMonthlyFee, 0);

            return (
              <div
                key={cls.id}
                className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {cls.code}
                    </span>
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {cls.duration}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug">{cls.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cls.description}</p>

                  <div className="mt-4 space-y-2 text-xs border-t border-slate-100 pt-3 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Shift / Timing:</span>
                      <strong className="text-slate-800">{cls.shiftTiming}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assigned Coach:</span>
                      <strong className="text-slate-900">{cls.assignedTeacherName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Venue / Room:</span>
                      <span className="font-mono text-slate-700">{cls.room}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Monthly Tuition:</span>
                      <strong className="font-mono text-emerald-700">
                        {settings.currencySymbol} {cls.baseMonthlyFee.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {/* Modules covered */}
                  {cls.subjects && cls.subjects.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Key Training Modules:
                      </span>
                      <div className="flex flex-wrap gap-1 text-[11px] text-slate-700">
                        {cls.subjects.map((sub, i) => (
                          <span key={i} className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">
                    <strong className="text-slate-900 font-mono">{batchStudents.length}</strong> / {cls.capacity} Enrolled
                  </span>
                  <button
                    onClick={() => {
                      setSelectedBatchId(cls.id);
                      setActiveSubTab('students');
                    }}
                    className="font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <span>View Candidates</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUB-VIEW 2: REGISTERED CANDIDATES */}
      {activeSubTab === 'students' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidates by name, father name, or roll..."
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
              />
            </div>
            <div className="sm:col-span-6">
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
              >
                <option value="all">All Spoken English Batches</option>
                {spokenClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.shiftTiming})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Roll No.</th>
                    <th className="py-3 px-4">Candidate Name</th>
                    <th className="py-3 px-4">Father Name</th>
                    <th className="py-3 px-4">Batch / Shift</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    {!isTeacher && <th className="py-3 px-4 text-right">Fee Status</th>}
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSpokenStudents.map((st) => {
                    const fin = StorageService.getStudentFinancials(st.id, db);
                    const matchingClass = spokenClasses.find((c) => c.id === st.classId);

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{st.id}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{st.fullName}</span>
                          <span className="text-[11px] text-slate-500 font-mono">Adm: {st.admissionDate}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{st.fatherName}</td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-800 block">{st.className}</span>
                          <span className="text-[11px] text-slate-500">{st.batch}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{st.phone}</td>
                        {!isTeacher && (
                          <td className="py-3 px-4 text-right font-mono tabular-nums">
                            {fin.outstandingBalance > 0 ? (
                              <span className="text-rose-600 font-bold">
                                Due: {settings.currencySymbol} {fin.outstandingBalance.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-medium">Cleared</span>
                            )}
                          </td>
                        )}
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {st.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {matchingClass && (
                              <button
                                onClick={() => onIssueCertificate(st, matchingClass)}
                                className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
                                title="Issue Course Completion Certificate"
                              >
                                Certificate
                              </button>
                            )}
                            {!isTeacher && (
                              <button
                                onClick={() => onQuickCollectFee(st.id)}
                                className="px-2 py-1 rounded border border-slate-300 text-slate-700 text-xs hover:bg-slate-50 transition"
                              >
                                Fee
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredSpokenStudents.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No spoken English candidates enrolled yet in this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: ORAL VIVA EVALUATIONS */}
      {activeSubTab === 'viva_tests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Oral Viva & Speaking Scores Ledger</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluation results on Fluency, Pronunciation, Grammar, and Stage Confidence
              </p>
            </div>
            <button
              onClick={() => setIsVivaModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Record Viva Test</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {spokenExams.map((ex) => (
              <div key={ex.id} className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      VIVA EVALUATION
                    </span>
                    <h4 className="font-bold text-slate-900 text-base mt-1">{ex.studentName}</h4>
                    <span className="text-xs text-slate-500">
                      S/O {ex.fatherName} · Roll #{ex.studentId}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-2xl font-extrabold text-emerald-700 block">
                      {ex.percentage}%
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Grade: {ex.grade} ({ex.status})
                    </span>
                  </div>
                </div>

                {/* Subjects breakdown */}
                <div className="space-y-2 text-xs text-slate-700">
                  {ex.subjects.map((sub, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-600">{sub.name}:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {sub.obtainedMarks} / {sub.totalMarks}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 p-2.5 rounded-lg bg-slate-50 text-xs text-slate-600 italic">
                  "{ex.remarks}"
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">Date: {ex.date}</span>
                  <button
                    onClick={() => onPrintResultCard(ex)}
                    className="flex items-center gap-1 font-bold text-slate-900 hover:text-amber-600 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Result Card</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: FLUENCY BENCHMARKS */}
      {activeSubTab === 'progress' && (
        <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">Spoken English Competency Standards</h3>
          <p className="text-xs text-slate-500">
            Grading criteria applied at Anwaar-ul-Islam Technical Institute language department:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-xs font-bold text-amber-700 uppercase block mb-1">
                Band 1: Fluency (25 Marks)
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Smooth speech flow without mother-tongue hesitation, appropriate pauses, and natural
                rhythm.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-xs font-bold text-amber-700 uppercase block mb-1">
                Band 2: Pronunciation (25 Marks)
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Neutral Pakistani/Standard accent, clear phonetic articulation of vowels and consonants.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-xs font-bold text-amber-700 uppercase block mb-1">
                Band 3: Functional Grammar (25 Marks)
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Accurate usage of tenses, active/passive voice, prepositions, and dynamic idioms in live dialogue.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-xs font-bold text-amber-700 uppercase block mb-1">
                Band 4: Stage Presence (25 Marks)
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Body language, eye contact, podium confidence, debate arguments, and spontaneous replies.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* RECORD VIVA TEST MODAL */}
      {isVivaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Record Oral Viva Assessment</h3>
              </div>
              <button
                onClick={() => setIsVivaModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveViva} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Spoken English Candidate *
                </label>
                <select
                  required
                  value={vivaForm.studentId}
                  onChange={(e) => setVivaForm({ ...vivaForm, studentId: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                >
                  <option value="">-- Choose Candidate --</option>
                  {spokenStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.id}) · {s.className}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assessment / Viva Title
                </label>
                <input
                  type="text"
                  required
                  value={vivaForm.examName}
                  onChange={(e) => setVivaForm({ ...vivaForm, examName: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fluency (Max 25)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="25"
                    required
                    value={vivaForm.fluency}
                    onChange={(e) => setVivaForm({ ...vivaForm, fluency: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pronunciation (Max 25)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="25"
                    required
                    value={vivaForm.pronunciation}
                    onChange={(e) => setVivaForm({ ...vivaForm, pronunciation: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Grammar (Max 25)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="25"
                    required
                    value={vivaForm.grammar}
                    onChange={(e) => setVivaForm({ ...vivaForm, grammar: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confidence (Max 25)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="25"
                    required
                    value={vivaForm.confidence}
                    onChange={(e) => setVivaForm({ ...vivaForm, confidence: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Coach Remarks & Guidance
                </label>
                <textarea
                  rows={2}
                  value={vivaForm.remarks}
                  onChange={(e) => setVivaForm({ ...vivaForm, remarks: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsVivaModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Save Viva Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
