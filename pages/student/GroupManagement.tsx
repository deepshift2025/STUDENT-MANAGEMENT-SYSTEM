
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { GroupProfile, GroupMember, User, Role } from '../../types';
import { COURSE_OPTIONS } from '../../constants';
import { api } from '../../utils/api';

const b64toBlob = (b64Data: string, contentType = '', sliceSize = 512): Blob => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
};


const GroupManagement: React.FC = () => {
    const { currentUser, groupProfiles: allGroupProfiles, updateGroupProfile, users } = useData();
    
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState<Omit<GroupProfile, 'leaderId'>>({
        groupName: '',
        projectBrief: '',
        members: [],
        assignment: undefined,
    });
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [profileExists, setProfileExists] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        course: '',
        yearOfStudy: '',
        semester: '',
    });
    const [manualMember, setManualMember] = useState({ fullName: '', registrationNumber: '' });
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    
    useEffect(() => {
        const loadProfile = async () => {
            if (currentUser) {
                setIsLoadingProfile(true);
                const fullProfile = await api.fetchGroupProfile(currentUser.id);
                if (fullProfile) {
                    setProfile({ ...fullProfile, members: fullProfile.members || [] });
                    setProfileExists(true);
                } else {
                    setProfile({
                        groupName: '',
                        projectBrief: '',
                        members: [],
                        assignment: undefined,
                    });
                    setProfileExists(false);
                }
                setIsLoadingProfile(false);
            }
        };
        loadProfile();
    }, [currentUser]);

    const allMembersForDisplay = useMemo(() => {
        if (!currentUser) return [];
        const leaderMember: GroupMember = {
            id: currentUser.id,
            fullName: currentUser.fullName,
            registrationNumber: currentUser.registrationNumber,
        };
        // Ensure no duplicates if for some reason the leader is in the members array
        const otherMembers = profile.members.filter(m => m.id !== currentUser.id);
        return [leaderMember, ...otherMembers];
    }, [currentUser, profile.members]);
    
    const availableStudents = useMemo(() => {
        const takenRegistrationNumbers = new Set<string>();

        allGroupProfiles.forEach(p => {
            const leader = users.find(u => u.id === p.leaderId);
            if (leader) {
                takenRegistrationNumbers.add(leader.registrationNumber);
            }
            p.members.forEach(m => {
                takenRegistrationNumbers.add(m.registrationNumber);
            });
        });

        if(currentUser) {
            takenRegistrationNumbers.add(currentUser.registrationNumber);
        }

        return users.filter(user => 
            user.role === Role.STUDENT && 
            !takenRegistrationNumbers.has(user.registrationNumber)
        );
    }, [users, allGroupProfiles, currentUser]);

    const searchResults = useMemo(() => {
        if (!searchQuery.trim() && !filters.course && !filters.yearOfStudy.trim() && !filters.semester.trim()) {
            return [];
        }

        return availableStudents.filter(student => {
            if (profile.members.some(m => m.registrationNumber === student.registrationNumber)) {
                return false;
            }

            const matchesCourse = !filters.course || student.course === filters.course;
            const matchesYear = !filters.yearOfStudy.trim() || student.yearOfStudy === filters.yearOfStudy.trim();
            const matchesSemester = !filters.semester.trim() || student.semester === filters.semester.trim();

            if (!(matchesCourse && matchesYear && matchesSemester)) {
                return false;
            }

            const lowercasedQuery = searchQuery.toLowerCase().trim();
            if (!lowercasedQuery) return true;

            return (
                student.fullName.toLowerCase().includes(lowercasedQuery) ||
                student.registrationNumber.toLowerCase().includes(lowercasedQuery)
            );
        });
    }, [searchQuery, availableStudents, profile.members, filters]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                if (base64String) {
                    setProfile(prev => ({
                        ...prev,
                        assignment: { name: file.name, type: file.type, data: base64String }
                    }));
                }
            };
            reader.readAsDataURL(file);
        } else {
             setProfile(prev => ({ ...prev, assignment: undefined }));
        }
    };

    const handleAddMember = (student: User) => {
        const memberToAdd: GroupMember = {
            id: student.id,
            fullName: student.fullName,
            registrationNumber: student.registrationNumber
        };
        
        setProfile(prev => ({
            ...prev,
            members: [...(prev.members || []), memberToAdd]
        }));
        setSearchQuery('');
    };
    
    const handleRemoveMember = (memberId: string) => {
        setProfile(prev => ({
            ...prev,
            members: (prev.members || []).filter(member => member.id !== memberId)
        }));
    };
    
    const handleManualAddMember = () => {
        const { fullName, registrationNumber } = manualMember;
        if (!fullName.trim() || !registrationNumber.trim()) {
            alert('Please provide both a full name and a registration number.');
            return;
        }
    
        if (allMembersForDisplay.some(m => m.registrationNumber.toLowerCase() === registrationNumber.trim().toLowerCase())) {
            alert('This registration number is already in the group.');
            return;
        }
    
        const newMember: GroupMember = {
            id: `manual-${Date.now()}`,
            fullName: fullName.trim(),
            registrationNumber: registrationNumber.trim()
        };
    
        setProfile(prev => ({
            ...prev,
            members: [...(prev.members || []), newMember]
        }));
    
        setManualMember({ fullName: '', registrationNumber: '' });
    };

    const handleCancel = async () => {
        if (profileExists && currentUser) {
            const originalProfile = await api.fetchGroupProfile(currentUser.id);
            if (originalProfile) {
                setProfile(originalProfile);
            }
        }
        setIsEditing(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!profile.groupName.trim() || !profile.projectBrief.trim()) {
            setStatusMessage('Error: Group Name and Project Brief are required.');
            return;
        }
    
        setLoading(true);
        setStatusMessage('');
        try {
            // First, save the profile data locally
            await updateGroupProfile(profile);
            setProfileExists(true); // Profile now exists after saving
    
            // Then, if there's an assignment, send it to the webhook
            if (profile.assignment) {
                const formData = new FormData();
                formData.append('groupName', profile.groupName);
                formData.append('projectDescription', profile.projectBrief);
                
                const memberList = allMembersForDisplay.map(m => `${m.fullName} (${m.registrationNumber})`).join('\n');
                formData.append('groupMembers', memberList);
                
                formData.append('dateOfSubmission', new Date().toISOString());
                
                // Convert base64 back to a blob to send as a binary file
                const assignmentBlob = b64toBlob(profile.assignment.data, profile.assignment.type);
                formData.append('file', assignmentBlob, profile.assignment.name);
    
                // Fire-and-forget webhook call
                fetch('https://n8n.srv843328.hstgr.cloud/webhook/document-upload', {
                    method: 'POST',
                    body: formData,
                    mode: 'no-cors'
                }).catch(console.error);
                
                setStatusMessage('Profile saved and assignment submitted successfully!');
            } else {
                setStatusMessage('Profile saved successfully!');
            }
            setIsEditing(false);
    
        } catch (error) {
            console.error("Failed to save profile or submit assignment:", error);
            setStatusMessage('Error: An error occurred while saving the profile.');
        } finally {
            setLoading(false);
            setTimeout(() => setStatusMessage(''), 5000);
        }
    };
    
    const renderEditMode = () => (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                    {profileExists ? 'Edit Group Profile' : 'Create Group Profile'}
                </h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Group Name</label>
                        <input type="text" name="groupName" id="groupName" value={profile.groupName} onChange={handleProfileChange} required className="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label htmlFor="projectBrief" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Brief about Projects/Assignments</label>
                        <textarea name="projectBrief" id="projectBrief" rows={4} value={profile.projectBrief} onChange={handleProfileChange} required className="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"></textarea>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Manage Group Members</h3>
                <div className="space-y-4">
                     <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {allMembersForDisplay.map((member, index) => (
                            <li key={member.id} className="py-3 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {member.fullName}
                                        {index === 0 && <span className="ml-2 text-xs font-normal text-primary-500">(Leader)</span>}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.registrationNumber}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveMember(member.id)}
                                    className="text-red-500 hover:text-red-700 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                                    disabled={index === 0}
                                    title={index === 0 ? "Group leader cannot be removed." : "Remove member"}
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                     <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <label htmlFor="memberSearch" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Add New Member via Search
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Search for a registered student who is not already in a group.</p>
                        
                        <div className="p-3 border rounded-md bg-gray-50 dark:bg-gray-700/50 mb-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="filter-course" className="block text-xs font-medium text-gray-500 dark:text-gray-400">Course</label>
                                    <select id="filter-course" name="course" value={filters.course} onChange={handleFilterChange} className="mt-1 block w-full px-3 py-1.5 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-primary-500 focus:border-primary-500">
                                        <option value="">All</option>
                                        {COURSE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="filter-year" className="block text-xs font-medium text-gray-500 dark:text-gray-400">Year</label>
                                    <input type="number" id="filter-year" name="yearOfStudy" value={filters.yearOfStudy} onChange={handleFilterChange} placeholder="Any" className="mt-1 block w-full px-3 py-1.5 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-primary-500 focus:border-primary-500" />
                                </div>
                                <div>
                                    <label htmlFor="filter-semester" className="block text-xs font-medium text-gray-500 dark:text-gray-400">Semester</label>
                                    <input type="number" id="filter-semester" name="semester" value={filters.semester} onChange={handleFilterChange} placeholder="Any" className="mt-1 block w-full px-3 py-1.5 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-primary-500 focus:border-primary-500" />
                                </div>
                            </div>
                        </div>
                        
                        <input
                            type="text"
                            id="memberSearch"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search by name or registration number..."
                            className="block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        />

                        { (searchQuery || filters.course || filters.yearOfStudy || filters.semester) && (
                            <div className="mt-2 border border-gray-200 dark:border-gray-600 rounded-md max-h-40 overflow-y-auto">
                                {searchResults.length > 0 ? (
                                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {searchResults.map(student => (
                                            <li key={student.id} className="p-3 flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{student.fullName}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{student.registrationNumber}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddMember(student)}
                                                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                                                >
                                                    Add
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                                        No available students found matching your criteria.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                     <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
                            Or, Add Member Manually
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            If you cannot find a student in the search, you can add their details here.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 items-center">
                            <input
                                type="text"
                                placeholder="Member's Full Name"
                                value={manualMember.fullName}
                                onChange={(e) => setManualMember(prev => ({ ...prev, fullName: e.target.value }))}
                                className="block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            />
                            <input
                                type="text"
                                placeholder="Member's Registration Number"
                                value={manualMember.registrationNumber}
                                onChange={(e) => setManualMember(prev => ({ ...prev, registrationNumber: e.target.value }))}
                                className="block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            />
                            <button
                                type="button"
                                onClick={handleManualAddMember}
                                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 whitespace-nowrap w-full sm:w-auto"
                            >
                                Add Member
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Upload Assignment</h3>
                 <input type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"/>
                 {profile.assignment && <p className="text-sm mt-2 text-green-600">File attached: {profile.assignment.name}</p>}
            </div>

            <div className="flex justify-end items-center gap-4">
                {statusMessage && <p className={`text-sm ${statusMessage.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>{statusMessage}</p>}
                <button type="button" onClick={handleCancel} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                    Cancel
                </button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-400">
                    {loading ? 'Saving...' : 'Save & Submit Profile'}
                </button>
            </div>
        </form>
    );

    const renderViewMode = () => (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Group Profile</h3>
                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                        Edit Profile
                    </button>
                </div>
                <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Group Name</h4>
                        <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{profile.groupName}</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Project Brief</h4>
                        <p className="mt-1 text-md text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{profile.projectBrief}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Group Members</h3>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {allMembersForDisplay.length > 0 ? (
                        allMembersForDisplay.map((member, index) => (
                            <li key={member.id} className="py-3">
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {member.fullName}
                                    {index === 0 && <span className="ml-2 text-xs font-normal text-primary-500">(Leader)</span>}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{member.registrationNumber}</p>
                            </li>
                        ))
                    ) : (
                        <li className="py-3 text-gray-500 dark:text-gray-400">No members have been added yet.</li>
                    )}
                </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Submitted Assignment</h3>
                {profile.assignment ? (
                    <p className="text-md text-green-600 dark:text-green-400">File attached: {profile.assignment.name}</p>
                ) : (
                    <p className="text-md text-gray-500 dark:text-gray-400">No assignment has been submitted.</p>
                )}
            </div>
        </div>
    );
    
    if (isLoadingProfile) {
        return (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
                <p>Loading your group profile...</p>
            </div>
        );
    }
    
    if (isEditing) {
        return renderEditMode();
    }

    if (!profileExists) {
        return (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Welcome, Group Leader!</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">You haven't created a group profile yet. Create one to manage your members and submit assignments.</p>
                <button onClick={() => setIsEditing(true)} className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700">
                    Create Group Profile
                </button>
            </div>
        );
    }
    
    return renderViewMode();
};

export default GroupManagement;