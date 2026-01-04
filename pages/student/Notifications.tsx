import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';

const Notifications: React.FC = () => {
    const { currentUser, notifications, enrollments, courses } = useData();

    const studentNotifications = useMemo(() => {
        if (!currentUser) return [];

        const enrolledCourseIds = new Set(
            enrollments.filter(e => e.studentId === currentUser.id).map(e => e.courseId)
        );

        return notifications
            .filter(notif => enrolledCourseIds.has(notif.courseId))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [currentUser, notifications, enrollments]);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">My Notifications</h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {studentNotifications.length > 0 ? studentNotifications.map(notif => {
                    const course = courses.find(c => c.id === notif.courseId);
                    const isUnread = !notif.isRead;
                    return (
                        <div key={notif.id} className={`p-4 border rounded-md transition-colors ${isUnread ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 dark:border-primary-500' : 'bg-gray-50 dark:bg-gray-700/50 dark:border-gray-700'}`}>
                            <div className="flex justify-between items-start flex-wrap gap-2">
                                <div>
                                    <p className="font-semibold text-lg text-gray-800 dark:text-gray-200">{notif.title}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        For: {course ? `${course.courseCode} - ${course.courseName}` : 'A course you are enrolled in'}
                                    </p>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                                    {new Date(notif.timestamp).toLocaleString()}
                                </p>
                            </div>
                            <p className="mt-3 text-md text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{notif.message}</p>
                        </div>
                    );
                }) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">You have no new notifications.</p>
                )}
            </div>
        </div>
    );
};

export default Notifications;