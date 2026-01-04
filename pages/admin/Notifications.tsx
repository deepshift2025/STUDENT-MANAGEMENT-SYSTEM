import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';

const Notifications: React.FC = () => {
    const { courses, sendNotification, notifications, clearAllNotifications } = useData();
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!selectedCourseId || !title.trim() || !message.trim()) {
            setError('All fields are required.');
            return;
        }
        setIsLoading(true);
        await sendNotification({ courseId: selectedCourseId, title, message });
        setIsLoading(false);
        setSuccess('Notification sent successfully!');
        
        // Reset form
        setSelectedCourseId('');
        setTitle('');
        setMessage('');

        // Clear success message after a few seconds
        setTimeout(() => setSuccess(''), 3000);
    };
    
    const sentNotifications = notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const handleClearHistory = async () => {
        if (window.confirm('Are you sure you want to permanently delete all notification history? This action cannot be undone.')) {
            await clearAllNotifications();
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Send New Notification</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="course-select-notif" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Select Course
                        </label>
                        <select
                            id="course-select-notif"
                            value={selectedCourseId}
                            onChange={e => setSelectedCourseId(e.target.value)}
                            className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="">-- Select a Course to Notify --</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>
                                    {course.courseCode} - {course.courseName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="notif-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Title
                        </label>
                        <input
                            type="text"
                            id="notif-title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                    <div>
                        <label htmlFor="notif-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Message
                        </label>
                        <textarea
                            id="notif-message"
                            rows={5}
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                    
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {success && <p className="text-sm text-green-500">{success}</p>}
                    
                    <div className="text-right">
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-400">
                            {isLoading ? 'Sending...' : 'Send Notification'}
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Sent Notifications</h3>
                    {sentNotifications.length > 0 && (
                        <button
                            onClick={handleClearHistory}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        >
                            Clear History
                        </button>
                    )}
                </div>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {sentNotifications.length > 0 ? sentNotifications.map(notif => {
                        const course = courses.find(c => c.id === notif.courseId);
                        return (
                            <div key={notif.id} className="p-4 border rounded-md dark:border-gray-700">
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{notif.title}</p>
                                    {notif.isRead 
                                        ? <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">Read</span>
                                        : <span className="text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">Unread</span>
                                    }
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    To: {course ? course.courseName : 'Unknown Course'}
                                </p>
                                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{notif.message}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
                                    {new Date(notif.timestamp).toLocaleString()}
                                </p>
                            </div>
                        );
                    }) : (
                        <p className="text-gray-500 dark:text-gray-400">No notifications sent yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
