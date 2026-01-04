import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Intake } from '../../types';

const IntakeManagement: React.FC = () => {
    const { intakes, addIntake, updateIntake, deleteIntake } = useData();
    const [showForm, setShowForm] = useState(false);
    const [editingIntake, setEditingIntake] = useState<Intake | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        academicYear: '',
        status: 'active' as const,
    });

    const handleEdit = (intake: Intake) => {
        setEditingIntake(intake);
        setFormData({
            name: intake.name,
            description: intake.description,
            academicYear: intake.academicYear,
            status: intake.status,
        });
        setShowForm(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        if (editingIntake) {
            await updateIntake({ ...formData, id: editingIntake.id });
        } else {
            await addIntake(formData);
        }
        setIsSaving(false);
        setShowForm(false);
        setEditingIntake(null);
        setFormData({ name: '', description: '', academicYear: '', status: 'active' });
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this intake group? Related students will no longer be associated with it.')) {
            await deleteIntake(id);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Intake Groups</h3>
                <button 
                    onClick={() => { setEditingIntake(null); setShowForm(true); }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-all shadow-md font-bold text-sm"
                >
                    + Create Intake Group
                </button>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-6">{editingIntake ? 'Edit Intake' : 'New Intake Group'}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Intake Name</label>
                                <input 
                                    type="text" required placeholder="e.g. January 2026 Intake"
                                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Academic Year</label>
                                <input 
                                    type="text" required placeholder="e.g. 2025/2026"
                                    value={formData.academicYear} onChange={e => setFormData({...formData, academicYear: e.target.value})}
                                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea 
                                    placeholder="Brief details about this intake..."
                                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                <select 
                                    value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}
                                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="active">Active</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-6">
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-bold">Cancel</button>
                                <button type="submit" disabled={isSaving} className="px-6 py-2 bg-primary-600 text-white rounded font-bold disabled:opacity-50">
                                    {isSaving ? 'Saving...' : 'Save Intake'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Intake Name</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Academic Year</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {intakes.length > 0 ? intakes.map(intake => (
                            <tr key={intake.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {intake.name}
                                    <div className="text-xs font-normal text-gray-500 mt-1">{intake.description}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{intake.academicYear}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${intake.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {intake.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                    <button onClick={() => handleEdit(intake)} className="text-primary-600 hover:text-primary-900">Edit</button>
                                    <button onClick={() => handleDelete(intake.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                </td>
                            </tr>
                        )) : (
                           <tr><td colSpan={4} className="text-center py-12 text-gray-500 dark:text-gray-400 italic">No intake groups defined yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default IntakeManagement;