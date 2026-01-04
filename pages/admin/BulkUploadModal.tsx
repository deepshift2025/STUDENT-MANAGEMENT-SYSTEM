import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { Role, Mark } from '../../types';
import { validateMarks } from '../../utils/gradeCalculator';

interface BulkUploadModalProps {
  courseId: string;
  onClose: () => void;
}

interface ValidationResult {
  validRecords: Array<Omit<Mark, 'id'>>;
  errors: string[];
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ courseId, onClose }) => {
  const { courses, users, enrollments, bulkUpdateMarks } = useData();
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const enrolledStudentsMap = useMemo(() => {
    const map = new Map<string, { enrollmentId: string; fullName: string }>();
    if (!courseId) return map;

    const students = users.filter(u => u.role === Role.STUDENT);
    enrollments
      .filter(e => e.courseId === courseId)
      .forEach(e => {
        const student = students.find(s => s.id === e.studentId);
        if (student) {
          map.set(student.registrationNumber.toLowerCase(), {
            enrollmentId: e.id,
            fullName: student.fullName,
          });
        }
      });
    return map;
  }, [courseId, users, enrollments]);

  const course = useMemo(() => courses.find(c => c.id === courseId), [courses, courseId]);

  const handleDownloadTemplate = () => {
    if (!course) return;

    const headers = 'registrationNumber,fullName,cats,coursework,finalExam';
    const rows = Array.from(enrolledStudentsMap.entries()).map(([regNum, data]) => {
      return `${regNum},"${data.fullName.replace(/"/g, '""')}",,,`;
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${course.courseCode}_marks_template.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setValidationResult(null); // Reset validation on new file
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (fileToProcess: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { validRecords, errors } = parseAndValidateCSV(text);
      setValidationResult({ validRecords, errors });
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setValidationResult({ validRecords: [], errors: ['Error reading file.'] });
      setIsProcessing(false);
    };
    reader.readAsText(fileToProcess);
  };
  
  const parseAndValidateCSV = (csvText: string): ValidationResult => {
      const validRecords: Array<Omit<Mark, 'id'>> = [];
      const errors: string[] = [];
      const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) {
          return { validRecords, errors: ['CSV file is empty or has no data rows.'] };
      }
      
      const headers = lines[0].split(',').map(h => h.trim());
      const requiredHeaders = ['registrationNumber', 'cats', 'coursework', 'finalExam'];
      const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh));

      if (missingHeaders.length > 0) {
          return { validRecords, errors: [`Missing required columns: ${missingHeaders.join(', ')}`] };
      }

      for (let i = 1; i < lines.length; i++) {
          const data = lines[i].split(',');
          const row: { [key: string]: string } = {};
          headers.forEach((header, index) => {
              row[header] = data[index]?.trim() || '';
          });

          const regNum = row.registrationNumber?.toLowerCase();
          if (!regNum) {
              errors.push(`Row ${i + 1}: Missing registrationNumber.`);
              continue;
          }
          
          const studentInfo = enrolledStudentsMap.get(regNum);
          if (!studentInfo) {
              errors.push(`Row ${i + 1}: Student with registration number '${row.registrationNumber}' is not enrolled in this course.`);
              continue;
          }

          const cats = parseInt(row.cats, 10);
          const coursework = parseInt(row.coursework, 10);
          const finalExam = parseInt(row.finalExam, 10);
          
          if (isNaN(cats) || isNaN(coursework) || isNaN(finalExam)) {
              errors.push(`Row ${i + 1}: Marks for '${row.registrationNumber}' must be numbers.`);
              continue;
          }

          const validationError = validateMarks({ cats, coursework, finalExam });
          if (validationError) {
              errors.push(`Row ${i + 1} ('${row.registrationNumber}'): ${validationError}`);
              continue;
          }

          validRecords.push({
              enrollmentId: studentInfo.enrollmentId,
              cats,
              coursework,
              finalExam,
          });
      }
      return { validRecords, errors };
  };

  const handleUpload = async () => {
      if (!validationResult || validationResult.validRecords.length === 0) return;
      setIsProcessing(true);
      try {
          await bulkUpdateMarks(validationResult.validRecords);
          alert(`${validationResult.validRecords.length} mark records updated successfully!`);
          onClose();
      } catch (error) {
          alert('An error occurred during the update.');
      } finally {
          setIsProcessing(false);
      }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">Bulk Upload Marks</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl leading-none">&times;</button>
        </div>

        <div className="overflow-y-auto flex-grow pr-2">
            {/* Step 1: Download Template */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Step 1: Get the Template</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Download the CSV template for this course. It includes all enrolled students. Fill in the `cats`, `coursework`, and `finalExam` columns.</p>
                <button onClick={handleDownloadTemplate} className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
                    Download Template
                </button>
            </div>

            {/* Step 2: Upload File */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Step 2: Upload the Completed File</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Select the CSV file you filled out. The system will validate it before saving.</p>
                <input type="file" accept=".csv" onChange={handleFileChange} className="mt-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"/>
            </div>

            {/* Step 3: Review and Confirm */}
            {(isProcessing || validationResult) && (
                 <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Step 3: Review and Confirm</h3>
                    {isProcessing ? (
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Processing file...</p>
                    ) : (
                        validationResult && (
                            <div className="mt-2">
                                <p className="font-semibold text-green-600">{validationResult.validRecords.length} valid records found.</p>
                                {validationResult.errors.length > 0 && (
                                    <div className="mt-4">
                                        <p className="font-semibold text-red-600">{validationResult.errors.length} errors found:</p>
                                        <ul className="list-disc list-inside mt-2 text-sm text-red-500 max-h-40 overflow-y-auto bg-red-50 dark:bg-gray-800 p-2 rounded-md">
                                            {validationResult.errors.map((error, i) => <li key={i}>{error}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>
            )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isProcessing || !validationResult || validationResult.validRecords.length === 0}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : `Upload ${validationResult?.validRecords.length || 0} Records`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
