import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { COURSE_OPTIONS, SESSION_OPTIONS } from '../../constants';
import { GroupRole, User } from '../../types';

interface BulkEnrollmentModalProps {
  onClose: () => void;
}

type BulkStudentData = Omit<User, 'id' | 'passwordHash' | 'role'> & {
  password: string;
  enrollCourseCodes: string[];
};

interface ValidationResult {
  validRecords: BulkStudentData[];
  errors: string[];
}

const GROUP_ROLE_OPTIONS: GroupRole[] = ['Group Member Only', 'Group Leader'];

const BulkEnrollmentModal: React.FC<BulkEnrollmentModalProps> = ({ onClose }) => {
  const { users, courses, bulkRegisterAndEnrollStudents } = useData();
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const coursesByCode = useMemo(() => new Map(courses.map(c => [c.courseCode, c])), [courses]);

  const handleDownloadTemplate = () => {
    const headers = 'fullName,registrationNumber,email,password,course,session,yearOfStudy,semester,telephone,groupRole,enrollCourseCodes';
    const exampleRow = 'John Doe,2024-01-98765,john.doe@example.com,password123,BIT,DAY,1,1,1234567890,"Group Member Only","COS2102,DCS1203"';
    const csvContent = [headers, exampleRow].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'student_enrollment_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setValidationResult(null);
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (fileToProcess: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = parseAndValidateCSV(text);
      setValidationResult(result);
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setValidationResult({ validRecords: [], errors: ['Error reading file.'] });
      setIsProcessing(false);
    };
    reader.readAsText(fileToProcess);
  };

  const parseAndValidateCSV = (csvText: string): ValidationResult => {
    const validRecords: BulkStudentData[] = [];
    const errors: string[] = [];

    const existingRegNums = new Set(users.map(u => u.registrationNumber.toLowerCase()));
    const existingEmails = new Set(users.map(u => u.email.toLowerCase()));
    const csvRegNums = new Set<string>();
    const csvEmails = new Set<string>();

    const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return { validRecords, errors: ['CSV file is empty or has no data rows.'] };
    
    const headers = lines[0].split(',').map(h => h.trim());
    const requiredHeaders = ['fullName', 'registrationNumber', 'email', 'password', 'enrollCourseCodes'];
    const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh));
    if (missingHeaders.length > 0) return { validRecords, errors: [`Missing required columns: ${missingHeaders.join(', ')}`] };

    for (let i = 1; i < lines.length; i++) {
        const data = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(d => d.replace(/^"|"$/g, '').trim());
        const row: { [key: string]: string } = {};
        headers.forEach((header, index) => { row[header] = data[index] || ''; });

        const rowNum = i + 1;
        let rowHasError = false;

        const checkRequired = (field: string) => {
            if (!row[field]) {
                errors.push(`Row ${rowNum}: Missing required field '${field}'.`);
                rowHasError = true;
            }
        };

        requiredHeaders.forEach(checkRequired);
        if (rowHasError) continue;

        const regNum = row.registrationNumber.toLowerCase();
        if (existingRegNums.has(regNum) || csvRegNums.has(regNum)) {
            errors.push(`Row ${rowNum}: Registration number '${row.registrationNumber}' already exists.`);
            rowHasError = true;
        }
        
        const email = row.email.toLowerCase();
        if (existingEmails.has(email) || csvEmails.has(email)) {
            errors.push(`Row ${rowNum}: Email '${row.email}' already exists.`);
            rowHasError = true;
        }

        if (row.course && !COURSE_OPTIONS.includes(row.course)) {
            errors.push(`Row ${rowNum}: Invalid course '${row.course}'.`);
            rowHasError = true;
        }

        if (row.session && !SESSION_OPTIONS.includes(row.session)) {
            errors.push(`Row ${rowNum}: Invalid session '${row.session}'.`);
            rowHasError = true;
        }

        if (row.groupRole && !GROUP_ROLE_OPTIONS.includes(row.groupRole as GroupRole)) {
            errors.push(`Row ${rowNum}: Invalid groupRole '${row.groupRole}'.`);
            rowHasError = true;
        }

        const courseCodesToEnroll = row.enrollCourseCodes ? row.enrollCourseCodes.split(',').map(c => c.trim()).filter(Boolean) : [];
        for (const code of courseCodesToEnroll) {
            if (!coursesByCode.has(code)) {
                errors.push(`Row ${rowNum}: Course code '${code}' in 'enrollCourseCodes' not found.`);
                rowHasError = true;
            }
        }
        
        if (rowHasError) continue;
        
        csvRegNums.add(regNum);
        csvEmails.add(email);
        validRecords.push({
            fullName: row.fullName,
            registrationNumber: row.registrationNumber,
            email: row.email,
            password: row.password,
            course: row.course,
            session: row.session,
            yearOfStudy: row.yearOfStudy,
            semester: row.semester,
            telephone: row.telephone,
            groupRole: (row.groupRole as GroupRole) || 'Group Member Only',
            enrollCourseCodes: courseCodesToEnroll,
        });
    }
    return { validRecords, errors };
  };

  const handleUpload = async () => {
      if (!validationResult || validationResult.validRecords.length === 0) return;
      setIsProcessing(true);
      try {
          const { successCount, errors } = await bulkRegisterAndEnrollStudents(validationResult.validRecords);
          let message = `${successCount} students enrolled successfully!`;
          if (errors.length > 0) {
              message += `\n\nHowever, some errors occurred:\n${errors.join('\n')}`;
          }
          alert(message);
          if (successCount > 0) {
              onClose();
          }
      } catch (error) {
          alert('An unexpected error occurred during the upload process.');
      } finally {
          setIsProcessing(false);
      }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">Bulk Enroll New Students</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl leading-none">&times;</button>
        </div>

        <div className="overflow-y-auto flex-grow pr-2">
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Step 1: Get the Template</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Download the CSV template. The `enrollCourseCodes` column is required and should contain a comma-separated list of valid course codes (e.g., "COS2102,DCS1203").</p>
                <button onClick={handleDownloadTemplate} className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
                    Download Template
                </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Step 2: Upload the Completed File</h3>
                <input type="file" accept=".csv" onChange={handleFileChange} className="mt-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"/>
            </div>

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
            {isProcessing ? 'Processing...' : `Enroll ${validationResult?.validRecords.length || 0} Students`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkEnrollmentModal;