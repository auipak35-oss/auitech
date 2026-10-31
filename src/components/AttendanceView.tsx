import React, { useState, useMemo, useEffect } from 'react';
import { DatabaseState, AttendanceRecord, AttendanceStatus, UserRole } from '../types';
import { StorageService, CSVUtils } from '../services/storage';
import {
  CalendarCheck,
  Calendar,
  Users,
  Check,
  X as CloseIcon,
  Clock,
  Coffee,
  Download,
  AlertCircle,
  CheckCircle2,
  Filter,
} from 'lucide-react';

interface Props {
  db: DatabaseState;
  role: UserRole;
  onUpdateDb: (newDb: DatabaseState) => void;
}

export const AttendanceView: React.FC<Props> = ({ db, role, onUpdateDb }) => {
  const { students, classes, attendance, users } = db;

  // Selected date and class
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');

  // Active view tab: 'mark' | 'daily_report' | 'monthly_report'
  const [activeTab, setActiveTab] = useState<'mark' | 'daily_report' | 'monthly_report'>('mark');

  // In-memory student attendance statuses for this session: studentId -> { status, remarks }
  const [attendanceState, setAttendanceState] = useState<{
    [studentId: string]: { status: AttendanceStatus; remarks: string };
  }>({});

  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Active students in the selected class
  const classStudents = useMemo(() => {
    return students.filter(
      (s) => s.classId === selectedClassId && s.status === 'active'
    );
  }, [students, selectedClassId]);

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId),
    [classes, selectedClassId]
  );

  // Load existing attendance records for the selected date and class
  useEffect(() => {
    const existing = attendance.filter(
      (a) => a.date === selectedDate && a.classId === selectedClassId
    );

    const newState: { [studentId: string]: { status: AttendanceStatus; remarks: string } } = {};

    classStudents.forEach((student) => {
      const rec = existing.find((a) => a.studentId === student.id);
      if (rec) {
        newState[student.id] = { status: rec.status, remarks: rec.remarks || '' };
      } else {
        // Default to 'present' for easy roll call
        newState[student.id] = { status: 'present', remarks: '' };
      }
    });

    setAttendanceState(newState);
    setSaveStatus(null);
  }, [selectedDate, selectedClassId, classStudents, attendance]);

  // Handle single student status toggle
  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { remarks: '' }),
        status,
      },
    }));
  };

  // Handle remarks change
  const handleSetRemarks = (studentId: string, remarks: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'present' }),
        remarks,
      },
    }));
  };

  // Bulk actions
  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: { [studentId: string]: { status: AttendanceStatus; remarks: string } } = {};
    classStudents.forEach((s) => {
      updated[s.id] = {
        status,
        remarks: attendanceState[s.id]?.remarks || '',
      };
    });
    setAttendanceState(updated);
  };

  // Save Attendance to Database (prevents duplicates)
  const handleSaveAttendance = async () => {
    if (!selectedClassId) return;

    const records = classStudents.map((s) => ({
      studentId: s.id,
      status: attendanceState[s.id]?.status || 'present',
      remarks: attendanceState[s.id]?.remarks || '',
    }));

    const markedByName =
      role === 'teacher'
        ? 'Class Faculty'
        : role === 'accountant'
        ? 'Accounts Officer'
        : 'Campus Administrator';

    try {
      await StorageService.saveAttendanceBatch(
        selectedDate,
        selectedClassId,
        records,
        markedByName
      );

      const freshDb = StorageService.getDatabase();
      onUpdateDb(freshDb);

      setSaveStatus({
        type: 'success',
        message: `Attendance saved successfully for ${records.length} students. Duplicate records avoided!`,
      });
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (e: any) {
      setSaveStatus({
        type: 'error',
        message: e?.message || 'Failed to save attendance',
      });
    }
  };

  // Summary counts for current class & date
  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let late = 0;

    classStudents.forEach((s) => {
      const st = attendanceState[s.id]?.status || 'present';
      if (st === 'present') present++;
      else if (st === 'absent') absent++;
      else if (st === 'leave') leave++;
      else if (st === 'late') late++;
    });

    const total = classStudents.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, leave, late, total, rate };
  }, [classStudents, attendanceState]);

  // Export current class attendance to CSV
  const handleExportCSV = () => {
    const records: AttendanceRecord[] = classStudents.map((s) => ({
      id: `att-${selectedDate}-${s.id}`,
      date: selectedDate,
      classId: selectedClassId,
      programType: s.programType || selectedClass?.programType || 'academic',
      studentId: s.id,
      studentName: s.fullName,
      status: attendanceState[s.id]?.status || 'present',
      markedBy: 'Faculty',
      remarks: attendanceState[s.id]?.remarks || '',
      timestamp: new Date().toISOString(),
    }));

    CSVUtils.exportAttendance(records, selectedDate, selectedClass?.name || 'Class');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Navigation Tabs */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-amber-500" />
            <span>Student Attendance Registry</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daily roll call, automated duplicate prevention, and class attendance reporting
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('mark')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeTab === 'mark'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mark Daily Roll Call
          </button>
          <button
            onClick={() => setActiveTab('daily_report')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeTab === 'daily_report'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Summary
          </button>
          <button
            onClick={() => setActiveTab('monthly_report')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeTab === 'monthly_report'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Matrix
          </button>
        </div>
      </div>

      {/* Date & Class Selectors Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs items-center">
        {/* Date Selector */}
        <div className="sm:col-span-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="w-full">
            <label className="text-[10px] font-semibold text-slate-500 uppercase block">
              Attendance Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs sm:text-sm font-mono font-medium text-slate-900 focus:border-amber-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Class Selector */}
        <div className="sm:col-span-5">
          <label className="text-[10px] font-semibold text-slate-500 uppercase block">
            Select Class / Program
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-amber-500 focus:outline-hidden"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.shiftTiming || cls.category})
              </option>
            ))}
          </select>
        </div>

        {/* Export / Quick Status */}
        <div className="sm:col-span-3 flex justify-end gap-2 pt-2 sm:pt-4">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {saveStatus && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            saveStatus.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {saveStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* SUB-VIEW 1: MARK DAILY ROLL CALL */}
      {activeTab === 'mark' && (
        <div className="space-y-4">
          {/* Quick Metrics & Bulk Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Quick Metrics */}
            <div className="flex items-center gap-4 text-xs font-medium flex-wrap">
              <span className="text-slate-600">
                Total Enrolled:{' '}
                <strong className="text-slate-900 font-mono">{counts.total}</strong>
              </span>
              <span className="text-emerald-700">
                Present: <strong className="font-mono">{counts.present}</strong>
              </span>
              <span className="text-rose-700">
                Absent: <strong className="font-mono">{counts.absent}</strong>
              </span>
              <span className="text-amber-700">
                Leave: <strong className="font-mono">{counts.leave}</strong>
              </span>
              <span className="text-slate-500">
                Rate: <strong className="text-slate-900 font-mono">{counts.rate}%</strong>
              </span>
            </div>

            {/* Bulk Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-medium">Quick Bulk:</span>
              <button
                type="button"
                onClick={() => handleMarkAll('present')}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
              >
                All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('absent')}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 transition"
              >
                All Absent
              </button>
            </div>
          </div>

          {/* Roll Call Table */}
          <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Roll No.</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Father Name</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Remarks / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.map((student) => {
                    const st = attendanceState[student.id]?.status || 'present';
                    const remarks = attendanceState[student.id]?.remarks || '';

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {student.id}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {student.fullName}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{student.fatherName}</td>

                        {/* Status Buttons Segment */}
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            {/* Present */}
                            <button
                              type="button"
                              onClick={() => handleSetStatus(student.id, 'present')}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                                st === 'present'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                            >
                              P
                            </button>

                            {/* Absent */}
                            <button
                              type="button"
                              onClick={() => handleSetStatus(student.id, 'absent')}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                                st === 'absent'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                              }`}
                            >
                              A
                            </button>

                            {/* Leave */}
                            <button
                              type="button"
                              onClick={() => handleSetStatus(student.id, 'leave')}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                                st === 'leave'
                                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                              }`}
                            >
                              L
                            </button>

                            {/* Late */}
                            <button
                              type="button"
                              onClick={() => handleSetStatus(student.id, 'late')}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                                st === 'late'
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                              }`}
                            >
                              T
                            </button>
                          </div>
                        </td>

                        {/* Remarks Input */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="Optional note (e.g. sick leave)"
                            value={remarks}
                            onChange={(e) => handleSetRemarks(student.id, e.target.value)}
                            className="w-full rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-hidden"
                          />
                        </td>
                      </tr>
                    );
                  })}

                  {classStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        No active students enrolled in this class.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Save Bar */}
            {classStudents.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  Submitting will overwrite or add attendance for{' '}
                  <strong className="text-slate-900">{selectedDate}</strong> without duplicate entries.
                </span>
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  className="w-full sm:w-auto rounded-lg bg-slate-900 px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 active:scale-95 transition shadow-sm"
                >
                  Save Attendance Records
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: DAILY SUMMARY REPORT */}
      {activeTab === 'daily_report' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Class Attendance Summary for {selectedDate}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Real-time attendance rates across all academy programs and classes
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((cls) => {
                const enrolled = students.filter((s) => s.classId === cls.id && s.status === 'active');
                const recs = attendance.filter((a) => a.date === selectedDate && a.classId === cls.id);
                const pCount = recs.filter((a) => a.status === 'present').length;
                const aCount = recs.filter((a) => a.status === 'absent').length;
                const lCount = recs.filter((a) => a.status === 'leave').length;
                const rate = enrolled.length > 0 && recs.length > 0 ? Math.round((pCount / recs.length) * 100) : 0;
                const isMarked = recs.length > 0;

                return (
                  <div key={cls.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 text-xs truncate max-w-[170px]">
                        {cls.name}
                      </span>
                      {isMarked ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          {rate}% Present
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          Not Marked
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-600 mt-3 pt-3 border-t border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Present</span>
                        <strong className="font-mono text-emerald-700">{pCount}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Absent</span>
                        <strong className="font-mono text-rose-700">{aCount}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">On Leave</span>
                        <strong className="font-mono text-amber-700">{lCount}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: MONTHLY ATTENDANCE MATRIX */}
      {activeTab === 'monthly_report' && (
        <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Student Attendance Performance Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculated attendance percentage for active students in {selectedClass?.name}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase">
                <tr>
                  <th className="py-3 px-4">Roll No.</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4 text-center">Sessions Logged</th>
                  <th className="py-3 px-4 text-center">Present</th>
                  <th className="py-3 px-4 text-center">Absent</th>
                  <th className="py-3 px-4 text-center">Leave</th>
                  <th className="py-3 px-4 text-right">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.map((s) => {
                  const studentRecs = attendance.filter((a) => a.studentId === s.id);
                  const pCount = studentRecs.filter((a) => a.status === 'present').length;
                  const aCount = studentRecs.filter((a) => a.status === 'absent').length;
                  const lCount = studentRecs.filter((a) => a.status === 'leave').length;
                  const rate =
                    studentRecs.length > 0 ? Math.round((pCount / studentRecs.length) * 100) : 100;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">{s.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{s.fullName}</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">
                        {studentRecs.length}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-700 font-semibold">
                        {pCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-rose-700 font-semibold">
                        {aCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-amber-700 font-semibold">
                        {lCount}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-mono font-bold ${
                            rate >= 80
                              ? 'text-emerald-700'
                              : rate >= 70
                              ? 'text-amber-700'
                              : 'text-rose-600'
                          }`}
                        >
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
