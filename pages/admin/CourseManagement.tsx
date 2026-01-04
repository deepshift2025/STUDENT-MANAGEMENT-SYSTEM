import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { CourseUnit } from '../../types';
import CourseForm from './CourseForm';

const CourseManagement: React.FC = () => {
    const { courses, addCourse, updateCourse, deleteCourse } = useData();
    const [showForm, setShowForm] = useState(false);
    const [editingCourse, setEditingCourse] = useState<CourseUnit | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (courseData: Omit<CourseUnit, 'id'> | CourseUnit) => {
        setIsSaving(true);
        if ('id' in courseData) {
            await updateCourse(courseData);
        } else {
            await addCourse(courseData);
        }
        setIsSaving(false);
        setShowForm(false);
        setEditingCourse(null);
    };

    const handleEdit = (course: CourseUnit) => {
        setEditingCourse(course);
        setShowForm(true);
    };

    const handleDelete = async (courseId: string) => {
        if (window.confirm('Are you sure you want to delete this course and all related enrollments and marks?')) {
            await deleteCourse(courseId);
        }
    };
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">All Course Units</h3>
                <button onClick={() => { setEditingCourse(null); setShowForm(true); }} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                    Add New Course
                </button>
            </div>
            
            {showForm && <CourseForm course={editingCourse} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingCourse(null); }} isSaving={isSaving} />}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Semester</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Year</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {courses.length > 0 ? courses.map(course => (
                            <tr key={course.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{course.courseCode}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{course.courseName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{course.semester}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{course.academicYear}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button onClick={() => handleEdit(course)} className="text-primary-600 hover:text-primary-900">Edit</button>
                                    <button onClick={() => handleDelete(course.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                </td>
                            </tr>
                        )) : (
                           <tr><td colSpan={5} className="text-center py-4 text-gray-500 dark:text-gray-400">No courses available.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CourseManagement;
