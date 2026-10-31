import { 
  DatabaseState, 
  Student, 
  FeePayment, 
  AttendanceRecord, 
  ClassCourse, 
  InstitutionSettings,
  ExamResult,
  StaffMember,
  StaffSalaryPayment,
  CertificateRecord,
  ProgramType
} from '../types';
import { initialDatabase } from '../data/initialData';
import { AuthService } from './auth';

const LOCAL_STORAGE_KEY = 'aui_institute_haveli_lakha_v3';

export class StorageService {
  private static memoryDb: DatabaseState | null = null;
  private static isServerSynced = false;

  private static getAuthHeaders(includeContentType = false): Record<string, string> {
    const headers: Record<string, string> = {};
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    const token = AuthService.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  public static async init(): Promise<DatabaseState> {
    // 1. Try to fetch from server API
    try {
      const response = await fetch('/api/db', {
        headers: this.getAuthHeaders(),
        cache: 'no-store',
      });
      if (response.ok) {
        const serverData: DatabaseState = await response.json();
        // Check if server data needs merging with new schema fields
        const mergedData: DatabaseState = {
          ...initialDatabase,
          ...serverData,
          settings: { ...initialDatabase.settings, ...serverData.settings },
          exams: Array.isArray(serverData.exams) ? serverData.exams : initialDatabase.exams,
          staff: Array.isArray(serverData.staff) ? serverData.staff : initialDatabase.staff,
          salaries: Array.isArray(serverData.salaries) ? serverData.salaries : initialDatabase.salaries,
          certificates: Array.isArray(serverData.certificates) ? serverData.certificates : initialDatabase.certificates,
        };
        this.memoryDb = mergedData;
        this.isServerSynced = true;
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedData));
        } catch (e) {
          console.warn('LocalStorage save failed:', e);
        }
        return mergedData;
      }
    } catch (e) {
      console.warn('[Storage] Server fetch failed, using local offline copy:', e);
    }

    // 2. Fallback to localStorage
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        const mergedData: DatabaseState = {
          ...initialDatabase,
          ...parsed,
          settings: { ...initialDatabase.settings, ...parsed.settings },
          exams: Array.isArray(parsed.exams) ? parsed.exams : initialDatabase.exams,
          staff: Array.isArray(parsed.staff) ? parsed.staff : initialDatabase.staff,
          salaries: Array.isArray(parsed.salaries) ? parsed.salaries : initialDatabase.salaries,
          certificates: Array.isArray(parsed.certificates) ? parsed.certificates : initialDatabase.certificates,
        };
        this.memoryDb = mergedData;
        return this.memoryDb;
      }
    } catch (e) {
      console.warn('LocalStorage read error:', e);
    }

    // 3. Fallback to initial seed database
    this.memoryDb = initialDatabase;
    return this.memoryDb;
  }

  public static getDatabase(): DatabaseState {
    if (!this.memoryDb) {
      try {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          this.memoryDb = JSON.parse(local);
          return this.memoryDb!;
        }
      } catch (e) {
        // ignore
      }
      this.memoryDb = initialDatabase;
    }
    return this.memoryDb;
  }

  public static async saveDatabase(newState: DatabaseState): Promise<boolean> {
    this.memoryDb = newState;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.warn('LocalStorage write failed:', e);
    }

    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: this.getAuthHeaders(true),
        body: JSON.stringify(newState),
      });
      if (res.ok) {
        this.isServerSynced = true;
        return true;
      }
    } catch (e) {
      console.warn('[Storage] Server sync failed (offline mode):', e);
      this.isServerSynced = false;
    }
    return true;
  }

  // Calculate student financial ledger (includes admission fee + monthly dues)
  public static getStudentFinancials(studentId: string, db?: DatabaseState) {
    const data = db || this.getDatabase();
    const student = data.students.find((s) => s.id === studentId);
    if (!student) {
      return { 
        monthsEnrolled: 0, 
        netMonthly: 0, 
        admissionFee: 0, 
        totalBilled: 0, 
        totalPaid: 0, 
        outstandingBalance: 0, 
        payments: [] 
      };
    }

    const studentPayments = data.payments.filter((p) => p.studentId === studentId);
    const totalPaid = studentPayments.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);

    const admission = new Date(student.admissionDate);
    const now = new Date();
    let monthsEnrolled = (now.getFullYear() - admission.getFullYear()) * 12 + (now.getMonth() - admission.getMonth()) + 1;
    if (monthsEnrolled < 1) monthsEnrolled = 1;
    if (monthsEnrolled > 24) monthsEnrolled = 24;

    const netMonthly = Number(student.netMonthlyFee ?? (student.monthlyFee - student.discount));
    const admissionFee = Number(student.admissionFee || 0);
    const totalBilled = admissionFee + (netMonthly * monthsEnrolled);
    const outstandingBalance = Math.max(0, totalBilled - totalPaid);

    return {
      monthsEnrolled,
      netMonthly,
      admissionFee,
      totalBilled,
      totalPaid,
      outstandingBalance,
      payments: studentPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()),
    };
  }

  // Record a payment with validation and duplicate prevention
  public static async recordPayment(paymentData: {
    studentId: string;
    billingMonth: string;
    feeType?: FeePayment['feeType'];
    amountPaid: number;
    paymentMethod: FeePayment['paymentMethod'];
    referenceNumber: string;
    receivedBy: string;
    notes?: string;
  }): Promise<{ success: boolean; error?: string; payment?: FeePayment; receiptNumber?: string }> {
    const db = this.getDatabase();
    const student = db.students.find((s) => s.id === paymentData.studentId);
    if (!student) {
      return { success: false, error: 'Student not found in registry.' };
    }

    if (!paymentData.amountPaid || paymentData.amountPaid <= 0) {
      return { success: false, error: 'Payment amount must be greater than zero.' };
    }

    // Duplicate check
    const cleanRef = paymentData.referenceNumber.trim();
    if (cleanRef) {
      const duplicateRef = db.payments.find(
        (p) => p.referenceNumber.toLowerCase() === cleanRef.toLowerCase()
      );
      if (duplicateRef) {
        return {
          success: false,
          error: `Duplicate payment detected! Reference #${cleanRef} was already recorded for receipt ${duplicateRef.receiptNumber} on ${duplicateRef.paymentDate}.`,
        };
      }
    }

    const financials = this.getStudentFinancials(student.id, db);
    const totalDue = financials.outstandingBalance > 0 ? financials.outstandingBalance : financials.netMonthly;
    const amountPaid = Number(paymentData.amountPaid);
    const balanceRemaining = Math.max(0, totalDue - amountPaid);
    const isPartial = balanceRemaining > 0;

    const seq = db.settings.nextReceiptSeq || 1001;
    const receiptNumber = `${db.settings.receiptPrefix || 'AUI-REC-'}${seq}`;

    const newPayment: FeePayment = {
      id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      receiptNumber,
      studentId: student.id,
      studentName: student.fullName,
      fatherName: student.fatherName,
      className: student.className,
      programType: student.programType || 'academic',
      feeType: paymentData.feeType || 'Monthly Tuition',
      billingMonth: paymentData.billingMonth,
      totalDue,
      amountPaid,
      balanceRemaining,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: paymentData.paymentMethod,
      referenceNumber: cleanRef || `REF-${seq}`,
      receivedBy: paymentData.receivedBy || 'Accounts Officer',
      notes: paymentData.notes || '',
      isPartial,
      createdAt: new Date().toISOString(),
    };

    const updatedState: DatabaseState = {
      ...db,
      settings: {
        ...db.settings,
        nextReceiptSeq: seq + 1,
      },
      payments: [newPayment, ...db.payments],
    };

    await this.saveDatabase(updatedState);
    return { success: true, payment: newPayment, receiptNumber };
  }

  // Attendance management: atomic upsert preventing duplicate attendance
  public static async saveAttendanceBatch(
    date: string,
    classId: string,
    records: Array<{ studentId: string; status: AttendanceRecord['status']; remarks?: string }>,
    markedBy: string
  ): Promise<{ success: boolean; count: number }> {
    const db = this.getDatabase();
    const studentsMap = new Map(db.students.map((s) => [s.id, s]));
    const selectedClass = db.classes.find((c) => c.id === classId);
    const programType = selectedClass?.programType || 'academic';

    const filteredAttendance = db.attendance.filter(
      (a) => !(a.date === date && a.classId === classId)
    );

    const newAttendanceRecords: AttendanceRecord[] = records.map((r) => {
      const st = studentsMap.get(r.studentId);
      return {
        id: `att-${date.replace(/-/g, '')}-${r.studentId}`,
        date,
        classId,
        programType: st?.programType || programType,
        studentId: r.studentId,
        studentName: st?.fullName || 'Unknown Student',
        status: r.status,
        markedBy,
        remarks: r.remarks || '',
        timestamp: new Date().toISOString(),
      };
    });

    const updatedState: DatabaseState = {
      ...db,
      attendance: [...newAttendanceRecords, ...filteredAttendance],
    };

    await this.saveDatabase(updatedState);
    return { success: true, count: newAttendanceRecords.length };
  }

  // Examinations & Results
  public static async saveExamResult(result: ExamResult): Promise<boolean> {
    const db = this.getDatabase();
    const existingIndex = db.exams.findIndex((e) => e.id === result.id);
    let updatedExams: ExamResult[];

    if (existingIndex >= 0) {
      updatedExams = [...db.exams];
      updatedExams[existingIndex] = result;
    } else {
      updatedExams = [result, ...db.exams];
    }

    const updatedDb: DatabaseState = { ...db, exams: updatedExams };
    return await this.saveDatabase(updatedDb);
  }

  public static async deleteExamResult(id: string): Promise<boolean> {
    const db = this.getDatabase();
    const updatedDb: DatabaseState = {
      ...db,
      exams: db.exams.filter((e) => e.id !== id),
    };
    return await this.saveDatabase(updatedDb);
  }

  // Staff and Salary Management
  public static async saveStaffMember(staff: StaffMember): Promise<boolean> {
    const db = this.getDatabase();
    const existingIndex = db.staff.findIndex((s) => s.id === staff.id);
    let updatedStaff: StaffMember[];

    if (existingIndex >= 0) {
      updatedStaff = [...db.staff];
      updatedStaff[existingIndex] = staff;
    } else {
      updatedStaff = [staff, ...db.staff];
    }

    const updatedDb: DatabaseState = { ...db, staff: updatedStaff };
    return await this.saveDatabase(updatedDb);
  }

  public static async recordSalaryPayment(salary: StaffSalaryPayment): Promise<boolean> {
    const db = this.getDatabase();
    const updatedDb: DatabaseState = {
      ...db,
      salaries: [salary, ...db.salaries],
    };
    return await this.saveDatabase(updatedDb);
  }

  // Certificates
  public static async issueCertificate(certData: Omit<CertificateRecord, 'id' | 'certificateNumber'>): Promise<CertificateRecord> {
    const db = this.getDatabase();
    const seq = db.settings.nextCertSeq || 501;
    const certNum = `${db.settings.certificatePrefix || 'AUI-CERT-'}${new Date().getFullYear()}-${seq}`;

    const newCert: CertificateRecord = {
      ...certData,
      id: `cert-${Date.now()}`,
      certificateNumber: certNum,
    };

    const updatedDb: DatabaseState = {
      ...db,
      settings: {
        ...db.settings,
        nextCertSeq: seq + 1,
      },
      certificates: [newCert, ...db.certificates],
    };

    await this.saveDatabase(updatedDb);
    return newCert;
  }

  // Backup & Restore
  public static downloadJsonBackup() {
    const db = this.getDatabase();
    const dateStr = new Date().toISOString().split('T')[0];
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Anwaar-Ul-Islam-Institute-Backup-${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  public static async restoreFromJson(jsonString: string): Promise<{ success: boolean; error?: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.settings || !Array.isArray(parsed.students) || !Array.isArray(parsed.classes)) {
        return { success: false, error: 'Invalid backup format. Required fields missing.' };
      }
      await this.saveDatabase(parsed);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to parse JSON file' };
    }
  }

  public static async resetDatabase(mode: 'demo' | 'clean'): Promise<DatabaseState> {
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: this.getAuthHeaders(true),
        body: JSON.stringify({ mode }),
      });
      if (res.ok) {
        const data = await res.json();
        this.memoryDb = data.database;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.memoryDb));
        return this.memoryDb!;
      }
    } catch (e) {
      console.warn('API reset failed, falling back to local reset:', e);
    }

    if (mode === 'demo') {
      this.memoryDb = initialDatabase;
    } else {
      this.memoryDb = {
        ...initialDatabase,
        settings: {
          ...initialDatabase.settings,
          name: 'ANWAAR-UL-ISLAM TECHNICAL INSTITUTE',
          subTitle: 'Haveli Lakha, District Okara',
          isDemoMode: false,
          nextReceiptSeq: 1001,
          nextCertSeq: 501,
        },
        students: [],
        payments: [],
        attendance: [],
        exams: [],
        salaries: [],
        certificates: [],
      };
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.memoryDb));
    return this.memoryDb!;
  }
}

