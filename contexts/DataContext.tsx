import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { User, CourseUnit, Enrollment, Mark, Role, GroupProfile, Notification, SystemSettings, DataContextType, MCQTest, TestSubmission, Intake } from '../types';
import { api } from '../utils/api';
import { supabase } from '../utils/supabase';

const ADMIN_USERNAME = 'admin';
const ADMIN_HASH = '240be518fabd2724ddb6f0403f5d565a44403970fd05f010c60039202651f557'; // admin123

const simpleHash = async (password: string) => {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
        console.error("Hashing failed:", e);
        return "";
    }
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [courses, setCourses] = useState<CourseUnit[]>([]);
    const [intakes, setIntakes] = useState<Intake[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [marks, setMarks] = useState<Mark[]>([]);
    const [mcqTests, setMcqTests] = useState<MCQTest[]>([]);
    const [testSubmissions, setTestSubmissions] = useState<TestSubmission[]>([]);
    const [groupProfiles, setGroupProfiles] = useState<GroupProfile[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [systemSettings, setSystemSettings] = useState<SystemSettings>({
        allowStudentRegistration: true,
        globalNotification: { enabled: false, message: '', id: '' },
        theme: 'system',
    });
    
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        try {
            const rememberedUser = localStorage.getItem('currentUser');
            if (rememberedUser && rememberedUser !== "undefined") {
                const parsed = JSON.parse(rememberedUser);
                return (parsed && parsed.role) ? parsed : null;
            }
            const sessionUser = sessionStorage.getItem('currentUser');
            if (sessionUser && sessionUser !== "undefined") {
                const parsed = JSON.parse(sessionUser);
                return (parsed && parsed.role) ? parsed : null;
            }
        } catch (e) {}
        return null;
    });

    const [isLoading, setIsLoading] = useState(true);
    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await api.fetchAllData();
            setUsers(data.users || []);
            setCourses(data.courses || []);
            setIntakes(data.intakes || []);
            setEnrollments(data.enrollments || []);
            setMarks(data.marks || []);
            setMcqTests(data.mcqTests || []);
            setTestSubmissions(data.testSubmissions || []);
            setGroupProfiles(data.groupProfiles || []);
            setNotifications(data.notifications || []);
            if (data.systemSettings) setSystemSettings(data.systemSettings);
        } catch (err) {
            console.error("Data Load Error:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const toSnakeCase = (obj: any) => {
      if (!obj || typeof obj !== 'object') return obj;
      const newObj: any = {};
      for (const key in obj) {
        newObj[key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)] = obj[key];
      }
      return newObj;
    };

    const login = async (registrationNumber: string, password: string, rememberMe: boolean, role?: Role): Promise<User | null> => {
        const cleanRegNum = registrationNumber.trim();
        const lowerRegNum = cleanRegNum.toLowerCase();
        if (lowerRegNum === ADMIN_USERNAME && password === 'admin123') {
            const fallbackAdmin: User = { id: 'admin-001', registrationNumber: 'admin', fullName: 'System Administrator', email: 'admin@system.com', passwordHash: ADMIN_HASH, role: Role.ADMIN, forcePasswordChange: false };
            setCurrentUser(fallbackAdmin);
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('currentUser', JSON.stringify(fallbackAdmin));
            return fallbackAdmin;
        }
        try {
            const inputHash = await simpleHash(password);
            const { data, error: sbError } = await supabase.from('users').select('*').ilike('registration_number', cleanRegNum).maybeSingle();
            if (sbError || !data) return null;
            
            const user: User = { 
                id: data.id, 
                registrationNumber: data.registration_number, 
                fullName: data.full_name, 
                email: data.email, 
                passwordHash: data.password_hash, 
                role: data.role as Role, 
                course: data.course, 
                session: data.session, 
                yearOfStudy: data.year_of_study, 
                semester: data.semester, 
                telephone: data.telephone, 
                groupRole: data.group_role, 
                forcePasswordChange: data.force_password_change, 
                managedCourseId: data.managed_course_id, 
                managedSession: data.managed_session,
                intakeId: data.intake_id
            };
            if (user.passwordHash !== inputHash) return null;
            if (role && user.role !== role && user.role !== Role.ADMIN) return null;
            setCurrentUser(user);
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('currentUser', JSON.stringify(user));
            return user;
        } catch (e) { console.error("Login logic crash:", e); }
        return null;
    };

    const createDefaultAdmin = async (): Promise<boolean> => {
        try {
            await supabase.from('users').delete().eq('registration_number', 'admin');
            const { error } = await supabase.from('users').insert({ id: 'admin-001', registration_number: 'admin', full_name: 'System Administrator', email: 'admin@system.com', password_hash: ADMIN_HASH, role: 'admin', force_password_change: false });
            if (error) throw error;
            await loadData();
            return true;
        } catch (e) { console.error("Failed to create admin:", e); return false; }
    };

    const logout = () => { setCurrentUser(null); sessionStorage.removeItem('currentUser'); localStorage.removeItem('currentUser'); };
    
    const getEnrollment = (studentId: string, courseId: string) => enrollments.find(e => e.studentId === studentId && e.courseId === courseId);
    const getMarksForEnrollment = (enrollmentId: string) => marks.find(m => m.enrollmentId === enrollmentId);

    const registerStudent = async (studentData: Omit<User, 'id' | 'passwordHash' | 'role'> & {password: string}): Promise<User | null> => {
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .ilike('registration_number', studentData.registrationNumber.trim())
            .maybeSingle();
            
        if (existingUser) return null;

        const passwordHash = await simpleHash(studentData.password);
        const { password, ...studentDetails } = studentData;
        const newUser: User = { id: `user-${crypto.randomUUID()}`, ...studentDetails, passwordHash, role: Role.STUDENT, forcePasswordChange: true };
        const { error } = await supabase.from('users').insert(toSnakeCase(newUser));
        
        if (error) {
            if (error.code === '23505') return null;
            throw new Error(`Registration failed: ${error.message}`);
        }
        
        setUsers(prev => [...prev, newUser]);
        return newUser;
    };

    const addIntake = async (intakeData: Omit<Intake, 'id'>) => {
        const newIntake: Intake = { id: `intake-${crypto.randomUUID()}`, ...intakeData };
        await supabase.from('intakes').insert(toSnakeCase(newIntake));
        setIntakes(prev => [...prev, newIntake]);
    };

    const updateIntake = async (updatedIntake: Intake) => {
        await supabase.from('intakes').update(toSnakeCase(updatedIntake)).eq('id', updatedIntake.id);
        setIntakes(prev => prev.map(i => i.id === updatedIntake.id ? updatedIntake : i));
    };

    const deleteIntake = async (intakeId: string) => {
        await api.deleteIntakeWithRelations(intakeId);
        setIntakes(prev => prev.filter(i => i.id !== intakeId));
        setUsers(prev => prev.map(u => u.intakeId === intakeId ? { ...u, intakeId: undefined } : u));
    };

    const addCourse = async (courseData: Omit<CourseUnit, 'id'>) => {
        const newCourse: CourseUnit = { id: `course-${crypto.randomUUID()}`, ...courseData };
        await supabase.from('courses').insert(toSnakeCase(newCourse));
        setCourses(prev => [...prev, newCourse]);
    };
    
    const updateCourse = async (updatedCourse: CourseUnit) => {
        await supabase.from('courses').update(toSnakeCase(updatedCourse)).eq('id', updatedCourse.id);
        setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
    };

    const deleteCourse = async (courseId: string) => {
        await api.deleteCourseWithRelations(courseId);
        setCourses(prev => prev.filter(c => c.id !== courseId));
    };

    const enrollInCourse = async (studentId: string, courseId: string) => {
        const newEnrollment: Enrollment = { id: `enrol-${crypto.randomUUID()}`, studentId, courseId };
        await supabase.from('enrollments').insert(toSnakeCase(newEnrollment));
        setEnrollments(prev => [...prev, newEnrollment]);
    };

    const unenrollFromCourse = async (studentId: string, courseId: string) => {
        const enrollment = getEnrollment(studentId, courseId);
        if (enrollment) {
            await api.deleteMultiple('marks', 'enrollment_id', [enrollment.id]);
            await api.deleteMultiple('enrollments', 'id', [enrollment.id]);
            setEnrollments(prev => prev.filter(e => e.id !== enrollment.id));
            setMarks(prev => prev.filter(m => m.enrollmentId !== enrollment.id));
        }
    };

    const updateMarks = async (enrollmentId: string, newMarksData: Omit<Mark, 'id' | 'enrollmentId'>) => {
        const markToUpsert = { id: `mark-${enrollmentId}`, enrollmentId, ...newMarksData };
        await api.saveMultiple('marks', [markToUpsert]);
        setMarks(prev => {
            const existing = prev.find(m => m.enrollmentId === enrollmentId);
            if(existing) return prev.map(m => m.enrollmentId === enrollmentId ? {...existing, ...newMarksData} : m);
            return [...prev, markToUpsert];
        });
    };

    const bulkUpdateMarks = async (marksToUpdate: Array<Omit<Mark, 'id'>>) => {
        const marksWithIds = marksToUpdate.map(m => ({ id: `mark-${m.enrollmentId}`, ...m }));
        await api.saveMultiple('marks', marksWithIds);
        const marksMap = new Map(marks.map(m => [m.enrollmentId, m]));
        marksWithIds.forEach(update => marksMap.set(update.enrollmentId, update));
        setMarks(Array.from(marksMap.values()));
    };

    const addMCQTest = async (testData: Omit<MCQTest, 'id' | 'createdAt'>) => {
        const newTest: MCQTest = { id: `test-${crypto.randomUUID()}`, createdAt: new Date().toISOString(), ...testData };
        await supabase.from('mcq_tests').insert(toSnakeCase(newTest));
        setMcqTests(prev => [...prev, newTest]);
        
        const course = courses.find(c => c.id === testData.courseId);
        if (course) {
            await sendNotification({
                courseId: course.id,
                title: 'New MCQ Test Available',
                message: `A new test "${testData.title}" has been posted for ${course.courseCode}. Due: ${new Date(testData.dueDate).toLocaleDateString()}.`
            });
        }
    };

    const deleteMCQTest = async (testId: string) => {
        await supabase.from('mcq_submissions').delete().eq('test_id', testId);
        await supabase.from('mcq_tests').delete().eq('id', testId);
        setMcqTests(prev => prev.filter(t => t.id !== testId));
        setTestSubmissions(prev => prev.filter(s => s.testId !== testId));
    };

    const submitTest = async (submissionData: Omit<TestSubmission, 'id' | 'submittedAt'>) => {
        const newSubmission: TestSubmission = { id: `sub-${crypto.randomUUID()}`, submittedAt: new Date().toISOString(), ...submissionData };
        await supabase.from('mcq_submissions').insert(toSnakeCase(newSubmission));
        setTestSubmissions(prev => [...prev, newSubmission]);
    };

    const updateSubmission = async (submission: TestSubmission) => {
        await supabase.from('mcq_submissions').update(toSnakeCase(submission)).eq('id', submission.id);
        setTestSubmissions(prev => prev.map(s => s.id === submission.id ? submission : s));
    };

    const deleteSubmission = async (submissionId: string) => {
        await supabase.from('mcq_submissions').delete().eq('id', submissionId);
        setTestSubmissions(prev => prev.filter(s => s.id !== submissionId));
    };

    const updateGroupProfile = async (profileData: Omit<GroupProfile, 'leaderId'>) => {
        if (!currentUser) return;
        const newProfile: GroupProfile = { ...profileData, leaderId: currentUser.id };
        await supabase.from('group_profiles').upsert(toSnakeCase(newProfile));
        setGroupProfiles(prev => {
            const existingIndex = prev.findIndex(p => p.leaderId === currentUser.id);
            if (existingIndex > -1) { const updated = [...prev]; updated[existingIndex] = newProfile; return updated; }
            return [...prev, newProfile];
        });
    };
    
    const updateStudentByAdmin = async (studentId: string, studentData: Partial<Omit<User, 'id' | 'role' | 'passwordHash'>>) => {
        await supabase.from('users').update(toSnakeCase(studentData)).eq('id', studentId);
        setUsers(prev => prev.map(u => (u.id === studentId) ? { ...u, ...studentData } : u));
    };
    
    const deleteStudent = async (studentId: string) => {
        await api.deleteStudentWithRelations(studentId);
        setUsers(prev => prev.filter(u => u.id !== studentId));
    };
    
    const updateStudentEnrollments = async (studentId: string, newCourseIds: string[]) => {
        const currentEnrollments = enrollments.filter(e => e.studentId === studentId);
        const currentCourseIds = new Set(currentEnrollments.map(e => e.courseId));
        const courseIdsToAdd = newCourseIds.filter(id => !currentCourseIds.has(id));
        const enrollmentsToRemove = currentEnrollments.filter(e => !new Set(newCourseIds).has(e.courseId));
        if (enrollmentsToRemove.length > 0) await api.deleteMultiple('enrollments', 'id', enrollmentsToRemove.map(e => e.id));
        if (courseIdsToAdd.length > 0) {
            const enrollmentsToAdd = courseIdsToAdd.map(courseId => ({ id: `enrol-${crypto.randomUUID()}`, studentId, courseId }));
            await api.saveMultiple('enrollments', enrollmentsToAdd);
        }
        const { data } = await supabase.from('enrollments').select('*');
        if (data) setEnrollments(data.map(d => ({id: d.id, studentId: d.student_id, courseId: d.course_id})));
    };

    const sendNotification = async (notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
        const newNotification: Notification = { id: `notif-${crypto.randomUUID()}`, timestamp: new Date().toISOString(), isRead: false, ...notificationData };
        await supabase.from('notifications').insert(toSnakeCase(newNotification));
        setNotifications(prev => [newNotification, ...prev]);
    };
    
    const bulkRegisterAndEnrollStudents = async (studentsData: any[]) => {
        const newUsers: User[] = [];
        const newEnrollments: Enrollment[] = [];
        for (const student of studentsData) {
            const passwordHash = await simpleHash(student.password);
            const { password, enrollCourseCodes, ...restDetails } = student;
            const newUser: User = { id: `user-${crypto.randomUUID()}`, ...restDetails, passwordHash, role: Role.STUDENT, forcePasswordChange: true };
            newUsers.push(newUser);
            for (const code of enrollCourseCodes) {
                const course = courses.find(c => c.courseCode === code);
                if (course) newEnrollments.push({ id: `enrol-${crypto.randomUUID()}`, studentId: newUser.id, courseId: course.id });
            }
        }
        
        const errors: string[] = [];
        let successCount = 0;
        
        if (newUsers.length > 0) {
            const { error: userError } = await supabase.from('users').upsert(toSnakeCase(newUsers), { onConflict: 'registration_number' });
            if (userError) {
                errors.push(`User insertion failed: ${userError.message}`);
            } else {
                successCount = newUsers.length;
                setUsers(prev => [...prev, ...newUsers]);
            }
        }
        
        if (newEnrollments.length > 0 && errors.length === 0) {
            const { error: enrollError } = await supabase.from('enrollments').insert(toSnakeCase(newEnrollments));
            if (enrollError) {
                errors.push(`Enrollment failed: ${enrollError.message}`);
            } else {
                setEnrollments(prev => [...prev, ...newEnrollments]);
            }
        }
        
        return { successCount, errors };
    };

    const bulkUpdateStudentIntake = async (studentIds: string[], intakeId: string | null) => {
        const { error } = await supabase
            .from('users')
            .update({ intake_id: intakeId })
            .in('id', studentIds);
        
        if (error) throw new Error(`Bulk intake update failed: ${error.message}`);
        
        setUsers(prev => prev.map(u => studentIds.includes(u.id) ? { ...u, intakeId: intakeId || undefined } : u));
    };

    const updateSystemSettings = async (newSettings: Partial<SystemSettings>) => {
        const updatedSettings = { ...systemSettings, ...newSettings };
        await api.saveSystemSettings(updatedSettings);
        setSystemSettings(updatedSettings);
    };
    
    const updateUserRole = async (userId: string, newRole: Role, managedCourseId?: string, managedSession?: string) => {
        const updateData: any = { role: newRole, managed_course_id: managedCourseId || null, managed_session: managedSession || null };
        await supabase.from('users').update(updateData).eq('id', userId);
        setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role: newRole, managedCourseId, managedSession } : u)));
    };

    const requestPasswordReset = async (identifier: string): Promise<boolean> => {
        const lowerId = identifier.toLowerCase();
        const { data: user } = await supabase.from('users').select('*').or(`registration_number.eq.${lowerId},email.eq.${lowerId}`).maybeSingle();
        if (!user) return false;
        const token = crypto.randomUUID();
        const expires = new Date(Date.now() + 3600000).toISOString();
        await supabase.from('users').update({ password_reset_token: token, password_reset_expires: expires }).eq('id', user.id);
        setUsers(prev => prev.map(u => u.id === user.id ? {...u, passwordResetToken: token, passwordResetExpires: expires} : u));
        return true;
    };
    
    const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
        const { data: user } = await supabase.from('users').select('*').eq('password_reset_token', token).maybeSingle();
        if (!user || new Date() > new Date(user.password_reset_expires)) return false;
        const passwordHash = await simpleHash(newPassword);
        await supabase.from('users').update({ password_hash: passwordHash, password_reset_token: null, password_reset_expires: null }).eq('id', user.id);
        setUsers(prev => prev.map(u => u.id === user.id ? {...u, passwordHash} : u));
        return true;
    };
    
    const bulkUnenrollStudentsFromCourse = async (studentIds: string[], courseId: string) => {
        const studentIdSet = new Set(studentIds);
        const enrollmentsToRemove = enrollments.filter(e => e.courseId === courseId && studentIdSet.has(e.studentId));
        if (enrollmentsToRemove.length === 0) return;
        await api.deleteMultiple('enrollments', 'id', enrollmentsToRemove.map(e => e.id));
        setEnrollments(prev => prev.filter(e => !enrollmentsToRemove.some(er => er.id === e.id)));
    };
    
    const changePassword = async (userId: string, newPassword: string): Promise<void> => {
        const passwordHash = await simpleHash(newPassword);
        await supabase.from('users').update({ password_hash: passwordHash, force_password_change: false }).eq('id', userId);
        setUsers(prev => prev.map(u => (u.id === userId) ? { ...u, passwordHash, forcePasswordChange: false } : u));
        if (currentUser?.id === userId) { const updated = { ...currentUser, forcePasswordChange: false }; setCurrentUser(updated); localStorage.setItem('currentUser', JSON.stringify(updated)); }
    };
    
    const markStudentNotificationsAsRead = async (studentId: string) => {
        const enrolledCourseIds = new Set(enrollments.filter(e => e.studentId === studentId).map(e => e.courseId));
        await supabase.from('notifications').update({ is_read: true }).in('course_id', Array.from(enrolledCourseIds));
        setNotifications(prev => prev.map(n => enrolledCourseIds.has(n.courseId) ? { ...n, isRead: true } : n));
    };

    const markAllNotificationsAsRead = async () => {
        await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const clearAllNotifications = async () => { await api.deleteMultiple('notifications', 'id', notifications.map(n=>n.id)); setNotifications([]); };

    const contextValue: DataContextType = {
        currentUser, users, courses, intakes, enrollments, marks, mcqTests, testSubmissions, groupProfiles, notifications, systemSettings, 
        login, logout, registerStudent, addIntake, updateIntake, deleteIntake, addCourse, updateCourse, deleteCourse, enrollInCourse, 
        unenrollFromCourse, getEnrollment, getMarksForEnrollment, updateMarks, bulkUpdateMarks, 
        updateGroupProfile, updateStudentByAdmin, deleteStudent, updateStudentEnrollments, 
        sendNotification, bulkRegisterAndEnrollStudents, updateSystemSettings, updateUserRole, 
        requestPasswordReset, resetPassword, bulkUnenrollStudentsFromCourse, bulkUpdateStudentIntake,
        markStudentNotificationsAsRead, markAllNotificationsAsRead, clearAllNotifications,
        changePassword, createDefaultAdmin, setCurrentUser, addMCQTest, deleteMCQTest, submitTest, updateSubmission, deleteSubmission
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Loading System Data...</p>
            </div>
        );
    }
    return ( <DataContext.Provider value={contextValue}>{children}</DataContext.Provider> );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) throw new Error('useData must be used within a DataProvider');
    return context;
};