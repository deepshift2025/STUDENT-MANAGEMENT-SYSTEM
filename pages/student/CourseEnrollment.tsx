import React, { useMemo, useState } from 'react';
import { useData } from '../../contexts/DataContext';

const CourseEnrollment: React.FC = () => {
  const { currentUser, courses, enrollments, enrollInCourse, unenrollFromCourse } = useData();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const studentEnrollments = useMemo(() => {
    if (!currentUser) return [];
    return enrollments.filter(e => e.studentId === currentUser.id);
  }, [enrollments, currentUser]);

  const enrolledCourseIds = useMemo(() => new Set(studentEnrollments.map(e => e.courseId)), [studentEnrollments]);

  const availableCourses = useMemo(() => {
    return courses.filter(c => !enrolledCourseIds.has(c.id));
  }, [courses, enrolledCourseIds]);

  const enrolledCourses = useMemo(() => {
    return courses.filter(c => enrolledCourseIds.has(c.id));
  }, [courses, enrolledCourseIds]);
  
  const handleEnroll = async (courseId: string) => {
      if (currentUser) {
          setLoadingAction(`enroll-${courseId}`);
          await enrollInCourse(currentUser.id, courseId);
          setLoadingAction(null);
      }
  };

  const handleUnenroll = async (courseId: string) => {
      if(currentUser && window.confirm('Are you sure you want to unenroll from this course? Your marks will be deleted.')) {
          setLoadingAction(`unenroll-${courseId}`);
          await unenrollFromCourse(currentUser.id, courseId);
          setLoadingAction(null);
      }
  };

  const CourseList: React.FC<{
    title: string;
    courseList: typeof courses;
    action: 'enroll' | 'unenroll';
    onAction: (courseId: string) => void;
  }> = ({ title, courseList, action, onAction }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">{title}</h3>
      {courseList.length > 0 ? (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {courseList.map(course => {
            const isLoading = loadingAction === `${action}-${course.id}`;
            return (
                <li key={course.id} className="py-4 flex items-center justify-between">
                <div>
                    <p className="text-md font-semibold text-gray-900 dark:text-white">{course.courseName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{course.courseCode} - {course.academicYear} {course.semester}</p>
                </div>
                <button
                    onClick={() => onAction(course.id)}
                    disabled={isLoading}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    action === 'enroll'
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    } disabled:bg-gray-400`}
                >
                    {isLoading ? 'Processing...' : (action === 'enroll' ? 'Enroll' : 'Unenroll')}
                </button>
                </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No courses available.</p>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <CourseList title="My Enrolled Courses" courseList={enrolledCourses} action="unenroll" onAction={handleUnenroll} />
      <CourseList title="Available Courses" courseList={availableCourses} action="enroll" onAction={handleEnroll} />
    </div>
  );
};

export default CourseEnrollment;