// CSV Export Utilities
export const CSVUtils = {
  downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  escapeCSV(val: any): string {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  },

  exportStudents(students: Student[], classesMap: Map<string, string>) {
    const headers = [
      'Student ID',
      'Full Name',
      'Father Name',
      'Wing / Category',
      'Class / Course',
      'Batch / Shift',
      'Phone Number',
      'Guardian Contact',
      'Admission Date',
      'Admission Fee',
      'Monthly Fee',
      'Discount',
      'Net Monthly Fee',
      'Status',
      'Gender',
      'Address',
    ];

    const rows = students.map((s) => [
      s.id,
      s.fullName,
      s.fatherName,
      s.programType === 'academic' ? 'School/College' : s.programType === 'computer_vocational' ? 'Computer Academy' : 'Spoken English',
      classesMap.get(s.classId) || s.className,
      s.batch,
      s.phone,
      s.guardianContact,
      s.admissionDate,
      s.admissionFee || 0,
      s.monthlyFee,
      s.discount,
      s.netMonthlyFee,
      s.status,
      s.gender || 'N/A',
      s.address || 'N/A',
    ]);

    const csv = [headers.map(this.escapeCSV).join(','), ...rows.map((row) => row.map(this.escapeCSV).join(','))].join(
      '\n'
    );
    const date = new Date().toISOString().split('T')[0];
    this.downloadCSV(csv, `AUI-Students-Directory-${date}.csv`);
  },

  exportDefaulters(
    defaulters: Array<{
      id: string;
      fullName: string;
      fatherName: string;
      className: string;
      phone: string;
      netMonthly: number;
      totalPaid: number;
      outstandingBalance: number;
      lastPaymentDate?: string;
    }>
  ) {
    const headers = [
      'Student ID',
      'Full Name',
      'Father Name',
      'Class / Course',
      'Phone Number',
      'Net Monthly Fee',
      'Total Paid',
      'Outstanding Dues',
      'Last Payment Date',
    ];

    const rows = defaulters.map((d) => [
      d.id,
      d.fullName,
      d.fatherName,
      d.className,
      d.phone,
      d.netMonthly,
      d.totalPaid,
      d.outstandingBalance,
      d.lastPaymentDate || 'Never Paid',
    ]);

    const csv = [headers.map(this.escapeCSV).join(','), ...rows.map((row) => row.map(this.escapeCSV).join(','))].join(
      '\n'
    );
    const date = new Date().toISOString().split('T')[0];
    this.downloadCSV(csv, `AUI-Unpaid-Defaulters-${date}.csv`);
  },

  exportPayments(payments: FeePayment[]) {
    const headers = [
      'Receipt No',
      'Payment Date',
      'Student ID',
      'Student Name',
      'Father Name',
      'Class / Course',
      'Program Wing',
      'Fee Type',
      'Billing Month',
      'Amount Paid',
      'Balance Remaining',
      'Payment Method',
      'Reference No',
      'Received By',
    ];

    const rows = payments.map((p) => [
      p.receiptNumber,
      p.paymentDate,
      p.studentId,
      p.studentName,
      p.fatherName,
      p.className,
      p.programType,
      p.feeType,
      p.billingMonth,
      p.amountPaid,
      p.balanceRemaining,
      p.paymentMethod,
      p.referenceNumber,
      p.receivedBy,
    ]);

    const csv = [headers.map(this.escapeCSV).join(','), ...rows.map((row) => row.map(this.escapeCSV).join(','))].join(
      '\n'
    );
    const date = new Date().toISOString().split('T')[0];
    this.downloadCSV(csv, `AUI-Fee-Payments-Ledger-${date}.csv`);
  },

  exportExams(exams: ExamResult[]) {
    const headers = [
      'Exam ID',
      'Examination Name',
      'Date',
      'Roll No',
      'Student Name',
      'Father Name',
      'Class / Program',
      'Total Marks',
      'Obtained Marks',
      'Percentage',
      'Grade',
      'Status',
      'Remarks',
    ];

    const rows = exams.map((e) => [
      e.id,
      e.examName,
      e.date,
      e.studentId,
      e.studentName,
      e.fatherName,
      e.className,
      e.totalMarks,
      e.obtainedMarks,
      `${e.percentage}%`,
      e.grade,
      e.status,
      e.remarks || '',
    ]);

    const csv = [headers.map(this.escapeCSV).join(','), ...rows.map((row) => row.map(this.escapeCSV).join(','))].join(
      '\n'
    );
    const date = new Date().toISOString().split('T')[0];
    this.downloadCSV(csv, `AUI-Examinations-Report-${date}.csv`);
  },

  exportStaff(staff: StaffMember[]) {
    const headers = [
      'Staff ID',
      'Name',
      'Designation',
      'Department',
      'Qualification',
      'Phone',
      'Monthly Salary',
      'Joining Date',
      'Assigned Courses',
      'Status',
    ];

    const rows = staff.map((s) => [
      s.id,
      s.name,
      s.designation,
      s.department,
      s.qualification,
      s.phone,
      s.monthlySalary,
      s.joiningDate,
      s.assignedCourses.join('; '),
      s.status,
    ]);

    const csv = [headers.map(this.escapeCSV).join(','), ...rows.map((row) => row.map(this.escapeCSV).join(','))].join(
      '\n'
    );
    const date = new Date().toISOString().split('T')[0];
    this.downloadCSV(csv, `AUI-Staff-Register-${date}.csv`);
  },

  exportAttendance(records: AttendanceRecord[], dateStr?: string, className?: string) {
    const headers = [
      'Record ID',
      'Date',
      'Class / Program',
      'Student ID',
      'Student Name',
      'Status',
      'Marked By',
      'Remarks',
      'Timestamp',
    ];

    const rows = records.map((r) => [
      r.id,
      r.date,
      className || r.classId,
      r.studentId,
      r.studentName,
      r.status.toUpperCase(),
      r.markedBy,
      r.remarks || '',
      r.timestamp,
    ]);

    const csv = [headers.map(this.escapeCSV).join(','), ...rows.map((row) => row.map(this.escapeCSV).join(','))].join(
      '\n'
    );
    const date = dateStr || new Date().toISOString().split('T')[0];
    const cleanClass = (className || 'Attendance').replace(/[^a-zA-Z0-9-_]/g, '_');
    this.downloadCSV(csv, `AUI-Attendance-${cleanClass}-${date}.csv`);
  },
};
