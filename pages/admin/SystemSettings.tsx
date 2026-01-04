import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { Role } from '../../types';
import { SESSION_OPTIONS } from '../../constants';

const SystemSettings: React.FC = () => {
    const { systemSettings, updateSystemSettings, users, updateUserRole, currentUser, courses } = useData();

    const [allowRegistration, setAllowRegistration] = useState(systemSettings.allowStudentRegistration);
    const [notificationEnabled, setNotificationEnabled] = useState(systemSettings.globalNotification.enabled);
    const [notificationMessage, setNotificationMessage] = useState(systemSettings.globalNotification.message);
    const [theme, setTheme] = useState(systemSettings.theme);
    const [successMessage, setSuccessMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Coordinator assignment state
    const [assigningUserId, setAssigningUserId] = useState<string | null>(null);
    const [managedCourseId, setManagedCourseId] = useState('');
    const [managedSession, setManagedSession] = useState(SESSION_OPTIONS[0]);

    const handleSave = async () => {
        setIsSaving(true);
        await updateSystemSettings({
            allowStudentRegistration: allowRegistration,
            theme: theme,
            globalNotification: {
                enabled: notificationEnabled,
                message: notificationMessage,
                id: notificationEnabled ? `notif-${Date.now()}` : systemSettings.globalNotification.id,
            }
        });
        setIsSaving(false);
        setSuccessMessage('Settings saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handleRoleChange = async (userId: string, newRole: Role) => {
        if (newRole === Role.COORDINATOR) {
            setAssigningUserId(userId);
            return;
        }

        if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
            await updateUserRole(userId, newRole);
        }
    };

    const confirmCoordinatorPromotion = async () => {
        if (!assigningUserId || !managedCourseId) return;
        await updateUserRole(assigningUserId, Role.COORDINATOR, managedCourseId, managedSession);
        setAssigningUserId(null);
        setManagedCourseId('');
    };
    
    const adminCount = useMemo(() => users.filter(u => u.role === Role.ADMIN).length, [users]);

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">System Settings</h2>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">General Settings</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-md border dark:border-gray-700">
                        <div>
                            <label htmlFor="allow-registration" className="font-medium text-gray-700 dark:text-gray-300">Allow New Student Registration</label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">If disabled, the registration page will be hidden.</p>
                        </div>
                        <label htmlFor="allow-registration" className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input type="checkbox" id="allow-registration" className="sr-only" checked={allowRegistration} onChange={() => setAllowRegistration(!allowRegistration)} />
                                <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${allowRegistration ? 'translate-x-full bg-primary-500' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Global Announcement Banner</h3>
                <div className="space-y-4">
                     <div className="flex items-center justify-between p-3 rounded-md border dark:border-gray-700">
                        <div>
                            <label htmlFor="enable-notification" className="font-medium text-gray-700 dark:text-gray-300">Enable Announcement Banner</label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Show a banner at the top of every page.</p>
                        </div>
                        <label htmlFor="enable-notification" className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input type="checkbox" id="enable-notification" className="sr-only" checked={notificationEnabled} onChange={() => setNotificationEnabled(!notificationEnabled)} />
                                <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${notificationEnabled ? 'translate-x-full bg-primary-500' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                    {notificationEnabled && (
                        <div>
                            <label htmlFor="notification-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Banner Message</label>
                            <textarea
                                id="notification-message"
                                rows={3}
                                value={notificationMessage}
                                onChange={e => setNotificationMessage(e.target.value)}
                                className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                    )}
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Appearance</h3>
                 <div className="space-y-2">
                     <p className="text-sm text-gray-600 dark:text-gray-400">Choose how the application looks. This will be the default for all users.</p>
                     <div className="flex items-center space-x-4">
                         <label className="flex items-center space-x-2"><input type="radio" name="theme" value="light" checked={theme === 'light'} onChange={() => setTheme('light')} className="text-primary-600"/><span>Light</span></label>
                         <label className="flex items-center space-x-2"><input type="radio" name="theme" value="dark" checked={theme === 'dark'} onChange={() => setTheme('dark')} className="text-primary-600"/><span>Dark</span></label>
                         <label className="flex items-center space-x-2"><input type="radio" name="theme" value="system" checked={theme === 'system'} onChange={() => setTheme('system')} className="text-primary-600"/><span>System</span></label>
                     </div>
                 </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">User Role Management</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Full Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Registration No.</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Assignment</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {users.map(user => {
                                const managedCourse = courses.find(c => c.id === user.managedCourseId);
                                return (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 text-sm font-medium">{user.fullName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">{user.registrationNumber}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <select 
                                            value={user.role} 
                                            onChange={e => handleRoleChange(user.id, e.target.value as Role)}
                                            className="p-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                            disabled={user.id === currentUser?.id && adminCount <= 1 && user.role === Role.ADMIN}
                                        >
                                            <option value={Role.STUDENT}>Student</option>
                                            <option value={Role.COORDINATOR}>Coordinator</option>
                                            <option value={Role.ADMIN}>Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {user.role === Role.COORDINATOR ? (
                                            managedCourse ? `${managedCourse.courseCode} (${user.managedSession})` : 'Unassigned'
                                        ) : '-'}
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Coordinator Promotion Modal */}
            {assigningUserId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">Assign Coordinator Rights</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Select the course unit and session this coordinator will manage.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Managed Course</label>
                                <select 
                                    value={managedCourseId} 
                                    onChange={e => setManagedCourseId(e.target.value)}
                                    className="w-full p-2 border rounded-md dark:bg-gray-700"
                                >
                                    <option value="">-- Select Course --</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.courseCode} - {c.courseName}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Managed Session</label>
                                <select 
                                    value={managedSession} 
                                    onChange={e => setManagedSession(e.target.value)}
                                    className="w-full p-2 border rounded-md dark:bg-gray-700"
                                >
                                    {SESSION_OPTIONS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setAssigningUserId(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                            <button 
                                onClick={confirmCoordinatorPromotion}
                                disabled={!managedCourseId}
                                className="px-4 py-2 bg-primary-600 text-white rounded disabled:bg-primary-300"
                            >
                                Confirm Promotion
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-end items-center gap-4">
                {successMessage && <p className="text-green-500 text-sm">{successMessage}</p>}
                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-400">
                    {isSaving ? 'Saving...' : 'Save All Settings'}
                </button>
            </div>
        </div>
    );
};

export default SystemSettings;