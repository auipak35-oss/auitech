import React, { useState, useMemo } from 'react';
import { DatabaseState, Student, CertificateRecord, UserRole, ClassCourse } from '../types';
import { StorageService } from '../services/storage';
import {
  Award,
  CreditCard,
  Printer,
  Plus,
  Search,
  CheckCircle,
  FileCheck,
  ShieldCheck,
  X,
  Sparkles,
  Download,
} from 'lucide-react';

interface Props {
  db: DatabaseState;
  role: UserRole;
  onUpdateDb: (newDb: DatabaseState) => void;
}

export const CertificatesAndIdCardsView: React.FC<Props> = ({ db, role, onUpdateDb }) => {
  const { students, certificates, settings, classes } = db;

  const [activeTab, setActiveTab] = useState<'id_cards' | 'certificates'>('id_cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');

  // Active selected student for ID Card preview
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(
    students[0] || null
  );

  // Active Certificate for Print Modal
  const [printingCert, setPrintingCert] = useState<CertificateRecord | null>(null);

  // Issue Certificate Modal
  const [isIssueCertModalOpen, setIsIssueCertModalOpen] = useState(false);
  const [certForm, setCertForm] = useState({
    studentId: '',
    courseTitle: 'Professional Graphic Designing (Photoshop & Illustrator)',
    programType: 'computer_vocational' as const,
    duration: '3 Months Hands-on Practical Training',
    issueDate: new Date().toISOString().split('T')[0],
    completionDate: new Date().toISOString().split('T')[0],
    gradeAchieved: 'A+ (Distinction)',
    remarks: 'Demonstrated exceptional technical mastery, project delivery, and dedication.',
  });

  // Filtered students for ID cards
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedClassFilter !== 'all' && s.classId !== selectedClassFilter) return false;
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
  }, [students, selectedClassFilter, searchQuery]);

  // Issue Certificate Handler
  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === certForm.studentId);
    if (!student) return;

    const newCert = await StorageService.issueCertificate({
      studentId: student.id,
      studentName: student.fullName,
      fatherName: student.fatherName,
      courseTitle: certForm.courseTitle,
      programType: certForm.programType,
      duration: certForm.duration,
      issueDate: certForm.issueDate,
      completionDate: certForm.completionDate,
      gradeAchieved: certForm.gradeAchieved,
      remarks: certForm.remarks,
      issuedBy: settings.principalName,
    });

    onUpdateDb(StorageService.getDatabase());
    setIsIssueCertModalOpen(false);
    setPrintingCert(newCert);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="no-print bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>Student ID Cards & Course Certificates</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Printable student identification cards and skill completion certificates for Haveli Lakha
            graduates
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'certificates' && (
            <button
              onClick={() => {
                setCertForm({
                  ...certForm,
                  studentId: students[0]?.id || '',
                });
                setIsIssueCertModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 hover:bg-amber-400 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Issue New Certificate</span>
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Current View</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="no-print flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('id_cards')}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md transition ${
            activeTab === 'id_cards'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Student ID Cards</span>
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md transition ${
            activeTab === 'certificates'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Graduation Certificates ({certificates.length})</span>
        </button>
      </div>

      {/* TAB 1: STUDENT ID CARDS */}
      {activeTab === 'id_cards' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="no-print grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student by name, father name, or roll..."
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-hidden"
              />
            </div>
            <div className="sm:col-span-6">
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-hidden"
              >
                <option value="all">All Classes / Programs ({classes.length})</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left list: pick student (Hidden in print) */}
            <div className="no-print lg:col-span-5 rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-slate-50 p-3 text-xs font-bold text-slate-700 border-b border-slate-200">
                Select Candidate to Preview ID Card ({filteredStudents.length})
              </div>
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {filteredStudents.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStudentForCard(st)}
                    className={`p-3 cursor-pointer transition flex items-center justify-between ${
                      selectedStudentForCard?.id === st.id
                        ? 'bg-amber-50/80 border-l-4 border-amber-500'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{st.fullName}</span>
                      <span className="text-[11px] text-slate-500">
                        {st.id} · {st.className}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {st.programType === 'academic'
                        ? 'School/College'
                        : st.programType === 'computer_vocational'
                        ? 'Computer'
                        : 'Spoken English'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Printable Card Showcase */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center p-4">
              {selectedStudentForCard ? (
                <div className="space-y-4">
                  {/* The Physical Card Container (Standard ID Badge Dimensions) */}
                  <div className="w-[340px] sm:w-[380px] rounded-2xl bg-white border-2 border-slate-800 shadow-xl overflow-hidden print-break-inside-avoid">
                    {/* Header */}
                    <div className="bg-slate-900 p-4 text-center text-white border-b-2 border-amber-500 relative">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <img
                          src={settings.logoUrl || '/assets/aistudio/adsas_4f29c8b1.jpg'}
                          alt="AUI Logo"
                          className="w-7 h-7 rounded-full object-contain border border-amber-400 bg-white"
                        />
                        <h4 className="font-extrabold text-[13px] tracking-tight text-white uppercase">
                          ANWAAR-UL-ISLAM
                        </h4>
                      </div>
                      <p className="text-[10px] font-bold text-amber-400 tracking-wider uppercase">
                        TECHNICAL INSTITUTE, HAVELI LAKHA
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        District Okara, Punjab · Powered by AUI Digi
                      </p>
                    </div>

                    {/* Badge Sub-Tag */}
                    <div className="bg-slate-800 text-amber-300 text-center py-1 text-[10px] font-bold uppercase tracking-widest border-b border-slate-700">
                      STUDENT IDENTIFICATION CARD
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      <div className="flex gap-3 items-center">
                        {/* Student Avatar / Photo Box */}
                        <div className="w-20 h-24 rounded-lg border-2 border-slate-300 bg-slate-100 flex flex-col items-center justify-center text-slate-400 shrink-0 shadow-inner overflow-hidden">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
                            {selectedStudentForCard.fullName.charAt(0)}
                          </div>
                          <span className="text-[9px] text-slate-400 mt-1 uppercase">Photo</span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-1 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block">Name:</span>
                            <strong className="text-slate-950 text-sm block leading-tight">
                              {selectedStudentForCard.fullName}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block">Father Name:</span>
                            <span className="font-semibold text-slate-800">
                              {selectedStudentForCard.fatherName}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block">Roll / ID:</span>
                            <span className="font-mono font-bold text-amber-700 text-xs">
                              {selectedStudentForCard.id}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Course & Contact Strip */}
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Program / Class:</span>
                          <strong className="text-slate-900 truncate max-w-[190px]">
                            {selectedStudentForCard.className}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Emergency Phone:</span>
                          <span className="font-mono text-slate-800 font-semibold">
                            {selectedStudentForCard.guardianContact || selectedStudentForCard.phone}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Valid Session:</span>
                          <span className="font-mono text-slate-700">{settings.academicYear}</span>
                        </div>
                      </div>

                      {/* Simulated Barcode & Signatures */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                        {/* Barcode bars simulation */}
                        <div className="space-y-0.5">
                          <div className="h-6 flex items-center gap-[2px]">
                            {[3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2].map((w, i) => (
                              <div
                                key={i}
                                className="h-full bg-slate-900"
                                style={{ width: `${w}px` }}
                              />
                            ))}
                          </div>
                          <span className="text-[8px] font-mono text-slate-400 block tracking-widest text-center">
                            {selectedStudentForCard.id}
                          </span>
                        </div>

                        {/* Principal Signature */}
                        <div className="text-center">
                          <div className="w-24 border-b border-slate-400 pb-0.5">
                            <span className="text-[10px] font-semibold text-slate-800">
                              {settings.principalName.split(' ')[1] || 'Principal'}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-500 block">Principal Signature</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="no-print text-center">
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 text-white px-5 py-2 text-xs font-bold hover:bg-slate-800 transition shadow-sm"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print ID Card</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-sm">Select a student to preview their card.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COURSE COMPLETION CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {cert.certificateNumber}
                      </span>
                      <h4 className="font-bold text-slate-900 text-base mt-1">{cert.studentName}</h4>
                      <span className="text-xs text-slate-500">
                        S/O {cert.fatherName} · Roll #{cert.studentId}
                      </span>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded bg-amber-100 text-amber-900">
                      {cert.gradeAchieved}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Certified Course:</span>
                      <strong className="text-slate-950 font-semibold">{cert.courseTitle}</strong>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-400">Duration:</span>
                      <span className="font-medium text-slate-800">{cert.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Date of Completion:</span>
                      <span className="font-mono text-slate-700">{cert.completionDate}</span>
                    </div>
                  </div>

                  <div className="mt-3 p-2 rounded bg-slate-50 text-[11px] text-slate-600 italic">
                    "{cert.remarks}"
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">Issued: {cert.issueDate}</span>
                  <button
                    onClick={() => setPrintingCert(cert)}
                    className="flex items-center gap-1 font-bold text-slate-900 hover:text-amber-600 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View & Print Certificate</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRINT CERTIFICATE MODAL */}
      {printingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Controls */}
            <div className="no-print flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-white">Official Course Completion Certificate</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 hover:bg-amber-400 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Certificate</span>
                </button>
                <button
                  onClick={() => setPrintingCert(null)}
                  className="rounded-lg p-2 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Certificate Canvas Sheet */}
            <div className="p-8 sm:p-12 bg-white text-slate-900 print-break-inside-avoid">
              {/* Ornate Double Border */}
              <div className="border-4 border-amber-600/70 p-6 sm:p-8 rounded-xl relative bg-amber-50/20">
                <div className="border border-amber-500/40 p-6 sm:p-8 rounded-lg text-center space-y-6">
                  {/* Crest & Header */}
                  <div>
                    <img
                      src={settings.logoUrl || '/assets/aistudio/adsas_4f29c8b1.jpg'}
                      alt="AUI Crest"
                      className="mx-auto w-16 h-16 rounded-full object-contain border border-amber-500/40 mb-2 shadow-xs bg-white"
                    />
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 uppercase font-serif">
                      {settings.name}
                    </h1>
                    <p className="text-xs font-semibold text-amber-800 tracking-widest uppercase mt-1">
                      HAVELI LAKHA, DISTRICT OKARA, PUNJAB, PAKISTAN
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Recognized Training Wing · Powered by {settings.poweredBy}
                    </p>
                  </div>

                  {/* Certificate Title */}
                  <div className="py-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">
                      Certificate Serial No: {printingCert.certificateNumber}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 tracking-wide">
                      Certificate of Achievement
                    </h2>
                  </div>

                  {/* Body Text */}
                  <div className="max-w-2xl mx-auto text-sm sm:text-base leading-relaxed text-slate-700 space-y-3">
                    <p>
                      This is to certify that candidate{' '}
                      <strong className="text-slate-950 border-b-2 border-slate-900 px-3 pb-0.5 font-bold text-base sm:text-lg">
                        {printingCert.studentName}
                      </strong>
                    </p>
                    <p>
                      Son / Daughter of{' '}
                      <span className="font-semibold text-slate-900">{printingCert.fatherName}</span>{' '}
                      (Roll No. <span className="font-mono">{printingCert.studentId}</span>)
                    </p>
                    <p>
                      has successfully completed the comprehensive training program in:
                    </p>
                    <div className="py-2">
                      <div className="inline-block bg-slate-900 text-amber-400 px-6 py-2 rounded-lg font-bold text-base sm:text-lg tracking-wide uppercase border border-amber-400/40 shadow-sm">
                        {printingCert.courseTitle}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600">
                      Duration: <strong>{printingCert.duration}</strong> · Completed on{' '}
                      <strong>{printingCert.completionDate}</strong>
                    </p>
                    <p className="text-xs sm:text-sm text-emerald-800 font-semibold">
                      Performance Grade: <strong>{printingCert.gradeAchieved}</strong>
                    </p>
                  </div>

                  {/* Institutional Disclaimer Rule 9 */}
                  <div className="pt-3 max-w-xl mx-auto border-t border-slate-200">
                    <p className="text-[10px] text-slate-500 leading-normal italic">
                      Disclaimer: This certificate is issued for private skill training and institutional
                      recognition by Anwaar-ul-Islam Technical Institute, Haveli Lakha. It confirms practical
                      course completion and does not claim official government board accreditation.
                    </p>
                  </div>

                  {/* Signatures */}
                  <div className="mt-12 grid grid-cols-2 gap-8 text-center text-xs pt-4">
                    <div>
                      <div className="mx-auto w-40 border-b border-slate-500 pb-1 font-bold text-slate-900">
                        Course Instructor
                      </div>
                      <span className="text-slate-500 mt-1 block">Department Incharge</span>
                    </div>
                    <div>
                      <div className="mx-auto w-40 border-b border-slate-500 pb-1 font-bold text-slate-900">
                        {settings.principalName}
                      </div>
                      <span className="text-slate-500 mt-1 block">Principal & Campus Seal</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ISSUE CERTIFICATE MODAL */}
      {isIssueCertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Issue Course Completion Certificate</h3>
              <button
                onClick={() => setIsIssueCertModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueCertificate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Candidate *
                </label>
                <select
                  required
                  value={certForm.studentId}
                  onChange={(e) => {
                    const st = students.find((s) => s.id === e.target.value);
                    setCertForm({
                      ...certForm,
                      studentId: e.target.value,
                      courseTitle: st ? st.className : certForm.courseTitle,
                      programType: st ? (st.programType as any) : 'computer_vocational',
                    });
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-hidden"
                >
                  <option value="">-- Choose Candidate --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.id}) · {s.className}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course Title on Certificate *
                </label>
                <input
                  type="text"
                  required
                  value={certForm.courseTitle}
                  onChange={(e) => setCertForm({ ...certForm, courseTitle: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    required
                    value={certForm.duration}
                    onChange={(e) => setCertForm({ ...certForm, duration: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grade</label>
                  <input
                    type="text"
                    required
                    value={certForm.gradeAchieved}
                    onChange={(e) => setCertForm({ ...certForm, gradeAchieved: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={certForm.issueDate}
                    onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Completion Date</label>
                  <input
                    type="date"
                    required
                    value={certForm.completionDate}
                    onChange={(e) => setCertForm({ ...certForm, completionDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Appreciation Remarks
                </label>
                <textarea
                  rows={2}
                  value={certForm.remarks}
                  onChange={(e) => setCertForm({ ...certForm, remarks: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsIssueCertModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Generate & Issue Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
