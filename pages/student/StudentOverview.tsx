import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { calculateTotal, calculateGrade } from '../../utils/gradeCalculator';

interface StudentOverviewProps {
    onNavigate: (tab: any) => void;
}

const StudentOverview: React.FC<StudentOverviewProps> = ({ onNavigate }) => {
    const { currentUser, courses, intakes, enrollments, marks, mcqTests, testSubmissions, getMarksForEnrollment } = useData();

    const studentEnrollments = useMemo(() => {
        if (!currentUser) return [];
        return enrollments.filter(e => e.studentId === currentUser.id);
    }, [enrollments, currentUser]);

    const enrolledCoursesList = useMemo(() => {
        return studentEnrollments
            .map(e => courses.find(c => c.id === e.courseId))
            .filter((c): c is NonNullable<typeof c> => !!c);
    }, [studentEnrollments, courses]);

    const upcomingTests = useMemo(() => {
        if (!currentUser) return [];
        const enrolledCourseIds = new Set(studentEnrollments.map(e => e.courseId));
        const submittedTestIds = new Set(testSubmissions.filter(s => s.studentId === currentUser.id).map(s => s.testId));
        
        return mcqTests
            .filter(t => enrolledCourseIds.has(t.courseId) && !submittedTestIds.has(t.id))
            .filter(t => new Date(t.dueDate) > new Date())
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [mcqTests, studentEnrollments, testSubmissions, currentUser]);

    const recentMarks = useMemo(() => {
        return studentEnrollments
            .map(e => {
                const mark = getMarksForEnrollment(e.id);
                const course = courses.find(c => c.id === e.courseId);
                if (!mark || !course) return null;
                const total = calculateTotal(mark);
                const grade = calculateGrade(total);
                return { course, mark, total, grade };
            })
            .filter((m): m is NonNullable<typeof m> => !!m)
            .slice(0, 3); 
    }, [studentEnrollments, getMarksForEnrollment, courses]);

    const intakeName = useMemo(() => {
        if (!currentUser?.intakeId) return 'General Admission';
        const intake = intakes.find(i => i.id === currentUser.intakeId);
        return intake ? intake.name : 'Unknown Intake';
    }, [currentUser, intakes]);

    if (!currentUser) return null;

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8 rounded-2xl shadow-lg text-white">
                <h2 className="text-3xl font-black">Welcome back, {currentUser.fullName}!</h2>
                <div className="mt-2 flex flex-col gap-1">
                    <p className="text-primary-100 opacity-90 font-medium">
                        {currentUser.course} • Session: {currentUser.session} • Year {currentUser.yearOfStudy}, Sem {currentUser.semester}
                    </p>
                    <p className="text-primary-200 text-sm font-black uppercase tracking-wider">{intakeName}</p>
                </div>
                <div className="mt-6 flex flex-wrap gap-4">
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary-200">Enrolled Units</p>
                        <p className="text-xl font-bold">{enrolledCoursesList.length}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary-200">Upcoming Tests</p>
                        <p className="text-xl font-bold">{upcomingTests.length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Deadlines & Grades */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Upcoming Deadlines */}
                    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Upcoming MCQ Deadlines
                            </h3>
                            <button onClick={() => onNavigate('tests')} className="text-sm font-bold text-primary-600 hover:underline">View All</button>
                        </div>
                        <div className="p-6">
                            {upcomingTests.length > 0 ? (
                                <div className="space-y-4">
                                    {upcomingTests.map(test => {
                                        const course = courses.find(c => c.id === test.courseId);
                                        const dueDate = new Date(test.dueDate);
                                        const isUrgent = (dueDate.getTime() - new Date().getTime()) < 86400000; 
                                        return (
                                            <div key={test.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isUrgent ? 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30' : 'bg-gray-50 border-gray-100 dark:bg-gray-900/40 dark:border-gray-700'}`}>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase text-primary-500 tracking-tighter">{course?.courseCode}</span>
                                                    <span className="font-bold text-gray-900 dark:text-white">{test.title}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-xs font-black uppercase ${isUrgent ? 'text-red-600' : 'text-gray-500'}`}>
                                                        Due: {dueDate.toLocaleDateString()}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400">{dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500 italic">
                                    No pending tests! You're all caught up.
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Recent Grades Snapshot */}
                    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Recent Grade Entries
                            </h3>
                            <button onClick={() => onNavigate('marks')} className="text-sm font-bold text-primary-600 hover:underline">View Performance</button>
                        </div>
                        <div className="p-6">
                            {recentMarks.length > 0 ? (
                                <div className="space-y-4">
                                    {recentMarks.map(({ course, total, grade }) => (
                                        <div key={course.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700">
                                            <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-black text-xs">
                                                {course.courseCode.substring(0, 3)}
                                            </div>
                                            <div className="flex-grow">
                                                <p className="font-bold text-gray-900 dark:text-white leading-tight">{course.courseName}</p>
                                                <p className="text-xs text-gray-500 mt-1">Score: {total}/100</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`inline-block px-3 py-1 rounded-lg font-black text-sm ${
                                                    total >= 80 ? 'bg-green-100 text-green-700' :
                                                    total >= 50 ? 'bg-blue-100 text-blue-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {grade}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500 italic">
                                    No marks have been recorded for your units yet.
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Column: Enrolled Courses */}
                <div className="space-y-6">
                    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">My Course Units</h3>
                        </div>
                        <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                            {enrolledCoursesList.length > 0 ? enrolledCoursesList.map(course => (
                                <div key={course.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{course.courseCode}</p>
                                    <p className="font-bold text-sm text-gray-800 dark:text-gray-200 line-clamp-1">{course.courseName}</p>
                                    <p className="text-[10px] text-gray-500 mt-1">{course.academicYear} • {course.semester}</p>
                                </div>
                            )) : (
                                <div className="p-8 text-center space-y-4">
                                    <p className="text-sm text-gray-500">Not enrolled in any units yet.</p>
                                    <button 
                                        onClick={() => onNavigate('enroll')}
                                        className="px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-lg shadow-md hover:bg-primary-700"
                                    >
                                        Enroll Now
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                    
                    {/* Academic Status Quick Glance */}
                    <section className="bg-primary-50 dark:bg-primary-900/10 p-6 rounded-2xl border border-primary-100 dark:border-primary-900/30">
                        <h4 className="text-sm font-black uppercase text-primary-700 dark:text-primary-300 tracking-widest mb-4">Registration Status</h4>
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Active Student</span>
                        </div>
                        <p className="mt-4 text-[10px] leading-relaxed text-primary-800 dark:text-primary-400 font-medium opacity-80 uppercase tracking-tight">
                            System analysis and management platform for active university registries. ENSURE ALL CONTACT DETAILS ARE UP TO DATE IN YOUR PROFILE.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default StudentOverview;