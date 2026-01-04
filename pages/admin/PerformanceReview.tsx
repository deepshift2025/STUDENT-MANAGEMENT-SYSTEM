import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { Role } from '../../types';
import { calculateGrade, calculateTotal, calculateComponentGrade } from '../../utils/gradeCalculator';
import { GRADE_SCALE, MAX_MARKS } from '../../constants';

interface PerformanceData {
    studentId: string;
    fullName: string;
    registrationNumber: string;
    intakeId?: string;
    cats: number | null;
    coursework: number | null;
    finalExam: number | null;
    total: number;
    grade: string;
}

type SortKey = keyof Omit<PerformanceData, 'studentId'>;
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
    key: SortKey;
    direction: SortDirection;
}

type AnalysisType = 'overall' | 'cats' | 'coursework' | 'finalExam';


const GRADE_COLORS: { [key: string]: string } = {
    'A+': 'bg-emerald-500',
    'A': 'bg-green-500',
    'B+': 'bg-lime-500',
    'B': 'bg-yellow-500',
    'C+': 'bg-amber-500',
    'C': 'bg-orange-500',
    'D': 'bg-red-500',
    'E': 'bg-rose-600',
    'F': 'bg-red-700',
};

const PerformanceReview: React.FC = () => {
    const { courses, users, enrollments, intakes, marks, getMarksForEnrollment } = useData();
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedIntakeId, setSelectedIntakeId] = useState<string>('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'fullName', direction: 'ascending' });
    const [analysisType, setAnalysisType] = useState<AnalysisType>('overall');

    const performanceData = useMemo((): PerformanceData[] => {
        if (!selectedCourseId) return [];

        const students = users.filter(u => u.role === Role.STUDENT);
        const courseEnrollments = enrollments.filter(e => e.courseId === selectedCourseId);

        let data = courseEnrollments.map(enrollment => {
            const student = students.find(s => s.id === enrollment.studentId);
            if (!student) return null;

            const mark = getMarksForEnrollment(enrollment.id);
            
            let displayTotal: number;
            let displayGrade: string;

            if (!mark) {
                displayTotal = 0;
                displayGrade = 'N/A';
            } else {
                switch (analysisType) {
                    case 'cats':
                        displayTotal = mark.cats;
                        displayGrade = calculateComponentGrade(mark.cats, MAX_MARKS.cats);
                        break;
                    case 'coursework':
                        displayTotal = mark.coursework;
                        displayGrade = calculateComponentGrade(mark.coursework, MAX_MARKS.coursework);
                        break;
                    case 'finalExam':
                        displayTotal = mark.finalExam;
                        displayGrade = calculateComponentGrade(mark.finalExam, MAX_MARKS.finalExam);
                        break;
                    case 'overall':
                    default:
                        displayTotal = calculateTotal(mark);
                        displayGrade = calculateGrade(displayTotal);
                        break;
                }
            }

            return {
                studentId: student.id,
                fullName: student.fullName,
                registrationNumber: student.registrationNumber,
                intakeId: student.intakeId,
                cats: mark?.cats ?? null,
                coursework: mark?.coursework ?? null,
                finalExam: mark?.finalExam ?? null,
                total: displayTotal,
                grade: displayGrade,
            };
        }).filter((item): item is PerformanceData => item !== null);

        if (selectedIntakeId) {
            data = data.filter(p => p.intakeId === selectedIntakeId);
        }

        return data;

    }, [selectedCourseId, selectedIntakeId, users, enrollments, marks, getMarksForEnrollment, analysisType]);

    const summaryStats = useMemo(() => {
        const totalEnrolled = performanceData.length;
        const studentsWithMarks = performanceData.filter(p => p.grade !== 'N/A');
        const countWithMarks = studentsWithMarks.length;
        
        if (countWithMarks === 0) {
            return { totalEnrolled, countWithMarks, averageScore: 0 };
        }

        const totalScoreSum = studentsWithMarks.reduce((sum, p) => sum + p.total, 0);
        const averageScore = totalScoreSum / countWithMarks;

        return {
            totalEnrolled,
            countWithMarks,
            averageScore: parseFloat(averageScore.toFixed(2)),
        };
    }, [performanceData]);
    
    const gradeDistribution = useMemo(() => {
        const distribution = new Map<string, number>();
        GRADE_SCALE.forEach(({ grade }) => distribution.set(grade, 0));
        
        let studentsWithGrades = 0;
        performanceData.forEach(p => {
            if (p.grade !== 'N/A' && distribution.has(p.grade)) {
                distribution.set(p.grade, (distribution.get(p.grade) || 0) + 1);
                studentsWithGrades++;
            }
        });
        
        return { distribution, studentsWithGrades };
    }, [performanceData]);
    
    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedPerformanceData = useMemo(() => {
        let sortableItems = [...performanceData];
        sortableItems.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue === null || bValue === null) return 0;

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            }
            
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
            }

            return 0;
        });
        return sortableItems;
    }, [performanceData, sortConfig]);

    const analysisLabels = useMemo(() => ({
        overall: { average: 'Class Average (Overall)', max: 100 },
        cats: { average: 'Class Average (CATS)', max: MAX_MARKS.cats },
        coursework: { average: 'Class Average (Course Work)', max: MAX_MARKS.coursework },
        finalExam: { average: 'Class Average (Final Exam)', max: MAX_MARKS.finalExam },
    }), []);


    const SortableHeader: React.FC<{ label: string; sortKey: SortKey }> = ({ label, sortKey }) => {
        const isSorted = sortConfig.key === sortKey;
        const icon = isSorted ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : <span className="text-gray-400">↕</span>;
        return (
            <th 
                onClick={() => requestSort(sortKey)} 
                className="px-6 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            >
                <div className="flex items-center space-x-1">
                    <span>{label}</span>
                    <span>{icon}</span>
                </div>
            </th>
        );
    };

    const { distribution, studentsWithGrades } = gradeDistribution;
    const sortedDistribution = useMemo(() => Array.from(distribution.entries()).sort((a, b) => {
        const gradeA = GRADE_SCALE.findIndex(g => g.grade === a[0]);
        const gradeB = GRADE_SCALE.findIndex(g => g.grade === b[0]);
        return gradeA - gradeB;
    }), [distribution]);
    const maxCount = Array.from<number>(distribution.values()).reduce((max, v) => Math.max(max, v), 0);

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Course Performance Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="course-select-perf" className="block text-[10px] font-black uppercase text-gray-500 mb-1">Select Course Unit</label>
                        <select
                            id="course-select-perf"
                            value={selectedCourseId}
                            onChange={e => setSelectedCourseId(e.target.value)}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        >
                            <option value="">-- Select a Course --</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>{course.courseCode} - {course.courseName}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="intake-select-perf" className="block text-[10px] font-black uppercase text-gray-500 mb-1">S-Intake Group</label>
                        <select
                            id="intake-select-perf"
                            value={selectedIntakeId}
                            onChange={e => setSelectedIntakeId(e.target.value)}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            disabled={!selectedCourseId}
                        >
                            <option value="">All Intakes</option>
                            {intakes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="analysis-type-select" className="block text-[10px] font-black uppercase text-gray-500 mb-1">Analysis Type</label>
                        <select
                            id="analysis-type-select"
                            value={analysisType}
                            onChange={e => setAnalysisType(e.target.value as AnalysisType)}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            disabled={!selectedCourseId}
                        >
                            <option value="overall">Overall Performance</option>
                            <option value="cats">CATS only</option>
                            <option value="coursework">Course Work only</option>
                            <option value="finalExam">Final Exam only</option>
                        </select>
                    </div>
                </div>
            </div>

            {selectedCourseId && performanceData.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center border border-gray-100 dark:border-gray-700">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Sample Size</p>
                            <p className="text-3xl font-black text-indigo-600">{summaryStats.totalEnrolled}</p>
                            <p className="text-[10px] text-gray-400 mt-2">ENROLLED STUDENTS</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center border border-gray-100 dark:border-gray-700">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{analysisLabels[analysisType].average}</p>
                             <p className="text-3xl font-black text-primary-600">
                                {summaryStats.countWithMarks > 0 ? summaryStats.averageScore : 'N/A'}
                                <span className="text-sm font-bold text-gray-400">/{analysisLabels[analysisType].max}</span>
                            </p>
                            <p className="text-[10px] text-gray-400 mt-2">CLASS PERFORMANCE</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center border border-gray-100 dark:border-gray-700">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Submission Rate</p>
                            <p className="text-3xl font-black text-teal-600">
                                {summaryStats.totalEnrolled > 0 ? Math.round((summaryStats.countWithMarks / summaryStats.totalEnrolled) * 100) : 0}%
                            </p>
                            <p className="text-[10px] text-gray-400 mt-2">{summaryStats.countWithMarks} ENTRIES LOGGED</p>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-black text-gray-800 dark:text-gray-200 mb-6 uppercase tracking-tight">Grade Spectrum Analysis</h3>
                        {studentsWithGrades > 0 ? (
                            <div className="space-y-4">
                                {sortedDistribution.map(([grade, count]: [string, number]) => {
                                    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                                    const colorClass = GRADE_COLORS[grade] || 'bg-gray-500';
                                    return (
                                        <div key={grade} className="flex items-center space-x-4">
                                            <span className="font-black text-sm w-10 text-right text-gray-700 dark:text-gray-300">{grade}</span>
                                            <div className="flex-grow bg-gray-100 dark:bg-gray-700 rounded-lg h-8 relative overflow-hidden">
                                                <div 
                                                    className={`${colorClass} h-full rounded-lg flex items-center justify-start pl-4 text-white text-xs font-black transition-all duration-700 ease-out`}
                                                    style={{ width: `${percentage}%` }}
                                                >
                                                   {count > 0 ? `${count} Student(s)` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-12 italic">No evaluation data available for selected criteria.</p>
                        )}
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                       <h3 className="text-lg font-black text-gray-800 dark:text-gray-200 mb-6 uppercase tracking-tight">Granular Performance List</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <SortableHeader label="Full Name" sortKey="fullName" />
                                        <SortableHeader label="Reg. Number" sortKey="registrationNumber" />
                                        <SortableHeader label="Intake" sortKey="intakeId" />
                                        <SortableHeader label="CATs" sortKey="cats" />
                                        <SortableHeader label="CW" sortKey="coursework" />
                                        <SortableHeader label="Exam" sortKey="finalExam" />
                                        <SortableHeader label={`Score`} sortKey="total" />
                                        <SortableHeader label="Grade" sortKey="grade" />
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {sortedPerformanceData.map(student => {
                                        const intake = intakes.find(i => i.id === student.intakeId);
                                        return (
                                        <tr key={student.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{student.fullName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-[10px] text-gray-400 font-mono">{student.registrationNumber}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-[10px] font-black text-indigo-500 uppercase">{intake?.name || '-'}</td>
                                            <td className="px-6 py-4 text-xs font-medium">{student.cats ?? 'N/A'}</td>
                                            <td className="px-6 py-4 text-xs font-medium">{student.coursework ?? 'N/A'}</td>
                                            <td className="px-6 py-4 text-xs font-medium">{student.finalExam ?? 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm font-black text-primary-600">{student.grade !== 'N/A' ? student.total : 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm font-black">{student.grade}</td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
            
            {selectedCourseId && performanceData.length === 0 && (
                <div className="bg-white dark:bg-gray-800 p-12 rounded-xl shadow-sm text-center border border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 italic">No enrollment found matching the selected intake group for this course.</p>
                </div>
            )}
        </div>
    );
};

export default PerformanceReview;