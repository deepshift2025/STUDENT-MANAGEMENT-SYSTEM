import React, { useMemo, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Role, MCQTest, TestSubmission, User } from '../../types';

const TestPerformanceReview: React.FC = () => {
    const { currentUser, mcqTests, testSubmissions, users, courses, intakes } = useData();
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedIntakeId, setSelectedIntakeId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTests = useMemo(() => {
        if (currentUser?.role === Role.COORDINATOR) {
            return mcqTests.filter(t => t.courseId === currentUser.managedCourseId);
        }
        if (selectedCourseId) {
            return mcqTests.filter(t => t.courseId === selectedCourseId);
        }
        return mcqTests;
    }, [mcqTests, selectedCourseId, currentUser]);

    const students = useMemo(() => {
        let baseStudents = users.filter(u => u.role === Role.STUDENT);
        
        if (selectedIntakeId) {
            baseStudents = baseStudents.filter(s => s.intakeId === selectedIntakeId);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            baseStudents = baseStudents.filter(s => 
                s.fullName.toLowerCase().includes(q) || 
                s.registrationNumber.toLowerCase().includes(q)
            );
        }
        return baseStudents.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [users, searchQuery, selectedIntakeId]);

    const submissionsByStudentAndTest = useMemo(() => {
        const map = new Map<string, Map<string, TestSubmission>>();
        testSubmissions.forEach(sub => {
            if (!map.has(sub.studentId)) {
                map.set(sub.studentId, new Map());
            }
            map.get(sub.studentId)!.set(sub.testId, sub);
        });
        return map;
    }, [testSubmissions]);

    const handlePrint = () => window.print();

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 print:hidden">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="text-xl font-bold">MCQ Performance Analysis</h3>
                    <div className="flex items-center gap-3">
                         <button onClick={handlePrint} className="px-4 py-2 bg-gray-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-gray-700 transition-all flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            Print Report
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    {currentUser?.role !== Role.COORDINATOR && (
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Filter by Course</label>
                            <select 
                                value={selectedCourseId}
                                onChange={e => setSelectedCourseId(e.target.value)}
                                className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm"
                            >
                                <option value="">All Courses</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.courseCode} - {c.courseName}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">S-Intake Group</label>
                        <select 
                            value={selectedIntakeId}
                            onChange={e => setSelectedIntakeId(e.target.value)}
                            className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm"
                        >
                            <option value="">All Intakes</option>
                            {intakes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Search Student</label>
                        <input 
                            type="text"
                            placeholder="Name or Reg No..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="border-b dark:border-gray-700">
                            <th className="px-4 py-3 text-left font-black text-gray-400 uppercase tracking-tighter">Student Info</th>
                            <th className="px-4 py-3 text-left font-black text-gray-400 uppercase tracking-tighter">Intake</th>
                            {filteredTests.map(test => (
                                <th key={test.id} className="px-4 py-3 text-center font-black text-gray-400 uppercase tracking-tighter whitespace-nowrap min-w-[120px]">
                                    {test.title}
                                    <div className="text-[10px] lowercase font-normal opacity-60">
                                        max: {test.questions.length}
                                    </div>
                                </th>
                            ))}
                            {filteredTests.length === 0 && <th className="px-4 py-3 text-center italic text-gray-400">No tests setup yet.</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                        {students.length > 0 ? students.map(student => {
                            const studentSubs = submissionsByStudentAndTest.get(student.id);
                            const intake = intakes.find(i => i.id === student.intakeId);
                            return (
                                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-bold">{student.fullName}</div>
                                        <div className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">{student.registrationNumber}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-[10px] font-black uppercase text-indigo-500 whitespace-nowrap">{intake?.name || '-'}</span>
                                    </td>
                                    {filteredTests.map(test => {
                                        const sub = studentSubs?.get(test.id);
                                        return (
                                            <td key={test.id} className="px-4 py-3 text-center">
                                                {sub ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className={`inline-block px-2 py-0.5 rounded-lg font-black text-xs ${
                                                            (sub.score / sub.totalQuestions) >= 0.8 ? 'bg-green-100 text-green-700 dark:bg-green-900/20' :
                                                            (sub.score / sub.totalQuestions) >= 0.5 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20' :
                                                            'bg-red-100 text-red-700 dark:bg-red-900/20'
                                                        }`}>
                                                            {sub.score} / {sub.totalQuestions}
                                                        </span>
                                                        <span className="text-[9px] text-gray-400 mt-1">
                                                            {new Date(sub.submittedAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300 dark:text-gray-600 italic text-[10px]">no attempt</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        }) : (
                            <tr><td colSpan={filteredTests.length + 2} className="py-20 text-center text-gray-500 italic">No matching students found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="hidden print:block fixed inset-0 bg-white p-8">
                <h1 className="text-2xl font-bold mb-2">MCQ Performance Report</h1>
                <p className="text-gray-500 mb-8">System Generated - {new Date().toLocaleString()}</p>
                <table className="w-full border-collapse border border-gray-300 text-xs">
                    <thead>
                        <tr>
                            <th className="border border-gray-300 p-2 text-left">Student Name</th>
                            <th className="border border-gray-300 p-2 text-left">Reg No.</th>
                            <th className="border border-gray-300 p-2 text-left">Intake</th>
                            {filteredTests.map(t => <th key={t.id} className="border border-gray-300 p-2">{t.title}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(s => {
                            const intake = intakes.find(i => i.id === s.intakeId);
                            return (
                            <tr key={s.id}>
                                <td className="border border-gray-300 p-2 font-bold">{s.fullName}</td>
                                <td className="border border-gray-300 p-2">{s.registrationNumber}</td>
                                <td className="border border-gray-300 p-2">{intake?.name || '-'}</td>
                                {filteredTests.map(t => {
                                    const sub = submissionsByStudentAndTest.get(s.id)?.get(t.id);
                                    return <td key={t.id} className="border border-gray-300 p-2 text-center font-bold">{sub ? `${sub.score}/${sub.totalQuestions}` : '-'}</td>;
                                })}
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TestPerformanceReview;