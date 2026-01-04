import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';

interface BulkIntakeModalProps {
  selectedStudentIds: string[];
  onClose: () => void;
}

const BulkIntakeModal: React.FC<BulkIntakeModalProps> = ({ selectedStudentIds, onClose }) => {
  const { intakes, bulkUpdateStudentIntake } = useData();
  const [selectedIntakeId, setSelectedIntakeId] = useState<string>('REMOVE');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpdate = async () => {
    setIsProcessing(true);
    try {
      const intakeToApply = selectedIntakeId === 'REMOVE' ? null : selectedIntakeId;
      await bulkUpdateStudentIntake(selectedStudentIds, intakeToApply);
      alert(`${selectedStudentIds.length} students updated successfully.`);
      onClose();
    } catch (error) {
      alert('An error occurred during the update process.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Bulk Intake Assignment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-3xl leading-none">&times;</button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You are about to update <span className="font-bold text-primary-600">{selectedStudentIds.length}</span> selected student(s).
          </p>

          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-1">Select Action / Intake</label>
            <select
              value={selectedIntakeId}
              onChange={e => setSelectedIntakeId(e.target.value)}
              className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
            >
              <option value="REMOVE">-- Remove from Intake Group --</option>
              {intakes.map(intake => (
                <option key={intake.id} value={intake.id}>{intake.name} ({intake.academicYear})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={isProcessing}
            className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-md"
          >
            {isProcessing ? 'Updating...' : 'Apply Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkIntakeModal;