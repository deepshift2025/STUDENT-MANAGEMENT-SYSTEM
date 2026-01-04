import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { User, Role } from '../types';

interface HeaderProps {
  currentUser: User;
}

const Header: React.FC<HeaderProps> = ({ currentUser }) => {
  const { logout, notifications, enrollments, markStudentNotificationsAsRead, markAllNotificationsAsRead } = useData();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = useMemo(() => {
    if (currentUser.role === Role.STUDENT) {
      const enrolledCourseIds = new Set(enrollments.filter(e => e.studentId === currentUser.id).map(e => e.courseId));
      return notifications.filter(n => enrolledCourseIds.has(n.courseId) && !n.isRead).length;
    }
    if (currentUser.role === Role.ADMIN) {
      return notifications.filter(n => !n.isRead).length;
    }
    return 0;
  }, [currentUser, notifications, enrollments]);

  const handleBellClick = async () => {
    if (currentUser.role === Role.STUDENT) {
      await markStudentNotificationsAsRead(currentUser.id);
      navigate('/student', { state: { openNotifications: true } });
    } else if (currentUser.role === Role.ADMIN) {
      await markAllNotificationsAsRead();
      navigate('/admin', { state: { openNotifications: true } });
    }
  };


  return (
    <header className="bg-white dark:bg-gray-800 shadow-md print:hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              Marks Management
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBellClick}
              className={`relative p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-colors duration-200 ${
                unreadCount > 0
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
              } hover:text-gray-700 dark:hover:text-gray-200`}
              aria-label="View notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 flex items-center justify-center h-5 min-w-[1.25rem] px-1 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse ring-2 ring-white dark:ring-gray-800">
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="text-right">
              <p className="font-semibold text-gray-800 dark:text-gray-200">{currentUser.fullName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{currentUser.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
