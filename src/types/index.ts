export type UserRole = 'admin' | 'teacher' | 'accountant';

export type ProgramType = 'academic' | 'computer_vocational' | 'spoken_english';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  department?: string;
}

export interface InstitutionSettings {
  id: string;
  name: string;
  subTitle: string;
  campusBranch: string;
  district: string;
  province: string;
  country: string;
  poweredBy: string;
  code: string;
  phone: string;
  phoneSecondary?: string;
  founderName?: string;
  email: string;
  address: string;
  currencySymbol: string;
  currencyName: string;
  academicYear: string;
  receiptPrefix: string;
  certificatePrefix: string;
  nextReceiptSeq: number;
  nextCertSeq: number;
  principalName: string;
  directorName: string;
  logoUrl?: string;
  isDemoMode: boolean;
}

export interface ClassCourse {
  id: string;
  name: string;
  code: string;
  programType: ProgramType; // 'academic' | 'computer_vocational' | 'spoken_english'
  category: string; // e.g. "School", "College", "Computer Diploma", "Short Course", "Spoken English"
  duration: string; // e.g. "1 Year", "6 Months", "3 Months", "2 Months", "Ongoing"
  shiftTiming: string; // e.g. "Morning 08:30 AM", "Evening 04:00 PM", "Weekend"
  baseMonthlyFee: number;
  admissionFee: number;
  assignedTeacherId?: string;
  assignedTeacherName?: string;
  room?: string;
  capacity: number;
  status: 'active' | 'inactive';
  subjects?: string[];
  description?: string;
  createdAt: string;
}

export type StudentStatus = 'active' | 'inactive' | 'completed' | 'archived';

export interface Student {
  id: string; // e.g. "AUI-2026-001"
  fullName: string;
  fatherName: string;
  photoUrl?: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  phone: string;
  guardianContact: string;
  email?: string;
  address: string;
  admissionDate: string; // YYYY-MM-DD
  programType: ProgramType;
  classId: string;
  className: string;
  batch: string; // Shift or Batch timing
  arrivalTime?: string; // e.g. "08:30 AM"
  departureTime?: string; // e.g. "11:30 AM"
  classDays?: string; // e.g. "Monday to Friday", "Mon, Wed, Fri", "Weekend"
  scheduleNotes?: string; // e.g. "Lab 1 / Room 3"
  admissionFee: number;
  monthlyFee: number;
  discount: number;
  discountReason?: string;
  netMonthlyFee: number; // monthlyFee - discount
  status: StudentStatus;
  notes?: string;
  createdAt: string;
}

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'EasyPaisa/JazzCash' | 'Online Card' | 'Cheque';

export interface FeePayment {
  id: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  fatherName: string;
  className: string;
  programType: ProgramType;
  feeType: 'Monthly Tuition' | 'Admission Fee' | 'Full Course Fee' | 'Examination Fee';
  billingMonth: string; // e.g. "October 2026"
  totalDue: number;
  amountPaid: number;
  balanceRemaining: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  receivedBy: string;
  notes?: string;
  isPartial: boolean;
  createdAt: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'late';

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  classId: string;
  programType: ProgramType;
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  markedBy: string;
  remarks?: string;
  timestamp: string;
}

export interface SubjectMarks {
  name: string;
  totalMarks: number;
  obtainedMarks: number;
}

export interface ExamResult {
  id: string;
  examName: string; // e.g. "Midterm Exam 2026", "Final Project Assessment", "Viva Assessment"
  date: string;
  studentId: string;
  studentName: string;
  fatherName: string;
  classId: string;
  className: string;
  programType: ProgramType;
  subjects: SubjectMarks[];
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  status: 'Pass' | 'Fail';
  remarks?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  fatherName?: string;
  designation: string; // e.g. "Senior IT Instructor", "Spoken English Trainer", "Senior Science Teacher", "Admin Officer"
  department: string; // e.g. "Computer Academy", "Language Wing", "School & College", "Administration"
  qualification: string;
  phone: string;
  email?: string;
  monthlySalary: number;
  joiningDate: string;
  assignedCourses: string[];
  status: 'active' | 'inactive';
}

export interface StaffSalaryPayment {
  id: string;
  staffId: string;
  staffName: string;
  salaryMonth: string; // e.g. "October 2026"
  basicSalary: number;
  allowance: number;
  deduction: number;
  netPaid: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  status: 'paid' | 'pending';
  receiptRef: string;
  notes?: string;
}

export interface CertificateRecord {
  id: string;
  certificateNumber: string; // e.g. "AUI-CERT-2026-089"
  studentId: string;
  studentName: string;
  fatherName: string;
  courseTitle: string;
  programType: ProgramType;
  duration: string;
  issueDate: string;
  completionDate: string;
  gradeAchieved: string;
  remarks: string;
  issuedBy: string;
}

export interface DatabaseState {
  settings: InstitutionSettings;
  users: User[];
  classes: ClassCourse[];
  students: Student[];
  payments: FeePayment[];
  attendance: AttendanceRecord[];
  exams: ExamResult[];
  staff: StaffMember[];
  salaries: StaffSalaryPayment[];
  certificates: CertificateRecord[];
  lastBackupDate?: string;
}
