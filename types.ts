export enum Role {
  ADMIN = 'admin',
  STUDENT = 'student',
  COORDINATOR = 'coordinator'
}

export type GroupRole = 'Group Member Only' | 'Group Leader';

export interface Intake {
  id: string;
  name: string;
  description: string;
  academicYear: string;
  status: 'active' | 'archived';
}

export interface User {
  id: string;
  registrationNumber: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: Role;
  course?: string;
  session?: string;
  yearOfStudy?: string;
  semester?: string;
  telephone?: string;
  groupRole?: GroupRole;
  passwordResetToken?: string;
  passwordResetExpires?: string;
  forcePasswordChange?: boolean;
  managedCourseId?: string;
  managedSession?: string;
  intakeId?: string;
}

export interface CourseUnit {
  id: string;
  courseCode: string;
  courseName: string;
  creditHours?: number;
  semester: string;
  academicYear: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
}

export interface Mark {
  id: string;
  enrollmentId: string;
  cats: number;
  coursework: number;
  finalExam: number;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
}

export interface MCQTest {
  id: string;
  courseId: string;
  title: string;
  description: string;
  durationMinutes: number;
  dueDate: string;
  questions: Question[];
  createdAt: string;
}

export interface TestSubmission {
  id: string;
  testId: string;
  studentId: string;
  answers: number[]; // Index of selected option for each question
  score: number;
  totalQuestions: number;
  submittedAt: string;
}

export interface GroupMember {
  id: string;
  fullName: string;
  registrationNumber: string;
}

export interface GroupProfile {
  leaderId: string;
  groupName: string;
  projectBrief: string;
  members: GroupMember[];
  assignment?: {
    name: string;
    type: string;
    data: string;
  };
}

export interface Notification {
  id: string;
  courseId: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface SystemSettings {
  allowStudentRegistration: boolean;
  globalNotification: {
    enabled: boolean;
    message: string;
    id: string;
  };
  theme: 'light' | 'dark' | 'system';
}

export type BulkStudentData = Omit<User, 'id' | 'passwordHash' | 'role' | 'forcePasswordChange'> & {
  password: string;
  enrollCourseCodes: string[];
};

export interface DataContextType {
    currentUser: User | null;
    users: User[];
    courses: CourseUnit[];
    intakes: Intake[];
    enrollments: Enrollment[];
    marks: Mark[];
    mcqTests: MCQTest[];
    testSubmissions: TestSubmission[];
    groupProfiles: GroupProfile[];
    notifications: Notification[];
    systemSettings: SystemSettings;
    login: (registrationNumber: string, password: string, rememberMe: boolean, role?: Role) => Promise<User | null>;
    logout: () => void;
    registerStudent: (studentData: Omit<User, 'id' | 'passwordHash' | 'role'> & {password: string}) => Promise<User | null>;
    addIntake: (intakeData: Omit<Intake, 'id'>) => Promise<void>;
    updateIntake: (intakeData: Intake) => Promise<void>;
    deleteIntake: (intakeId: string) => Promise<void>;
    addCourse: (courseData: Omit<CourseUnit, 'id'>) => Promise<void>;
    updateCourse: (courseData: CourseUnit) => Promise<void>;
    deleteCourse: (courseId: string) => Promise<void>;
    enrollInCourse: (studentId: string, courseId: string) => Promise<void>;
    unenrollFromCourse: (studentId: string, courseId: string) => Promise<void>;
    getEnrollment: (studentId: string, courseId: string) => Enrollment | undefined;
    getMarksForEnrollment: (enrollmentId: string) => Mark | undefined;
    updateMarks: (enrollmentId: string, newMarks: Omit<Mark, 'id' | 'enrollmentId'>) => Promise<void>;
    bulkUpdateMarks: (marksToUpdate: Array<Omit<Mark, 'id'>>) => Promise<void>;
    updateGroupProfile: (profileData: Omit<GroupProfile, 'leaderId'>) => Promise<void>;
    updateStudentByAdmin: (studentId: string, studentData: Partial<Omit<User, 'id' | 'role' | 'passwordHash'>>) => Promise<void>;
    deleteStudent: (studentId: string) => Promise<void>;
    updateStudentEnrollments: (studentId: string, courseIds: string[]) => Promise<void>;
    sendNotification: (notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => Promise<void>;
    bulkRegisterAndEnrollStudents: (studentsData: BulkStudentData[]) => Promise<{successCount: number; errors: string[]}>;
    updateSystemSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
    updateUserRole: (userId: string, newRole: Role, managedCourseId?: string, managedSession?: string) => Promise<void>;
    requestPasswordReset: (identifier: string) => Promise<boolean>;
    resetPassword: (token: string, newPassword: string) => Promise<boolean>;
    bulkUnenrollStudentsFromCourse: (studentIds: string[], courseId: string) => Promise<void>;
    bulkUpdateStudentIntake: (studentIds: string[], intakeId: string | null) => Promise<void>;
    markStudentNotificationsAsRead: (studentId: string) => Promise<void>;
    markAllNotificationsAsRead: () => Promise<void>;
    clearAllNotifications: () => Promise<void>;
    changePassword: (userId: string, newPassword: string) => Promise<void>;
    createDefaultAdmin: () => Promise<boolean>;
    setCurrentUser: (user: User | null) => void;
    addMCQTest: (testData: Omit<MCQTest, 'id' | 'createdAt'>) => Promise<void>;
    deleteMCQTest: (testId: string) => Promise<void>;
    submitTest: (submission: Omit<TestSubmission, 'id' | 'submittedAt'>) => Promise<void>;
    updateSubmission: (submission: TestSubmission) => Promise<void>;
    deleteSubmission: (submissionId: string) => Promise<void>;
}