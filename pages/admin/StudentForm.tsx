import React, { useState, useEffect } from 'react';
import { User, GroupRole } from '../../types';
import { useData } from '../../contexts/DataContext';
import { COURSE_OPTIONS, SESSION_OPTIONS } from '../../constants';

const GROUP_ROLE_OPTIONS: GroupRole[] = ['Group Member Only', 'Group Leader'];

interface StudentFormProps {
    student: User | null;
    onSave: (studentData: any, enrolledCourseIds: string[]) => void;
    onCancel: () => void;
}

const StudentForm: React.FC<StudentFormProps> = ({ student, onSave, onCancel }) => {
    const { courses, enrollments, intakes } = useData();
    const [formData, setFormData] = useState({
        fullName: '',
        registrationNumber: '',
        course: COURSE_OPTIONS[0],
        session: SESSION_OPTIONS[0],
        yearOfStudy: '',
        semester: '',
        telephone: '',
        email: '',
        password: '',
        confirmPassword: '',
        groupRole: GROUP_ROLE_OPTIONS[0],
        intakeId: '',
    });
    const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
    const [error, setError] = useState('');
    
    const isEditing = !!student;

    useEffect(() => {
        if (isEditing) {
            setFormData({
                fullName: student.fullName || '',
                registrationNumber: student.registrationNumber || '',
                course: student.course || COURSE_OPTIONS[0],
                session: student.session || SESSION_OPTIONS[0],
                yearOfStudy: student.yearOfStudy || '',
                semester: student.semester || '',
                telephone: student.telephone || '',
                email: student.email || '',
                password: '',
                confirmPassword: '',
                groupRole: student.groupRole || GROUP_ROLE_OPTIONS[0],
                intakeId: student.intakeId || '',
            });
            const currentEnrollments = enrollments.filter(e => e.studentId === student.id).map(e => e.courseId);
            setEnrolledCourseIds(currentEnrollments);
        }
    }, [student, isEditing, enrollments]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleCourseSelection = (courseId: string) => {
        setEnrolledCourseIds(prev => 
            prev.includes(courseId) 
            ? prev.filter(id => id !== courseId)
            : [...prev, courseId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isEditing) {
            const { password, confirmPassword, ...dataToSave } = formData;
            onSave({ ...dataToSave, id: student.id }, enrolledCourseIds);
        } else {
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match.');
                return;
            }
            if (!formData.password) {
                setError('Password is required for new students.');
                return;
            }
            onSave(formData, enrolledCourseIds);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">{isEditing ? 'Edit Student' : 'Add New Student'}</h2>
                <form id="student-form" onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 flex-grow">
                    <input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Full Name" required className="input-field" />
                    <input name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} placeholder="Registration Number" required disabled={isEditing} className={`input-field ${isEditing ? 'bg-gray-200 dark:bg-gray-600' : ''}`} />
                    <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" required className="input-field" />
                    <input name="telephone" type="tel" value={formData.telephone} onChange={handleChange} placeholder="Telephone" required className="input-field" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select name="course" value={formData.course} onChange={handleChange} required className="input-field">
                          {COURSE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <select name="session" value={formData.session} onChange={handleChange} required className="input-field">
                          {SESSION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <input name="yearOfStudy" type="number" value={formData.yearOfStudy} onChange={handleChange} placeholder="Year of Study" required className="input-field" />
                        <input name="semester" type="number" value={formData.semester} onChange={handleChange} placeholder="Semester" required className="input-field" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Intake Group</label>
                      <select name="intakeId" value={formData.intakeId} onChange={handleChange} className="input-field">
                        <option value="">-- Choose Intake Group --</option>
                        {intakes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                    </div>

                    <select name="groupRole" value={formData.groupRole} onChange={handleChange} required className="input-field">
                        {GROUP_ROLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>

                    {!isEditing && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Password" required className="input-field" />
                            <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password" required className="input-field" />
                        </div>
                    )}
                    
                    <div className="border border-gray-300 dark:border-gray-600 rounded-md p-4">
                        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Course Enrollments</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {courses.map(course => (
                                <label key={course.id} className="flex items-center space-x-3 cursor-pointer p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={enrolledCourseIds.includes(course.id)}
                                        onChange={() => handleCourseSelection(course.id)}
                                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {course.courseCode} - {course.courseName}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                    
                    {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}
                </form>
                 <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                    <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md text-gray-600 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200">Cancel</button>
                    <button type="submit" form="student-form" className="px-6 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700 font-bold">Save Student</button>
                </div>
            </div>
             <style>{`.input-field { appearance: none; border-radius: 0.375rem; position: relative; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; placeholder-color: #6b7280; color: #111827; background-color: #ffffff; } .dark .input-field { border-color: #4b5563; color: #f9fafb; background-color: #374151; } .input-field:focus { outline: none; --tw-ring-color: #3b82f6; border-color: #3b82f6; z-index: 10; font-size: 0.875rem; }`}</style>
        </div>
    );
};

export default StudentForm;