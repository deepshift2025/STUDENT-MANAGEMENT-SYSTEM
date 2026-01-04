import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { MCQTest, Question, TestSubmission, User, Role } from '../../types';

const MCQTestManagement: React.FC = () => {
    const { courses, mcqTests, addMCQTest, deleteMCQTest, testSubmissions, users, enrollments, submitTest, updateSubmission, deleteSubmission } = useData();
    const [isCreating, setIsCreating] = useState(false);
    const [viewResultsId, setViewResultsId] = useState<string | null>(null);
    const [detailedSubmission, setDetailedSubmission] = useState<TestSubmission | null>(null);
    const [editingSubmission, setEditingSubmission] = useState<TestSubmission | null>(null);
    const [isAddingSubmission, setIsAddingSubmission] = useState(false);
    
    const [testForm, setTestForm] = useState({
        courseId: '',
        title: '',
        description: '',
        durationMinutes: 30,
        dueDate: '',
    });
    
    const [questions, setQuestions] = useState<Question[]>([
        { id: 'q-1', text: '', options: ['', '', '', ''], correctOptionIndex: 0 }
    ]);

    const handleAddQuestion = () => {
        setQuestions(prev => [
            ...prev,
            { id: `q-${Date.now()}`, text: '', options: ['', '', '', ''], correctOptionIndex: 0 }
        ]);
    };

    const handleRemoveQuestion = (id: string) => {
        if (questions.length > 1) {
            setQuestions(prev => prev.filter(q => q.id !== id));
        }
    };

    const handleQuestionChange = (id: string, field: string, value: any) => {
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const handleOptionChange = (qId: string, optIdx: number, value: string) => {
        setQuestions(prev => prev.map(q => {
            if (q.id === qId) {
                const newOpts = [...q.options];
                newOpts[optIdx] = value;
                return { ...q, options: newOpts };
            }
            return q;
        }));
    };

    const handleAddOption = (qId: string) => {
        setQuestions(prev => prev.map(q => {
            if (q.id === qId && q.options.length < 6) {
                return { ...q, options: [...q.options, ''] };
            }
            return q;
        }));
    };

    const handleRemoveOption = (qId: string, optIdx: number) => {
        setQuestions(prev => prev.map(q => {
            if (q.id === qId && q.options.length > 2) {
                const newOpts = q.options.filter((_, i) => i !== optIdx);
                let newIdx = q.correctOptionIndex;
                if (optIdx === q.correctOptionIndex) newIdx = 0;
                else if (optIdx < q.correctOptionIndex) newIdx--;
                return { ...q, options: newOpts, correctOptionIndex: newIdx };
            }
            return q;
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testForm.courseId) { alert("Please select a course."); return; }
        if (questions.some(q => !q.text.trim())) { alert("All questions must have text."); return; }
        if (questions.some(q => q.options.some(opt => !opt.trim()))) { alert("All options must have text."); return; }
        
        await addMCQTest({
            ...testForm,
            questions: questions
        });
        
        setIsCreating(false);
        setTestForm({ courseId: '', title: '', description: '', durationMinutes: 30, dueDate: '' });
        setQuestions([{ id: 'q-1', text: '', options: ['', '', '', ''], correctOptionIndex: 0 }]);
    };

    const resultsForTest = useMemo(() => viewResultsId ? testSubmissions.filter(s => s.testId === viewResultsId) : [], [viewResultsId, testSubmissions]);
    const activeTest = useMemo(() => mcqTests.find(t => t.id === viewResultsId), [mcqTests, viewResultsId]);

    const enrolledStudents = useMemo(() => {
        if (!activeTest) return [];
        const courseEnrollments = enrollments.filter(e => e.courseId === activeTest.courseId);
        return users.filter(u => courseEnrollments.some(e => e.studentId === u.id));
    }, [activeTest, enrollments, users]);

    const handleDeleteSub = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this submission?")) {
            await deleteSubmission(id);
        }
    };

    const SubmissionFormModal: React.FC<{ submission?: TestSubmission; test: MCQTest; onClose: () => void }> = ({ submission, test, onClose }) => {
        const [studentId, setStudentId] = useState(submission?.studentId || '');
        const [answers, setAnswers] = useState<number[]>(submission?.answers || new Array(test.questions.length).fill(-1));
        const [isSubmitting, setIsSubmitting] = useState(false);

        const handleSave = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!studentId) { alert("Please select a student."); return; }
            setIsSubmitting(true);

            let score = 0;
            test.questions.forEach((q, idx) => {
                if (answers[idx] === q.correctOptionIndex) {
                    score++;
                }
            });

            if (submission) {
                await updateSubmission({ ...submission, studentId, answers, score });
            } else {
                await submitTest({
                    testId: test.id,
                    studentId,
                    answers,
                    score,
                    totalQuestions: test.questions.length
                });
            }
            setIsSubmitting(false);
            onClose();
        };

        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">{submission ? 'Edit Submission' : 'Manual Submission Entry'}</h3>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">&times;</button>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6 flex-grow">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Student</label>
                            <select 
                                required
                                value={studentId}
                                onChange={e => setStudentId(e.target.value)}
                                disabled={!!submission}
                                className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 transition-all disabled:opacity-50"
                            >
                                <option value="">Select Student</option>
                                {enrolledStudents.map(s => (
                                    <option key={s.id} value={s.id}>{s.registrationNumber} - {s.fullName}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-sm font-black uppercase text-gray-400 tracking-wider">Answer Selection</h4>
                            {test.questions.map((q, idx) => (
                                <div key={q.id} className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <p className="text-sm font-bold mb-3">{idx + 1}. {q.text}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {q.options.map((opt, oIdx) => (
                                            <label key={oIdx} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${answers[idx] === oIdx ? 'bg-primary-100 dark:bg-primary-900/30 ring-1 ring-primary-500' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                                <input 
                                                    type="radio" 
                                                    name={`q-${idx}`}
                                                    checked={answers[idx] === oIdx}
                                                    onChange={() => {
                                                        const newAns = [...answers];
                                                        newAns[idx] = oIdx;
                                                        setAnswers(newAns);
                                                    }}
                                                    className="text-primary-600 focus:ring-primary-500"
                                                />
                                                <span className="text-xs">{String.fromCharCode(65 + oIdx)}. {opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
                            <button type="button" onClick={onClose} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-bold">Cancel</button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="px-10 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-lg font-bold disabled:opacity-50"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Submission'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const DetailedResultModal: React.FC<{ submission: TestSubmission; test: MCQTest }> = ({ submission, test }) => {
        const student = users.find(u => u.id === submission.studentId);
        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold">{student?.fullName}'s Attempt</h3>
                            <p className="text-sm text-gray-500">{test.title} • Score: {submission.score}/{submission.totalQuestions}</p>
                        </div>
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={() => {
                                    setDetailedSubmission(null);
                                    setEditingSubmission(submission);
                                }} 
                                className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg flex items-center gap-2 text-sm font-bold"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                Edit
                            </button>
                            <button onClick={() => setDetailedSubmission(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-xl leading-none">&times;</button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {test.questions.map((q, idx) => {
                            const isCorrect = submission.answers[idx] === q.correctOptionIndex;
                            return (
                                <div key={q.id} className={`p-4 rounded-xl border-2 ${isCorrect ? 'border-green-100 bg-green-50 dark:bg-green-900/10' : 'border-red-100 bg-red-50 dark:bg-red-900/10'}`}>
                                    <p className="font-bold text-sm mb-3">{idx + 1}. {q.text}</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {q.options.map((opt, oIdx) => {
                                            const isSelected = submission.answers[idx] === oIdx;
                                            const isCorrectOpt = q.correctOptionIndex === oIdx;
                                            return (
                                                <div key={oIdx} className={`text-xs p-2 rounded-lg flex items-center justify-between ${
                                                    isSelected && isCorrectOpt ? 'bg-green-200 dark:bg-green-800/40 text-green-900 dark:text-green-100' :
                                                    isSelected && !isCorrectOpt ? 'bg-red-200 dark:bg-red-800/40 text-red-900 dark:text-red-100' :
                                                    !isSelected && isCorrectOpt ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                                                    'bg-white dark:bg-gray-800'
                                                }`}>
                                                    <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                                                    {isSelected && <span className="font-black uppercase text-[8px]">{isCorrectOpt ? 'Correct' : 'Your Answer'}</span>}
                                                    {!isSelected && isCorrectOpt && <span className="font-black uppercase text-[8px]">Correct Answer</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">MCQ Test Management</h3>
                {!isCreating && (
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-md transition-all flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                        Create New Test
                    </button>
                )}
            </div>

            {isCreating ? (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Target Course Unit</label>
                            <select 
                                required
                                value={testForm.courseId}
                                onChange={e => setTestForm({...testForm, courseId: e.target.value})}
                                className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 transition-all"
                            >
                                <option value="">Select Course</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.courseCode} - {c.courseName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Due Date & Time</label>
                            <input 
                                type="datetime-local" 
                                required
                                value={testForm.dueDate}
                                onChange={e => setTestForm({...testForm, dueDate: e.target.value})}
                                className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 transition-all"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Test Title</label>
                            <input 
                                type="text" 
                                required
                                placeholder="E.g. Mid-Semester Quiz"
                                value={testForm.title}
                                onChange={e => setTestForm({...testForm, title: e.target.value})}
                                className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Duration (Minutes)</label>
                            <input 
                                type="number" 
                                required
                                min="1"
                                value={testForm.durationMinutes}
                                onChange={e => setTestForm({...testForm, durationMinutes: parseInt(e.target.value)})}
                                className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                            <h4 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">Examination Questions</h4>
                            <button 
                                type="button" 
                                onClick={handleAddQuestion}
                                className="text-sm px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-sm transition-all flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-5v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                Add Question
                            </button>
                        </div>
                        
                        {questions.map((q, qIdx) => (
                            <div key={q.id} className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl space-y-6 relative border border-gray-100 dark:border-gray-800 group shadow-sm">
                                <button 
                                    type="button" 
                                    onClick={() => handleRemoveQuestion(q.id)}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Delete Question"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                                
                                <div>
                                    <label className="text-[10px] font-black uppercase text-primary-600 mb-1 block">Question Item #{qIdx + 1}</label>
                                    <textarea 
                                        required
                                        placeholder="Enter the question text here..."
                                        value={q.text}
                                        onChange={e => handleQuestionChange(q.id, 'text', e.target.value)}
                                        className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                                        rows={2}
                                    />
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-black uppercase text-gray-500">Multiple Choice Options</label>
                                        <button 
                                            type="button"
                                            onClick={() => handleAddOption(q.id)}
                                            className="text-[10px] font-bold text-primary-600 hover:text-primary-700 uppercase"
                                            disabled={q.options.length >= 6}
                                        >
                                            + Add Option
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {q.options.map((opt, oIdx) => (
                                            <div 
                                                key={oIdx} 
                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                                                    q.correctOptionIndex === oIdx 
                                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
                                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                                }`}
                                            >
                                                <div className="flex-shrink-0 flex items-center">
                                                    <input 
                                                        type="radio" 
                                                        name={`correct-${q.id}`} 
                                                        id={`q-${q.id}-opt-${oIdx}`}
                                                        checked={q.correctOptionIndex === oIdx}
                                                        onChange={() => handleQuestionChange(q.id, 'correctOptionIndex', oIdx)}
                                                        className="h-5 w-5 text-green-600 focus:ring-green-500 cursor-pointer"
                                                    />
                                                </div>
                                                <div className="flex-grow">
                                                    <input 
                                                        type="text" 
                                                        required
                                                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                                        value={opt}
                                                        onChange={e => handleOptionChange(q.id, oIdx, e.target.value)}
                                                        className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 font-medium"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {q.correctOptionIndex === oIdx && (
                                                        <span className="text-[10px] font-black text-green-600 uppercase bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">Correct</span>
                                                    )}
                                                    {q.options.length > 2 && (
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleRemoveOption(q.id, oIdx)}
                                                            className="text-gray-400 hover:text-red-500"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-gray-400 italic px-1">Select the radio button next to the correct answer.</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                        <button 
                            type="button" 
                            onClick={() => setIsCreating(false)}
                            className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-all font-bold"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-10 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all font-bold"
                        >
                            Publish Test
                        </button>
                    </div>
                </form>
            ) : viewResultsId ? (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h4 className="text-lg font-bold">Results: {activeTest?.title}</h4>
                            <p className="text-xs text-gray-500">Unit: {courses.find(c => c.id === activeTest?.courseId)?.courseCode}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setIsAddingSubmission(true)} 
                                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-sm text-xs font-bold transition-all"
                            >
                                + Manual Entry
                            </button>
                            <button onClick={() => setViewResultsId(null)} className="text-primary-600 hover:underline text-sm font-bold">Back to List</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b dark:border-gray-700">
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase text-gray-400">Student</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase text-gray-400">Score</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase text-gray-400">Submitted At</th>
                                    <th className="px-4 py-2 text-right text-xs font-bold uppercase text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resultsForTest.length > 0 ? resultsForTest.map(s => {
                                    const student = users.find(u => u.id === s.studentId);
                                    return (
                                        <tr key={s.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{student?.fullName || 'Unknown'}</p>
                                                <p className="text-[10px] text-gray-400">{student?.registrationNumber}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-lg">
                                                    {s.score} / {s.totalQuestions}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{new Date(s.submittedAt).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => setDetailedSubmission(s)} className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all" title="View Detailed Attempt">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                                                    </button>
                                                    <button onClick={() => setEditingSubmission(s)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all" title="Edit Answers">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                                    </button>
                                                    <button onClick={() => handleDeleteSub(s.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Delete Submission">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan={4} className="text-center py-12 text-gray-500 italic">No submissions have been recorded for this test yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {detailedSubmission && activeTest && <DetailedResultModal submission={detailedSubmission} test={activeTest} />}
                    {(editingSubmission || isAddingSubmission) && activeTest && (
                        <SubmissionFormModal 
                            test={activeTest} 
                            submission={editingSubmission || undefined} 
                            onClose={() => {
                                setEditingSubmission(null);
                                setIsAddingSubmission(false);
                            }} 
                        />
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {mcqTests.length > 0 ? mcqTests.map(test => {
                        const course = courses.find(c => c.id === test.courseId);
                        const subCount = testSubmissions.filter(s => s.testId === test.id).length;
                        return (
                            <div key={test.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:scale-[1.01] transition-all group">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <span className="px-2.5 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-primary-100 dark:border-primary-800">
                                            {course?.courseCode}
                                        </span>
                                        <h4 className="text-xl font-black text-gray-800 dark:text-white leading-tight">{test.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{test.description || 'No description provided.'}</p>
                                    </div>
                                    <button 
                                        onClick={() => deleteMCQTest(test.id)}
                                        className="text-gray-300 hover:text-red-500 p-2 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                                <div className="mt-6 flex items-center justify-between">
                                    <div className="flex gap-4">
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Questions</p>
                                            <p className="text-sm font-bold">{test.questions.length}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Turn-ins</p>
                                            <p className="text-sm font-bold">{subCount}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setViewResultsId(test.id)}
                                        className="text-xs font-black text-primary-600 hover:text-primary-700 bg-primary-50 dark:bg-primary-900/20 px-4 py-2 rounded-xl transition-all"
                                    >
                                        VIEW MARKS
                                    </button>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="md:col-span-2 py-24 bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-gray-500">
                            <div className="bg-white dark:bg-gray-700 p-4 rounded-full shadow-inner mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                            </div>
                            <p className="font-bold text-lg">No Assessments Found</p>
                            <p className="text-sm opacity-60">Begin by creating your first MCQ examination.</p>
                            <button 
                                onClick={() => setIsCreating(true)}
                                className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-bold text-sm"
                            >
                                Get Started
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MCQTestManagement;