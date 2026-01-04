import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { User, Role } from '../../types';

interface BulkUnenrollModalProps {
  selectedStudentIds: string[];
  onClose: () => void;
}

const BulkUnenrollModal: React.FC<BulkUnenrollModalProps> = ({ selectedStudentIds, onClose }) => {
  const { users, courses, enrollments, bulkUnenrollStudentsFromCourse } = useData();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedStudents = useMemo(() => {
    const idSet = new Set(selectedStudentIds);
    return users.filter(u => u.role === Role.STUDENT && idSet.has(u.id));
  }, [users, selectedStudentIds]);

  const studentsToUnenroll = useMemo(() => {
    if (!selectedCourseId) return [];
    const idSet = new Set(selectedStudentIds);
    return enrollments
      .filter(e => e.courseId === selectedCourseId && idSet.has(e.studentId))
      .map(e => users.find(u => u.id === e.studentId))
      .filter((u): u is User => !!u);
  }, [selectedCourseId, selectedStudentIds, enrollments, users]);

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  const handleUnenroll = async () => {
    if (!selectedCourseId || studentsToUnenroll.length === 0) return;

    if (window.confirm(`Are you sure you want to unenroll ${studentsToUnenroll.length} student(s) from ${selectedCourse?.courseName}? Their marks for this course will be permanently deleted.`)) {
        setIsProcessing(true);
        try {
            await bulkUnenrollStudentsFromCourse(studentsToUnenroll.map(s => s.id), selectedCourseId);
            alert(`${studentsToUnenroll.length} student(s) have been unenrolled successfully.`);
            onClose();
        } catch (error) {
            alert('An error occurred during the unenrollment process.');
        } finally {
            setIsProcessing(false);
        }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">Bulk Unenroll Students</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl leading-none">&times;</button>
        </div>

        <div className="overflow-y-auto flex-grow pr-2 space-y-6">
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                You have selected {selectedStudents.length} student(s):
              </p>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-600 dark:text-gray-400 max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">
                {selectedStudents.map(s => <li key={s.id}>{s.fullName} ({s.registrationNumber})</li>)}
              </ul>
            </div>
            
            <div>
              <label htmlFor="course-unenroll-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select course to unenroll from:
              </label>
              <select
                id="course-unenroll-select"
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(e.target.value)}
                className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">-- Select a Course --</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.courseCode} - {course.courseName}</option>
                ))}
              </select>
            </div>

            {selectedCourseId && (
              <div className={`p-4 rounded-md ${studentsToUnenroll.length > 0 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800' : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800'}`}>
                <p className="text-sm">
                  {studentsToUnenroll.length > 0
                    ? `A total of ${studentsToUnenroll.length} of the selected students are enrolled in this course and will be unenrolled.`
                    : `None of the selected students are enrolled in this course.`}
                </p>
              </div>
            )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
            Cancel
          </button>
          <button
            onClick={handleUnenroll}
            disabled={isProcessing || !selectedCourseId || studentsToUnenroll.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : `Unenroll ${studentsToUnenroll.length} Student(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUnenrollModal;
