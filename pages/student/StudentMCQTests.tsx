import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { MCQTest, TestSubmission } from '../../types';

const StudentMCQTests: React.FC = () => {
    const { currentUser, mcqTests, testSubmissions, courses, enrollments, submitTest } = useData();
    const [activeTest, setActiveTest] = useState<MCQTest | null>(null);
    const [testAnswers, setTestAnswers] = useState<number[]>([]);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [confirmStart, setConfirmStart] = useState<MCQTest | null>(null);
    const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');

    const enrolledCourseIds = useMemo(() => {
        if (!currentUser) return new Set<string>();
        return new Set(enrollments.filter(e => e.studentId === currentUser.id).map(e => e.courseId));
    }, [currentUser, enrollments]);

    const testsForMe = useMemo(() => {
        return mcqTests.filter(t => enrolledCourseIds.has(t.courseId));
    }, [mcqTests, enrolledCourseIds]);

    const mySubmissions = useMemo(() => {
        if (!currentUser) return new Map<string, TestSubmission>();
        const map = new Map<string, TestSubmission>();
        testSubmissions.filter(s => s.studentId === currentUser.id).forEach(s => map.set(s.testId, s));
        return map;
    }, [testSubmissions, currentUser]);

    const submissionHistory = useMemo(() => {
        if (!currentUser) return [];
        return testSubmissions
            .filter(s => s.studentId === currentUser.id)
            .map(s => ({
                submission: s,
                test: mcqTests.find(t => t.id === s.testId),
                course: courses.find(c => c.id === mcqTests.find(t => t.id === s.testId)?.courseId)
            }))
            .sort((a, b) => new Date(b.submission.submittedAt).getTime() - new Date(a.submission.submittedAt).getTime());
    }, [testSubmissions, currentUser, mcqTests, courses]);

    useEffect(() => {
        let timer: any;
        if (activeTest && timeRemaining > 0) {
            timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        handleFinishTest();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [activeTest, timeRemaining]);

    const handleStartTest = (test: MCQTest) => {
        setActiveTest(test);
        setTestAnswers(new Array(test.questions.length).fill(-1));
        setTimeRemaining(test.durationMinutes * 60);
        setIsFinished(false);
        setConfirmStart(null);
    };

    const handleAnswerChange = (qIdx: number, oIdx: number) => {
        const newAnswers = [...testAnswers];
        newAnswers[qIdx] = oIdx;
        setTestAnswers(newAnswers);
    };

    const handleFinishTest = async () => {
        if (!activeTest || !currentUser) return;
        
        let score = 0;
        activeTest.questions.forEach((q, idx) => {
            if (testAnswers[idx] === q.correctOptionIndex) {
                score++;
            }
        });

        await submitTest({
            testId: activeTest.id,
            studentId: currentUser.id,
            answers: testAnswers,
            score: score,
            totalQuestions: activeTest.questions.length
        });

        setIsFinished(true);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const answeredCount = testAnswers.filter(a => a !== -1).length;

    if (activeTest) {
        if (isFinished) {
            const submission = mySubmissions.get(activeTest.id);
            return (
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl text-center space-y-6">
                    <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-2xl font-bold">Test Submitted!</h3>
                    <p className="text-gray-500 dark:text-gray-400">Great job completing the exam.</p>
                    <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl inline-block">
                        <span className="text-sm text-primary-600 block uppercase font-bold mb-1">Your Score</span>
                        <span className="text-4xl font-black text-primary-700 dark:text-primary-300">
                            {submission?.score || 0} / {activeTest.questions.length}
                        </span>
                    </div>
                    <div className="pt-6">
                        <button 
                            onClick={() => {
                                setActiveTest(null);
                                setActiveTab('history');
                            }}
                            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            View All Results
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="max-w-3xl mx-auto space-y-6 relative">
                <div className="sticky top-4 z-10 flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border-2 border-primary-100 dark:border-primary-900 gap-4">
                    <div className="flex flex-col">
                        <h3 className="font-bold text-gray-800 dark:text-white">{activeTest.title}</h3>
                        <p className="text-xs text-gray-500 uppercase font-bold">{courses.find(c => c.id === activeTest.courseId)?.courseCode}</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase text-gray-400">Answered</p>
                            <p className="text-sm font-bold text-primary-600">{answeredCount} / {activeTest.questions.length}</p>
                        </div>
                        <div className={`px-4 py-2 rounded-lg font-mono text-xl font-bold ${timeRemaining < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-800'}`}>
                            {formatTime(timeRemaining)}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {activeTest.questions.map((q, qIdx) => (
                        <div key={q.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h4 className="font-bold text-gray-800 dark:text-white mb-4">
                                <span className="text-primary-500 mr-2">{qIdx + 1}.</span> {q.text}
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                                {q.options.map((opt, oIdx) => (
                                    <button
                                        key={oIdx}
                                        onClick={() => handleAnswerChange(qIdx, oIdx)}
                                        className={`p-4 text-left rounded-xl border-2 transition-all ${
                                            testAnswers[qIdx] === oIdx
                                                ? 'bg-primary-50 border-primary-500 text-primary-800 dark:bg-primary-900/20 dark:text-primary-200'
                                                : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                                                testAnswers[qIdx] === oIdx ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-300'
                                            }`}>
                                                {String.fromCharCode(65 + oIdx)}
                                            </span>
                                            {opt}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-6 flex justify-end">
                    <button 
                        onClick={() => {
                            if (window.confirm("Are you sure you want to submit? Ensure you have answered all questions.")) {
                                handleFinishTest();
                            }
                        }}
                        className="px-10 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-xl transition-all"
                    >
                        Submit Exam
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Examination Center</h3>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shadow-inner">
                    <button 
                        onClick={() => setActiveTab('available')}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'available' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        Available Tests
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'history' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        Result History
                    </button>
                </div>
            </div>
            
            {activeTab === 'available' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {testsForMe.length > 0 ? testsForMe.map(test => {
                        const course = courses.find(c => c.id === test.courseId);
                        const submission = mySubmissions.get(test.id);
                        const isOverdue = new Date() > new Date(test.dueDate);
                        
                        return (
                            <div key={test.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between hover:shadow-md transition-shadow">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <span className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 text-[10px] font-bold rounded-full uppercase">
                                            {course?.courseCode}
                                        </span>
                                        {submission ? (
                                            <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                COMPLETED
                                            </span>
                                        ) : isOverdue ? (
                                            <span className="text-xs font-bold text-red-500">EXPIRED</span>
                                        ) : (
                                            <span className="text-xs font-bold text-blue-500">AVAILABLE</span>
                                        )}
                                    </div>
                                    <h4 className="text-lg font-bold mt-2">{test.title}</h4>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{test.description || 'No description provided.'}</p>
                                </div>
                                
                                <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                                    <div className="text-xs space-y-1">
                                        <p className="text-gray-400">Duration: <span className="text-gray-700 dark:text-gray-300 font-bold">{test.durationMinutes} mins</span></p>
                                        <p className="text-gray-400">Due: <span className="text-gray-700 dark:text-gray-300 font-bold">{new Date(test.dueDate).toLocaleDateString()}</span></p>
                                    </div>
                                    
                                    {submission ? (
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Your Result</p>
                                            <p className="text-lg font-black text-primary-600">{submission.score} / {submission.totalQuestions}</p>
                                        </div>
                                    ) : isOverdue ? (
                                        <button disabled className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm font-bold">Closed</button>
                                    ) : (
                                        <button 
                                            onClick={() => setConfirmStart(test)}
                                            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-md"
                                        >
                                            Start Exam
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="md:col-span-2 py-20 bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            <p>No tests are currently assigned to your course units.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400">Test Title</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400">Unit</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-gray-400">Score</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-gray-400">Grade</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-gray-400">Submitted At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {submissionHistory.length > 0 ? submissionHistory.map(({ submission: s, test, course }) => {
                                    const percentage = (s.score / s.totalQuestions) * 100;
                                    return (
                                        <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-gray-900 dark:text-white">{test?.title || 'Unknown Test'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-medium text-gray-500">{course?.courseCode}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-black text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded-lg">
                                                    {s.score} / {s.totalQuestions}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                                                    percentage >= 80 ? 'text-green-600 bg-green-50' : 
                                                    percentage >= 50 ? 'text-blue-600 bg-blue-50' : 
                                                    'text-red-600 bg-red-50'
                                                }`}>
                                                    {percentage >= 80 ? 'Excellent' : percentage >= 50 ? 'Pass' : 'Fail'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs text-gray-400">
                                                {new Date(s.submittedAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                                            You haven't completed any MCQ tests yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {confirmStart && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl space-y-4">
                        <h3 className="text-xl font-bold">Ready to Start?</h3>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <p>• You have <span className="font-bold">{confirmStart.durationMinutes} minutes</span>.</p>
                            <p>• The timer starts immediately.</p>
                            <p>• Do not close the browser during the exam.</p>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setConfirmStart(null)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold">Cancel</button>
                            <button onClick={() => handleStartTest(confirmStart)} className="flex-1 py-2 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-600/30">Start Now</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentMCQTests;