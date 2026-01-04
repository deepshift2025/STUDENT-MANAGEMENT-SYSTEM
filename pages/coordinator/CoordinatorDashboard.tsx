import React, { useState } from 'react';
import Header from '../../components/Header';
import { useData } from '../../contexts/DataContext';
import StudentManagement from '../admin/StudentManagement';
import MarksEntry from '../admin/MarksEntry';
import GroupManagement from '../student/GroupManagement';
import Notifications from '../admin/Notifications';
import MCQTestManagement from '../admin/MCQTestManagement';
import TestPerformanceReview from '../admin/TestPerformanceReview';

type CoordinatorTab = 'students' | 'enrollment' | 'mcq' | 'test-performance' | 'groups' | 'notifications';

const CoordinatorDashboard: React.FC = () => {
  const { currentUser, courses } = useData();
  const [activeTab, setActiveTab] = useState<CoordinatorTab>('students');

  if (!currentUser) return null;

  const managedCourse = courses.find(c => c.id === currentUser.managedCourseId);

  const renderContent = () => {
    switch (activeTab) {
      case 'students':
        return (
            <div className="space-y-6">
                <div className="bg-primary-50 dark:bg-primary-900/20 p-5 rounded-xl border border-primary-100 dark:border-primary-800 shadow-sm">
                    <h4 className="font-bold text-primary-800 dark:text-primary-200">Management Scope</h4>
                    <p className="text-sm text-primary-700 dark:text-primary-300 mt-1">
                        Viewing students in <span className="font-bold underline decoration-primary-300">{managedCourse?.courseCode}</span> ({currentUser.managedSession} session).
                    </p>
                </div>
                <StudentManagement />
            </div>
        );
      case 'enrollment':
        return <MarksEntry />;
      case 'mcq':
        return (
            <div className="space-y-6">
                 <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm">
                    <h4 className="font-bold text-indigo-800 dark:text-indigo-200">Course Assessment</h4>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                        Creating and managing MCQ tests for <span className="font-bold underline decoration-indigo-300">{managedCourse?.courseName}</span>.
                    </p>
                </div>
                <MCQTestManagement />
            </div>
        );
      case 'test-performance':
        return <TestPerformanceReview />;
      case 'groups':
        return (
            <div className="space-y-6">
                <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-xl border border-amber-100 dark:border-amber-800 shadow-sm">
                    <h4 className="font-bold text-amber-800 dark:text-amber-200">Group Allocation</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        Forming project groups for <span className="font-bold underline decoration-amber-300">{managedCourse?.courseName}</span>.
                    </p>
                </div>
                <GroupManagement />
            </div>
        );
      case 'notifications':
        return <Notifications />;
      default:
        return <StudentManagement />;
    }
  };

  const TabButton: React.FC<{ tabName: CoordinatorTab; label: string; icon: React.ReactNode }> = ({ tabName, label, icon }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
        activeTab === tabName
          ? 'bg-primary-600 text-white shadow-md'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <span className={`${activeTab === tabName ? 'text-white' : 'text-gray-400'}`}>
        {icon}
      </span>
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header currentUser={currentUser} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          
          <div className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 print:hidden">
            <nav className="flex flex-wrap gap-2">
              <TabButton 
                tabName="students" 
                label="Student Registry" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
              />
              <TabButton 
                tabName="enrollment" 
                label="Unit Marks" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
              />
              <TabButton 
                tabName="mcq" 
                label="MCQ Setup" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              <TabButton 
                tabName="test-performance" 
                label="Test Results" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              <TabButton 
                tabName="groups" 
                label="Allocations" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
              />
              <TabButton 
                tabName="notifications" 
                label="Announcements" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>}
              />
            </nav>
          </div>

          <div className="flex-grow min-w-0">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CoordinatorDashboard;