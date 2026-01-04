import React, { useMemo, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { calculateTotal, calculateGrade } from '../../utils/gradeCalculator';
import { MAX_MARKS } from '../../constants';
import { CourseUnit } from '../../types';
import GradeDistributionModal from './GradeDistributionModal';

const ViewMarks: React.FC = () => {
    const { currentUser, courses, enrollments, marks, getMarksForEnrollment } = useData();
    const [yearFilter, setYearFilter] = useState('');
    const [semesterFilter, setSemesterFilter] = useState('');
    const [statsModalCourse, setStatsModalCourse] = useState<CourseUnit | null>(null);

    const studentMarksData = useMemo(() => {
        if (!currentUser) return [];
        return enrollments
            .filter(e => e.studentId === currentUser.id)
            .map(enrollment => {
                const course = courses.find(c => c.id === enrollment.courseId);
                const mark = getMarksForEnrollment(enrollment.id);
                const total = calculateTotal(mark || null);
                const grade = calculateGrade(total);
                return {
                    course,
                    mark,
                    total,
                    grade
                };
            })
            .filter((item): item is { course: CourseUnit, mark: any, total: number, grade: string } => !!item.course);
    }, [currentUser, enrollments, courses, marks, getMarksForEnrollment]);
    
    const filterOptions = useMemo(() => {
        const years = new Set<string>();
        const semesters = new Set<string>();
        studentMarksData.forEach(data => {
            if (data.course) {
                years.add(data.course.academicYear);
                semesters.add(data.course.semester);
            }
        });
        return {
            academicYears: Array.from(years).sort((a,b) => b.localeCompare(a)), // Sort descending
            semesters: Array.from(semesters).sort()
        };
    }, [studentMarksData]);

    const filteredMarksData = useMemo(() => {
        return studentMarksData.filter(data => {
            if (!data.course) return false;
            const yearMatch = yearFilter ? data.course.academicYear === yearFilter : true;
            const semesterMatch = semesterFilter ? data.course.semester === semesterFilter : true;
            return yearMatch && semesterMatch;
        });
    }, [studentMarksData, yearFilter, semesterFilter]);

    const clearFilters = () => {
        setYearFilter('');
        setSemesterFilter('');
    };

    const printTranscript = () => {
        window.print();
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6 print:hidden">
                 <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">My Academic Performance</h3>
                 <button onClick={printTranscript} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                    Print Transcript
                 </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 mb-6 print:hidden">
                <div className="flex-1 min-w-[150px]">
                    <label htmlFor="year-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Filter by Year
                    </label>
                    <select
                        id="year-filter"
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                        <option value="">All Years</option>
                        {filterOptions.academicYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label htmlFor="semester-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Filter by Semester
                    </label>
                    <select
                        id="semester-filter"
                        value={semesterFilter}
                        onChange={(e) => setSemesterFilter(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                        <option value="">All Semesters</option>
                        {filterOptions.semesters.map(semester => (
                            <option key={semester} value={semester}>{semester}</option>
                        ))}
                    </select>
                </div>
                {(yearFilter || semesterFilter) && (
                    <div className="self-end">
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
           
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Course Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Course Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">CATs ({MAX_MARKS.cats})</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Course Work ({MAX_MARKS.coursework})</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Final Exam ({MAX_MARKS.finalExam})</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total (100)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Grade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase print:hidden">Stats</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredMarksData.length > 0 ? filteredMarksData.map(data => (
                            <tr key={data.course!.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{data.course!.courseCode}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{data.course!.courseName}</td>
                                <td className="px-6 py-4 text-sm">{data.mark?.cats ?? 'N/A'}</td>
                                <td className="px-6 py-4 text-sm">{data.mark?.coursework ?? 'N/A'}</td>
                                <td className="px-6 py-4 text-sm">{data.mark?.finalExam ?? 'N/A'}</td>
                                <td className="px-6 py-4 text-sm font-semibold">{data.mark ? data.total : 'N/A'}</td>
                                <td className="px-6 py-4 text-sm font-semibold">{data.mark ? data.grade : 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium print:hidden">
                                    <button
                                        onClick={() => setStatsModalCourse(data.course!)}
                                        className="text-primary-600 hover:text-primary-800 disabled:text-gray-400"
                                        disabled={!data.mark}
                                        title={!data.mark ? "Marks not yet entered" : "View grade distribution"}
                                    >
                                        View Stats
                                    </button>
                                </td>
                            </tr>
                        )) : (
                             <tr>
                                <td colSpan={8} className="text-center py-4 text-gray-500 dark:text-gray-400">
                                    {studentMarksData.length > 0
                                        ? 'No marks match the current filters.'
                                        : 'You are not enrolled in any courses or marks have not been entered yet.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {statsModalCourse && <GradeDistributionModal course={statsModalCourse} onClose={() => setStatsModalCourse(null)} />}
        </div>
    );
};

export default ViewMarks;