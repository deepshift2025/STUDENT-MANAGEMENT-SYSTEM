import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { User, Mark, Role } from '../../types';
import { calculateTotal, calculateGrade, validateMarks } from '../../utils/gradeCalculator';
import { MAX_MARKS } from '../../constants';
import BulkUploadModal from './BulkUploadModal';
import GradeDistributionModal from '../student/GradeDistributionModal';


const MarksEntry: React.FC = () => {
    const { courses, users, enrollments, intakes, marks, updateMarks, getMarksForEnrollment } = useData();
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedIntakeId, setSelectedIntakeId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [studentMarks, setStudentMarks] = useState<Map<string, Omit<Mark, 'id'>>>(new Map());
    const [saveStatus, setSaveStatus] = useState<Map<string, 'idle' | 'saving' | 'saved'>>(new Map());
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [statsModalCourse, setStatsModalCourse] = useState<any | null>(null);

    const students = useMemo(() => users.filter(u => u.role === Role.STUDENT), [users]);

    const enrolledStudents = useMemo(() => {
        if (!selectedCourseId) return [];

        const courseEnrollments = enrollments.filter(e => e.courseId === selectedCourseId);

        let courseStudents = courseEnrollments.map(enrollment => {
            const student = students.find(s => s.id === enrollment.studentId);
            return student ? { ...student, enrollmentId: enrollment.id } : null;
        }).filter((s): s is User & { enrollmentId: string } => s !== null);
        
        if (selectedIntakeId) {
            courseStudents = courseStudents.filter(s => s.intakeId === selectedIntakeId);
        }

        const lowercasedQuery = searchQuery.toLowerCase().trim();
        if (lowercasedQuery) {
            courseStudents = courseStudents.filter(student =>
                student.fullName.toLowerCase().includes(lowercasedQuery) ||
                student.registrationNumber.toLowerCase().includes(lowercasedQuery)
            );
        }

        return courseStudents.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [selectedCourseId, selectedIntakeId, enrollments, students, searchQuery]);

    const totalEnrolledCount = useMemo(() => {
        if(!selectedCourseId) return 0;
        return enrollments.filter(e => e.courseId === selectedCourseId).length;
    }, [selectedCourseId, enrollments]);

    useEffect(() => {
        const newMarks = new Map<string, Omit<Mark, 'id'>>();
        enrolledStudents.forEach(student => {
            const existingMark = getMarksForEnrollment(student.enrollmentId);
            newMarks.set(student.enrollmentId, {
                enrollmentId: student.enrollmentId,
                cats: existingMark?.cats ?? 0,
                coursework: existingMark?.coursework ?? 0,
                finalExam: existingMark?.finalExam ?? 0,
            });
        });
        setStudentMarks(newMarks);
        setSaveStatus(new Map());
    }, [selectedCourseId, enrolledStudents, getMarksForEnrollment, marks]);

    const saveMarks = useCallback(async (enrollmentId: string, marksToSave: Omit<Mark, 'id' | 'enrollmentId'>) => {
        const validationError = validateMarks(marksToSave);
        if (validationError) {
          console.error(`Validation Error for ${enrollmentId}: ${validationError}`);
          return;
        }

        setSaveStatus(prev => new Map(prev).set(enrollmentId, 'saving'));
        
        await updateMarks(enrollmentId, marksToSave);
        
        setSaveStatus(prev => new Map(prev).set(enrollmentId, 'saved'));
        setTimeout(() => {
            setSaveStatus(prev => new Map(prev).set(enrollmentId, 'idle'));
        }, 2000);
    }, [updateMarks]);


    const handleMarkChange = (enrollmentId: string, field: keyof Omit<Mark, 'id' | 'enrollmentId'>, value: number) => {
        setStudentMarks(prev => {
            const newMap = new Map(prev);
            const currentMarks = newMap.get(enrollmentId);
            if (currentMarks) {
                const typedCurrentMarks = currentMarks as Omit<Mark, 'id'>;
                const updatedMarks = {
                    enrollmentId: typedCurrentMarks.enrollmentId,
                    cats: typedCurrentMarks.cats,
                    coursework: typedCurrentMarks.coursework,
                    finalExam: typedCurrentMarks.finalExam,
                    [field]: value,
                };
                newMap.set(enrollmentId, updatedMarks);

                const marksToSave = {
                  cats: updatedMarks.cats,
                  coursework: updatedMarks.coursework,
                  finalExam: updatedMarks.finalExam,
                };
                saveMarks(enrollmentId, marksToSave);
            }
            return newMap;
        });
    };
    
    const handleExportCSV = () => {
        if (!selectedCourseId || enrolledStudents.length === 0) return;
        const course = courses.find(c => c.id === selectedCourseId);
        if (!course) return;

        const headers = ["Student Name", "Registration Number", "Intake", "CATs", "Course Work", "Final Exam", "Total", "Grade"];
        const rows = enrolledStudents.map(student => {
            const intake = intakes.find(i => i.id === student.intakeId);
            const currentMarks = studentMarks.get(student.enrollmentId) || { cats: 0, coursework: 0, finalExam: 0 };
            const total = calculateTotal({
                id: '',
                enrollmentId: student.enrollmentId,
                cats: currentMarks.cats,
                coursework: currentMarks.coursework,
                finalExam: currentMarks.finalExam,
            });
            const grade = calculateGrade(total);
            return [ `"${student.fullName.replace(/"/g, '""')}"`, `"${student.registrationNumber}"`, `"${intake?.name || ''}"`, currentMarks.cats, currentMarks.coursework, currentMarks.finalExam, total, grade ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${course.courseCode}_marks.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => { window.print(); };
    const selectedCourse = courses.find(c => c.id === selectedCourseId);

    const MarkInput: React.FC<{ enrollmentId: string; field: 'cats' | 'coursework' | 'finalExam'; max: number; value: number; onChange: (enrollmentId: string, field: 'cats' | 'coursework' | 'finalExam', value: number) => void; }> = ({ enrollmentId, field, max, value, onChange: handleGlobalChange }) => {
        const [localValue, setLocalValue] = useState(String(value));
        const inputRef = useRef<HTMLInputElement>(null);
    
        useEffect(() => {
            if (document.activeElement !== inputRef.current) {
                setLocalValue(String(value));
            }
        }, [value]);
    
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setLocalValue(e.target.value);
        };
    
        const handleBlur = () => {
            let numericValue = parseInt(localValue, 10);
            if (isNaN(numericValue) || numericValue < 0) {
                numericValue = 0;
            } else if (numericValue > max) {
                numericValue = max;
            }
            setLocalValue(String(numericValue));
            if (numericValue !== value) {
                handleGlobalChange(enrollmentId, field, numericValue);
            }
        };
    
        return (
            <input
                ref={inputRef}
                type="number"
                value={localValue}
                onChange={handleChange}
                onBlur={handleBlur}
                min="0"
                max={max}
                className="w-20 px-2 py-1 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500 print:hidden"
            />
        );
    };

    const StatusIndicator: React.FC<{ status: 'idle' | 'saving' | 'saved' | undefined }> = ({ status }) => {
        switch (status) {
            case 'saving': return <span className="text-xs text-yellow-500">Saving...</span>;
            case 'saved': return <span className="text-xs text-green-500">Saved!</span>;
            default: return null;
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="print:hidden">
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Enter Student Marks</h3>
                <div className="mb-6 flex flex-wrap items-end gap-4">
                    <div className="min-w-[200px]">
                        <label htmlFor="course-select" className="block text-[10px] font-black uppercase text-gray-500 mb-1">Select Course Unit</label>
                        <select
                            id="course-select"
                            value={selectedCourseId}
                            onChange={e => {
                                setSelectedCourseId(e.target.value);
                                setSearchQuery('');
                            }}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        >
                            <option value="">-- Select a Course --</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>{course.courseCode} - {course.courseName}</option>
                            ))}
                        </select>
                    </div>

                    {selectedCourseId && (
                        <div className="min-w-[150px]">
                            <label htmlFor="intake-select" className="block text-[10px] font-black uppercase text-gray-500 mb-1">S-Intake</label>
                            <select
                                id="intake-select"
                                value={selectedIntakeId}
                                onChange={e => setSelectedIntakeId(e.target.value)}
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            >
                                <option value="">All Intakes</option>
                                {intakes.map(intake => (
                                    <option key={intake.id} value={intake.id}>{intake.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {selectedCourseId && (
                         <div className="flex flex-wrap items-end gap-4 flex-grow">
                            <div className="flex-grow">
                                 <label htmlFor="student-search" className="block text-[10px] font-black uppercase text-gray-500 mb-1">Search Student</label>
                                 <input
                                     id="student-search"
                                     type="text"
                                     value={searchQuery}
                                     onChange={(e) => setSearchQuery(e.target.value)}
                                     placeholder="Name or reg no..."
                                     className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500 text-sm"
                                 />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setIsUploadModalOpen(true)} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-bold">
                                    Bulk Upload
                                </button>
                                <button onClick={() => setStatsModalCourse(selectedCourse)} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 text-sm font-bold" disabled={enrolledStudents.length === 0}>
                                    Stats
                                </button>
                                <button onClick={handleExportCSV} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-bold" disabled={enrolledStudents.length === 0}>
                                    CSV
                                </button>
                                <button onClick={handlePrint} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-bold" disabled={enrolledStudents.length === 0}>
                                    Print
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {selectedCourseId && (
                <div>
                     <div className="hidden print:block mb-4">
                        <h2 className="text-2xl font-bold">Marks Report</h2>
                        <p className="text-lg">Course: {selectedCourse?.courseName} ({selectedCourse?.courseCode})</p>
                        <p className="text-sm">Printed on: {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-300 uppercase">Student Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-300 uppercase">Reg No.</th>
                                    <th className="px-4 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-300 uppercase">Intake</th>
                                    <th className="px-4 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-300 uppercase">CATs</th>
                                    <th className="px-4 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-300 uppercase">CW</th>
                                    <th className="px-4 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-300 uppercase">Exam</th>
                                    <th className="px-4 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-300 uppercase">Total</th>
                                    <th className="px-4 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-300 uppercase">Grade</th>
                                    <th className="px-4 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-300 uppercase print:hidden">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {enrolledStudents.length > 0 ? enrolledStudents.map(student => {
                                    const intake = intakes.find(i => i.id === student.intakeId);
                                    const currentMarks = studentMarks.get(student.enrollmentId) || { cats: 0, coursework: 0, finalExam: 0 };
                                    const total = calculateTotal({
                                        id: '',
                                        enrollmentId: student.enrollmentId,
                                        cats: currentMarks.cats,
                                        coursework: currentMarks.coursework,
                                        finalExam: currentMarks.finalExam,
                                    });
                                    const grade = calculateGrade(total);
                                    const status = saveStatus.get(student.enrollmentId);
                                    return (
                                        <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{student.fullName}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-[10px] text-gray-400 font-mono">{student.registrationNumber}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-[10px] font-black text-indigo-500 uppercase">{intake?.name || '-'}</td>
                                            <td className="px-4 py-4">
                                                <MarkInput enrollmentId={student.enrollmentId} field="cats" max={MAX_MARKS.cats} value={currentMarks.cats} onChange={handleMarkChange} />
                                                <span className="hidden print:inline">{currentMarks.cats}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <MarkInput enrollmentId={student.enrollmentId} field="coursework" max={MAX_MARKS.coursework} value={currentMarks.coursework} onChange={handleMarkChange} />
                                                <span className="hidden print:inline">{currentMarks.coursework}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <MarkInput enrollmentId={student.enrollmentId} field="finalExam" max={MAX_MARKS.finalExam} value={currentMarks.finalExam} onChange={handleMarkChange} />
                                                <span className="hidden print:inline">{currentMarks.finalExam}</span>
                                            </td>
                                            <td className="px-4 py-4 text-sm font-black text-primary-600">{total}</td>
                                            <td className="px-4 py-4 text-sm font-black">{grade}</td>
                                            <td className="px-4 py-4 print:hidden w-20 text-center"><StatusIndicator status={status} /></td>
                                        </tr>
                                    )
                                }) : (
                                    <tr>
                                        <td colSpan={9} className="text-center py-12 text-gray-500 dark:text-gray-400 italic">
                                            {totalEnrolledCount > 0 
                                                ? "No students match the current filters."
                                                : "No students enrolled in this course unit."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            Class Strength: <span className="text-gray-900 dark:text-white">{enrolledStudents.length}</span>
                        </p>
                    </div>
                </div>
            )}
            {isUploadModalOpen && selectedCourseId && (
                <BulkUploadModal
                    courseId={selectedCourseId}
                    onClose={() => setIsUploadModalOpen(false)}
                />
            )}
            {statsModalCourse && <GradeDistributionModal course={statsModalCourse} onClose={() => setStatsModalCourse(null)} />}
        </div>
    );
};

export default MarksEntry;