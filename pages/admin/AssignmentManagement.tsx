import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { api } from '../../utils/api';
import { GroupProfile } from '../../types';

const AssignmentManagement: React.FC = () => {
    const { users } = useData();
    const [submittedAssignments, setSubmittedAssignments] = useState<GroupProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadAssignments = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const assignments = await api.fetchAssignments();
                setSubmittedAssignments(assignments);
            } catch (err) {
                setError('Failed to load submitted assignments. This may be due to a connection timeout or a database error.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadAssignments();
    }, []);

    const handleDownload = async (leaderId: string, groupName: string) => {
        setIsDownloading(leaderId);
        try {
            const assignment = await api.fetchAssignmentData(leaderId);
            
            if (!assignment) {
                alert('Could not retrieve file data for this group.');
                return;
            }

            // Decode base64
            const byteCharacters = atob(assignment.data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);

            // Create blob
            const blob = new Blob([byteArray], { type: assignment.type });

            // Create a link and trigger download
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = assignment.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Download failed:", err);
            alert("Failed to download file. Please try again.");
        } finally {
            setIsDownloading(null);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Submitted Group Assignments</h3>
            </div>
            
            <div className="overflow-x-auto">
                {isLoading ? (
                    <div className="text-center py-12 flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-500 dark:text-gray-400">Fetching submission registry...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-12 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                        <p className="text-red-500 font-medium mb-2">{error}</p>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="text-sm font-bold text-red-600 hover:underline"
                        >
                            Retry Loading
                        </button>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Group Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project Brief</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Group Leader</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assignment File</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {submittedAssignments.length > 0 ? submittedAssignments.map(profile => {
                                const leader = users.find(user => user.id === profile.leaderId);
                                const isThisDownloading = isDownloading === profile.leaderId;

                                return (
                                    <tr key={profile.leaderId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{profile.groupName}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={profile.projectBrief}>{profile.projectBrief}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{leader ? leader.fullName : 'Unknown'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleDownload(profile.leaderId, profile.groupName)}
                                                disabled={!!isDownloading}
                                                className={`flex items-center gap-2 ${isThisDownloading ? 'text-orange-500' : 'text-primary-600 hover:text-primary-900'} disabled:opacity-50`}
                                            >
                                                {isThisDownloading ? (
                                                    <>
                                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Fetching Data...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                        </svg>
                                                        Download Attachment
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            }) : (
                            <tr><td colSpan={4} className="text-center py-12 text-gray-500 dark:text-gray-400 italic">No assignments have been submitted yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AssignmentManagement;