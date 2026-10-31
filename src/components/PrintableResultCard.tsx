import React from 'react';
import { ExamResult, InstitutionSettings } from '../types';
import { Printer, X, Award, CheckCircle } from 'lucide-react';

interface Props {
  exam: ExamResult;
  settings: InstitutionSettings;
  onClose: () => void;
}

export const PrintableResultCard: React.FC<Props> = ({ exam, settings, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Controls Bar - Hidden on Print */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-white">Official Examination Result Card</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 hover:bg-amber-400 active:scale-95 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report Card</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Card Area */}
        <div className="p-8 bg-white text-slate-900 print-break-inside-avoid">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-5 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <img
                src={settings.logoUrl || '/assets/aistudio/adsas_4f29c8b1.jpg'}
                alt="AUI Logo"
                className="w-14 h-14 rounded-full object-contain border border-slate-200 shadow-2xs"
              />
              <div className="text-left">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase leading-tight">
                  {settings.name}
                </h1>
                <p className="text-xs font-bold text-amber-700 tracking-wide uppercase">
                  {settings.subTitle || 'School · College · Computer Academy · Spoken English'}
                </p>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
              {settings.subTitle} · {settings.address}
            </p>
            <div className="mt-1 flex items-center justify-center gap-2 text-xs text-slate-500">
              <span>Tel: {settings.phone}</span>
              <span>·</span>
              <span>Session {settings.academicYear}</span>
              <span>·</span>
              <span className="font-semibold text-amber-700">Powered by {settings.poweredBy}</span>
            </div>
            <div className="mt-3 inline-block bg-slate-900 text-white px-4 py-1 rounded text-xs font-bold uppercase tracking-wider">
              ACADEMIC & VOCATIONAL EVALUATION RESULT CARD
            </div>
          </div>

          {/* Student Meta Details */}
          <div className="my-5 grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm">
            <div>
              <span className="text-slate-500 text-xs block">Candidate Full Name</span>
              <strong className="text-slate-900 text-base">{exam.studentName}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Student ID / Roll No.</span>
              <span className="font-mono font-bold text-slate-900">{exam.studentId}</span>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Father’s / Guardian’s Name</span>
              <span className="font-semibold text-slate-800">{exam.fatherName}</span>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Class / Course</span>
              <span className="font-semibold text-slate-800">{exam.className}</span>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Examination / Assessment</span>
              <span className="font-semibold text-slate-900">{exam.examName}</span>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Date of Evaluation</span>
              <span className="font-mono font-medium text-slate-700">{exam.date}</span>
            </div>
          </div>

          {/* Subjects Table */}
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                <th className="py-2.5 px-3">Subject / Module</th>
                <th className="py-2.5 px-3 text-center">Max Marks</th>
                <th className="py-2.5 px-3 text-center">Passing Marks</th>
                <th className="py-2.5 px-3 text-right">Marks Obtained</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {exam.subjects.map((sub, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-medium text-slate-900">{sub.name}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                    {sub.totalMarks}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                    {Math.round(sub.totalMarks * 0.4)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {sub.obtainedMarks}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 bg-slate-50 font-bold">
                <td className="py-2.5 px-3 text-slate-900">Total Aggregate Marks</td>
                <td className="py-2.5 px-3 text-center font-mono text-slate-900">
                  {exam.totalMarks}
                </td>
                <td className="py-2.5 px-3 text-center text-slate-500">-</td>
                <td className="py-2.5 px-3 text-right font-mono text-base text-slate-950">
                  {exam.obtainedMarks}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Score & Grade Summary Strip */}
          <div className="mt-5 grid grid-cols-3 gap-3 text-center p-3.5 bg-slate-100 rounded-lg border border-slate-300">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                Percentage
              </span>
              <span className="text-xl font-extrabold font-mono text-slate-950">
                {exam.percentage}%
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                Grade
              </span>
              <span className="text-xl font-extrabold text-emerald-700">{exam.grade}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                Final Status
              </span>
              <span
                className={`text-sm font-bold uppercase inline-block px-3 py-1 rounded ${
                  exam.status === 'Pass'
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-rose-200 text-rose-900'
                }`}
              >
                {exam.status}
              </span>
            </div>
          </div>

          {exam.remarks && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Remarks: </span>
              <span className="italic text-slate-600">{exam.remarks}</span>
            </div>
          )}

          {/* Grading Scale */}
          <div className="mt-4 text-[10px] text-slate-400 flex flex-wrap justify-between border-t border-slate-200 pt-2">
            <span>Grading Scheme:</span>
            <span>A+ (85%-100%) Distinction</span>
            <span>A (75%-84%) Excellent</span>
            <span>B (65%-74%) Good</span>
            <span>C (50%-64%) Satisfactory</span>
            <span>D (40%-49%) Pass</span>
            <span>F (Below 40%) Needs Improvement</span>
          </div>

          {/* Official Signatures */}
          <div className="mt-12 grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <div className="mx-auto w-32 border-b border-slate-400 pb-1 font-semibold text-slate-800">
                Subject Teacher
              </div>
              <span className="text-slate-500 mt-1 block">Class Incharge</span>
            </div>
            <div>
              <div className="mx-auto w-32 border-b border-slate-400 pb-1 font-semibold text-slate-800">
                Controller of Exams
              </div>
              <span className="text-slate-500 mt-1 block">Examination Wing</span>
            </div>
            <div>
              <div className="mx-auto w-32 border-b border-slate-400 pb-1 font-semibold text-slate-800">
                {settings.principalName}
              </div>
              <span className="text-slate-500 mt-1 block">Principal & Official Seal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
