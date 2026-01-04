import React from 'react';
import { User } from '../../types';
import { useData } from '../../contexts/DataContext';

interface StudentDetailsModalProps {
  student: User;
  onClose: () => void;
}

const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({ student, onClose }) => {
  const { courses, enrollments } = useData();

  const enrolledCourses = enrollments
    .filter(e => e.studentId === student.id)
    .map(enrollment => courses.find(c => c.id === enrollment.courseId))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  const DetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
    <div>
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{value || 'N/A'}</dd>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{student.fullName}</h2>
            <p className="text-md font-medium text-gray-600 dark:text-gray-300">{student.registrationNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl leading-none">&times;</button>
        </div>

        <div className="overflow-y-auto flex-grow pr-2 space-y-6">
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Personal & Academic Details</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
              <DetailItem label="Email Address" value={student.email} />
              <DetailItem label="Telephone" value={student.telephone} />
              <DetailItem label="Course Program" value={student.course} />
              <DetailItem label="Session" value={student.session} />
              <DetailItem label="Year of Study" value={student.yearOfStudy} />
              <DetailItem label="Semester" value={student.semester} />
              <DetailItem label="Group Role" value={student.groupRole} />
            </dl>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Enrolled Courses</h3>
            {enrolledCourses.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700 rounded-md border dark:border-gray-600">
                {enrolledCourses.map(course => (
                  <li key={course.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{course.courseName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{course.courseCode}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">This student is not enrolled in any courses.</p>
            )}
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsModal;