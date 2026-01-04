import React, { useMemo } from 'react';
import { CourseUnit, Mark } from '../../types';
import { useData } from '../../contexts/DataContext';
import { calculateGrade, calculateTotal } from '../../utils/gradeCalculator';
import { GRADE_SCALE } from '../../constants';

interface GradeDistributionModalProps {
    course: CourseUnit;
    onClose: () => void;
}

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


const GradeDistributionModal: React.FC<GradeDistributionModalProps> = ({ course, onClose }) => {
    const { enrollments, marks, getMarksForEnrollment } = useData();

    const gradeDistribution = useMemo(() => {
        const courseEnrollments = enrollments.filter(e => e.courseId === course.id);
        const grades = courseEnrollments.map(e => {
            const mark = getMarksForEnrollment(e.id);
            if (!mark) return null;
            const total = calculateTotal(mark);
            return calculateGrade(total);
        }).filter((g): g is string => g !== null && g !== 'N/A');

        const distribution = new Map<string, number>();
        GRADE_SCALE.forEach(({ grade }) => distribution.set(grade, 0));

        let totalStudentsWithMarks = 0;
        grades.forEach(grade => {
            if (distribution.has(grade)) {
                distribution.set(grade, (distribution.get(grade) || 0) + 1);
            }
            totalStudentsWithMarks++;
        });

        return { distribution, totalStudentsWithMarks };
    }, [course, enrollments, marks, getMarksForEnrollment]);

    const { distribution, totalStudentsWithMarks } = gradeDistribution;
    
    const sortedDistribution = useMemo(() => {
        return Array.from(distribution.entries()).sort((a, b) => {
            const gradeA = GRADE_SCALE.findIndex(g => g.grade === a[0]);
            const gradeB = GRADE_SCALE.findIndex(g => g.grade === b[0]);
            return gradeA - gradeB;
        });
    }, [distribution]);

    const maxCount = Array.from<number>(distribution.values()).reduce((max, v) => Math.max(max, v), 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">Grade Distribution</h2>
                        <h3 className="text-md sm:text-lg font-semibold text-gray-700 dark:text-gray-300 mt-1">{course.courseName}</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl leading-none">&times;</button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{totalStudentsWithMarks} student(s) with marks entered.</p>
                
                {totalStudentsWithMarks > 0 ? (
                    <div className="space-y-3">
                        {sortedDistribution.map(([grade, count]: [string, number]) => {
                            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                            const colorClass = GRADE_COLORS[grade] || 'bg-gray-500';
                            return (
                                <div key={grade} className="flex items-center space-x-2 sm:space-x-4">
                                    <span className="font-semibold w-8 text-right text-gray-700 dark:text-gray-300">{grade}</span>
                                    <div className="flex-grow bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative">
                                        <div 
                                            className={`${colorClass} h-6 rounded-full flex items-center justify-start pl-2 text-white text-sm font-bold transition-all duration-500`}
                                            style={{ width: `${percentage}%` }}
                                        >
                                           {count > 0 ? count : ''}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">No marks have been entered for this course yet.</p>
                )}
                 <div className="mt-6 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GradeDistributionModal;