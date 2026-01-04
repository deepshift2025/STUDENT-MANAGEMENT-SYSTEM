import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { useData } from '../../contexts/DataContext';
import CourseManagement from './CourseManagement';
import IntakeManagement from './IntakeManagement';
import MarksEntry from './MarksEntry';
import StudentManagement from './StudentManagement';
import PerformanceReview from './PerformanceReview';
import Notifications from './Notifications';
import AssignmentManagement from './AssignmentManagement';
import SystemSettings from './SystemSettings';
import MCQTestManagement from './MCQTestManagement';
import TestPerformanceReview from './TestPerformanceReview';

type AdminTab = 'courses' | 'intakes' | 'marks' | 'students' | 'mcq' | 'test-performance' | 'performance' | 'notifications' | 'assignments' | 'settings';

const AdminDashboard: React.FC = () => {
  const { currentUser } = useData();
  const [activeTab, setActiveTab] = useState<AdminTab>('courses');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.openNotifications) {
      setActiveTab('notifications');
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  if (!currentUser) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'courses': return <CourseManagement />;
      case 'intakes': return <IntakeManagement />;
      case 'marks': return <MarksEntry />;
      case 'students': return <StudentManagement />;
      case 'mcq': return <MCQTestManagement />;
      case 'test-performance': return <TestPerformanceReview />;
      case 'performance': return <PerformanceReview />;
      case 'notifications': return <Notifications />;
      case 'assignments': return <AssignmentManagement />;
      case 'settings': return <SystemSettings />;
      default: return <CourseManagement />;
    }
  };

  const TabButton: React.FC<{ tabName: AdminTab; label: string; icon: React.ReactNode }> = ({ tabName, label, icon }) => (
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
          
          {/* Horizontal Navigation Bar */}
          <div className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 print:hidden overflow-x-auto">
            <nav className="flex flex-nowrap md:flex-wrap gap-2 min-w-max">
              <TabButton 
                tabName="courses" 
                label="Units" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
              />
              <TabButton 
                tabName="intakes" 
                label="Intakes" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
              />
              <TabButton 
                tabName="marks" 
                label="Marks" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
              />
              <TabButton 
                tabName="students" 
                label="Students" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
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
                tabName="performance" 
                label="Analytics" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              />
              <TabButton 
                tabName="notifications" 
                label="Broadcasts" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
              />
              <TabButton 
                tabName="assignments" 
                label="Submissions" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
              />
              <TabButton 
                tabName="settings" 
                label="Settings" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
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

export default AdminDashboard;