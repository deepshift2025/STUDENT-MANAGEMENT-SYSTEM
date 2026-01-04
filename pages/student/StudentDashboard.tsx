import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { useData } from '../../contexts/DataContext';
import CourseEnrollment from './CourseEnrollment';
import ViewMarks from './ViewMarks';
import GroupManagement from './GroupManagement';
import Notifications from './Notifications';
import StudentMCQTests from './StudentMCQTests';
import StudentOverview from './StudentOverview';

type StudentTab = 'overview' | 'enroll' | 'marks' | 'tests' | 'group' | 'notifications';

const StudentDashboard: React.FC = () => {
  const { currentUser } = useData();
  const [activeTab, setActiveTab] = useState<StudentTab>('overview');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.openNotifications) {
      setActiveTab('notifications');
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  if (!currentUser) return null;

  const isGroupLeader = currentUser.groupRole === 'Group Leader';

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <StudentOverview onNavigate={setActiveTab} />;
      case 'enroll': return <CourseEnrollment />;
      case 'marks': return <ViewMarks />;
      case 'tests': return <StudentMCQTests />;
      case 'group': return isGroupLeader ? <GroupManagement /> : null;
      case 'notifications': return <Notifications />;
      default: return <StudentOverview onNavigate={setActiveTab} />;
    }
  };

  const TabButton: React.FC<{ tabName: StudentTab; label: string; icon: React.ReactNode }> = ({ tabName, label, icon }) => (
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
                tabName="overview" 
                label="Dashboard" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
              />
              <TabButton 
                tabName="marks" 
                label="My Results" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              <TabButton 
                tabName="tests" 
                label="MCQ Tests" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
              />
              <TabButton 
                tabName="enroll" 
                label="Enrollment" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              {isGroupLeader && (
                <TabButton 
                  tabName="group" 
                  label="Group Profile" 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                />
              )}
              <TabButton 
                tabName="notifications" 
                label="Inbox" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
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

export default StudentDashboard;