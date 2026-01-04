import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { User, Role } from '../../types';
import StudentForm from './StudentForm';
import BulkEnrollmentModal from './BulkEnrollmentModal';
import { COURSE_OPTIONS, SESSION_OPTIONS } from '../../constants';
import BulkUnenrollModal from './BulkUnenrollModal';
import BulkIntakeModal from './BulkIntakeModal';
import StudentDetailsModal from './StudentDetailsModal';

const StudentManagement: React.FC = () => {
    const { users, intakes, deleteStudent, registerStudent, updateStudentByAdmin, updateStudentEnrollments } = useData();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [viewingStudent, setViewingStudent] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isBulkEnrollOpen, setIsBulkEnrollOpen] = useState(false);
    const [isBulkUnenrollOpen, setIsBulkUnenrollOpen] = useState(false);
    const [isBulkIntakeOpen, setIsBulkIntakeOpen] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [filters, setFilters] = useState({
        course: '',
        session: '',
        yearOfStudy: '',
        semester: '',
        intakeId: '',
    });

    const students = useMemo(() => users.filter(u => u.role === Role.STUDENT), [users]);

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const lowercasedQuery = searchQuery.toLowerCase().trim();
            const matchesSearch = !lowercasedQuery ||
                student.fullName.toLowerCase().includes(lowercasedQuery) ||
                student.registrationNumber.toLowerCase().includes(lowercasedQuery);

            const matchesCourse = !filters.course || student.course === filters.course;
            const matchesSession = !filters.session || student.session === filters.session;
            const matchesYear = !filters.yearOfStudy.trim() || student.yearOfStudy === filters.yearOfStudy.trim();
            const matchesSemester = !filters.semester.trim() || student.semester === filters.semester.trim();
            const matchesIntake = !filters.intakeId || student.intakeId === filters.intakeId;

            return matchesSearch && matchesCourse && matchesSession && matchesYear && matchesSemester && matchesIntake;
        }).sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [students, searchQuery, filters]);

    const handleAddNew = () => {
        setSelectedStudent(null);
        setIsFormOpen(true);
    };

    const handleEdit = (student: User) => {
        setSelectedStudent(student);
        setIsFormOpen(true);
    };

    const handleDelete = async (studentId: string) => {
        if (window.confirm('Are you sure you want to delete this student and all their related data? This action cannot be undone.')) {
            await deleteStudent(studentId);
        }
    };
    
    const handleSaveStudent = async (studentData: any, enrolledCourseIds: string[]) => {
        if (selectedStudent) { // Editing existing student
            await updateStudentByAdmin(selectedStudent.id, studentData);
            await updateStudentEnrollments(selectedStudent.id, enrolledCourseIds);
        } else { // Adding new student
            const { confirmPassword, ...dataForRegistration } = studentData;
            const newUser = await registerStudent(dataForRegistration);
            if (newUser) {
                await updateStudentEnrollments(newUser.id, enrolledCourseIds);
            } else {
                alert("A student with this registration number or email already exists.");
                return; // Don't close the form on error
            }
        }
        setIsFormOpen(false);
        setSelectedStudent(null);
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearAdvancedFilters = () => {
        setFilters({
            course: '',
            session: '',
            yearOfStudy: '',
            semester: '',
            intakeId: '',
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedStudentIds(filteredStudents.map(s => s.id));
        } else {
            setSelectedStudentIds([]);
        }
    };

    const handleSelectOne = (studentId: string) => {
        setSelectedStudentIds(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex flex-wrap gap-2 justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Manage Students</h3>
                <div className="flex space-x-2">
                    <button onClick={handleAddNew} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-bold text-sm">
                        Add New Student
                    </button>
                    <button onClick={() => setIsBulkEnrollOpen(true)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-bold text-sm">
                        Bulk Enroll Students
                    </button>
                </div>
            </div>
            
            <div className="mb-4">
                {selectedStudentIds.length > 0 && (
                    <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-md flex items-center justify-between">
                        <span className="text-sm font-bold text-primary-800 dark:text-primary-200">
                            {selectedStudentIds.length} student(s) selected.
                        </span>
                        <div className="flex gap-2">
                           <button onClick={() => setIsBulkIntakeOpen(true)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-black uppercase tracking-wider rounded-md hover:bg-indigo-700">
                                Assign Intake
                           </button>
                           <button onClick={() => setIsBulkUnenrollOpen(true)} className="px-4 py-2 bg-red-600 text-white text-xs font-black uppercase tracking-wider rounded-md hover:bg-red-700">
                                Unenroll from Course
                           </button>
                        </div>
                    </div>
                )}
            </div>

             <div className="mb-4 space-y-4">
                <div className="flex flex-wrap gap-4 items-center">
                    <input
                        type="text"
                        placeholder="Search by name or registration number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full max-w-sm px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button 
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className="text-sm text-primary-600 dark:text-primary-400 font-bold hover:underline flex items-center gap-1"
                        aria-expanded={showAdvancedFilters}
                    >
                        {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
                
                {showAdvancedFilters && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                                <label htmlFor="course-filter" className="block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 mb-1">Course</label>
                                <select id="course-filter" name="course" value={filters.course} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-primary-500 focus:border-primary-500">
                                    <option value="">All Courses</option>
                                    {COURSE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <label htmlFor="session-filter" className="block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 mb-1">Session</label>
                                <select id="session-filter" name="session" value={filters.session} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-primary-500 focus:border-primary-500">
                                    <option value="">All Sessions</option>
                                    {SESSION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="intake-filter" className="block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 mb-1">S-Intake</label>
                                <select id="intake-filter" name="intakeId" value={filters.intakeId} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-primary-500 focus:border-primary-500">
                                    <option value="">All Intakes</option>
                                    {intakes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="year-filter" className="block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 mb-1">Year</label>
                                <input id="year-filter" name="yearOfStudy" type="text" value={filters.yearOfStudy} onChange={handleFilterChange} placeholder="e.g., 1" className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm"/>
                            </div>

                            <div>
                                <label htmlFor="semester-filter" className="block text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 mb-1">Semester</label>
                                <input id="semester-filter" name="semester" type="text" value={filters.semester} onChange={handleFilterChange} placeholder="e.g., 2" className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm"/>
                            </div>
                        </div>
                        <div className="mt-4 text-right">
                             <button onClick={clearAdvancedFilters} className="px-4 py-1.5 bg-gray-200 text-gray-800 text-xs font-bold rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200">
                                Clear Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isFormOpen && (
                <StudentForm 
                    student={selectedStudent} 
                    onSave={handleSaveStudent} 
                    onCancel={() => { setIsFormOpen(false); setSelectedStudent(null); }} 
                />
            )}
            
            {isBulkEnrollOpen && (
                <BulkEnrollmentModal onClose={() => setIsBulkEnrollOpen(false)} />
            )}

            {isBulkUnenrollOpen && (
                <BulkUnenrollModal 
                    selectedStudentIds={selectedStudentIds}
                    onClose={() => {
                        setIsBulkUnenrollOpen(false);
                        setSelectedStudentIds([]);
                    }}
                />
            )}

            {isBulkIntakeOpen && (
                <BulkIntakeModal 
                    selectedStudentIds={selectedStudentIds}
                    onClose={() => {
                        setIsBulkIntakeOpen(false);
                        setSelectedStudentIds([]);
                    }}
                />
            )}

            {viewingStudent && (
                <StudentDetailsModal 
                    student={viewingStudent} 
                    onClose={() => setViewingStudent(null)} 
                />
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                             <th className="px-6 py-3 text-left">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                    checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                                    onChange={handleSelectAll}
                                    aria-label="Select all students"
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-400 dark:text-gray-300 uppercase tracking-wider">Student Info</th>
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-400 dark:text-gray-300 uppercase tracking-wider">Intake Group</th>
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-400 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-right text-xs font-black text-gray-400 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredStudents.length > 0 ? filteredStudents.map(student => {
                            const intake = intakes.find(i => i.id === student.intakeId);
                            return (
                            <tr key={student.id} className={selectedStudentIds.includes(student.id) ? 'bg-primary-50 dark:bg-primary-900/20 transition-colors' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors'}>
                                 <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                        checked={selectedStudentIds.includes(student.id)}
                                        onChange={() => handleSelectOne(student.id)}
                                        aria-label={`Select ${student.fullName}`}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{student.fullName}</p>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">{student.registrationNumber}</p>
                                </td>
                                <td className="px-6 py-4">
                                    {intake ? (
                                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase rounded border border-indigo-100 dark:border-indigo-800">
                                            {intake.name}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] italic text-gray-400">Unassigned</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-300">
                                    <div className="flex flex-col">
                                        <span>{student.email}</span>
                                        <span className="opacity-60">{student.telephone}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                    <button onClick={() => setViewingStudent(student)} className="text-green-600 hover:text-green-900 font-bold">View</button>
                                    <button onClick={() => handleEdit(student)} className="text-primary-600 hover:text-primary-900 font-bold">Edit</button>
                                    <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:text-red-900 font-bold">Delete</button>
                                </td>
                            </tr>
                            );
                        }) : (
                           <tr><td colSpan={5} className="text-center py-12 text-gray-500 dark:text-gray-400 italic">No students found matching current filters.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

             <div className="mt-4 flex justify-end">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    Showing <span className="text-gray-800 dark:text-gray-200">{filteredStudents.length}</span> / <span className="text-gray-800 dark:text-gray-200">{students.length}</span> students
                </p>
            </div>
        </div>
    );
};

export default StudentManagement;