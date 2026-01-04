import React, { useState } from 'react';
import { CourseUnit } from '../../types';

interface CourseFormProps {
    course?: CourseUnit | null;
    onSave: (course: Omit<CourseUnit, 'id'> | CourseUnit) => void;
    onCancel: () => void;
    isSaving: boolean;
}

const CourseForm: React.FC<CourseFormProps> = ({ course, onSave, onCancel, isSaving }) => {
    const [formData, setFormData] = useState({
        courseCode: course?.courseCode || '',
        courseName: course?.courseName || '',
        creditHours: course?.creditHours || 3,
        semester: course?.semester || '',
        academicYear: course?.academicYear || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(course ? { ...formData, id: course.id } : formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">{course ? 'Edit Course' : 'Add New Course'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input name="courseCode" value={formData.courseCode} onChange={handleChange} placeholder="Course Code (e.g., CS101)" required className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    <input name="courseName" value={formData.courseName} onChange={handleChange} placeholder="Course Name" required className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    <input name="creditHours" type="number" value={formData.creditHours} onChange={handleChange} placeholder="Credit Hours" className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    <input name="semester" value={formData.semester} onChange={handleChange} placeholder="Semester (e.g., Fall)" required className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    <input name="academicYear" value={formData.academicYear} onChange={handleChange} placeholder="Academic Year (e.g., 2024)" required className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md text-gray-600 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400">
                            {isSaving ? 'Saving...' : 'Save Course'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CourseForm;
