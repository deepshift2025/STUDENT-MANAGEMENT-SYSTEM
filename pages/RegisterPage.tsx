import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { COURSE_OPTIONS, SESSION_OPTIONS } from '../constants';
import { GroupRole } from '../types';

const GROUP_ROLE_OPTIONS: GroupRole[] = ['Group Member Only', 'Group Leader'];

const RegisterPage: React.FC = () => {
  const { courses, intakes, registerStudent, enrollInCourse } = useData();
  const [step, setStep] = useState<'form' | 'preview'>('form');
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
    selectedCourseIds: [] as string[],
  });
  const [error, setError] = useState('');
  const [regNumError, setRegNumError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const activeIntakes = useMemo(() => intakes.filter(i => i.status === 'active'), [intakes]);

  const availableCourseUnits = useMemo(() => {
    if (!formData.course) return [];

    const selectedProgram = formData.course;
    
    if (['BCS', 'DCS'].includes(selectedProgram)) {
        return courses.filter(c => 
            c.courseName === 'SYSTEM ANALYSIS & DESIGN' || 
            c.courseName === 'PRINCIPLES OF ELECTRONICS'
        );
    }
    
    if (['BIT', 'DIT', 'BBC', 'BLIS', 'BCE'].includes(selectedProgram)) {
        return courses.filter(c => c.courseName === 'SYSTEM ANALYSIS & DESIGN');
    }

    if (selectedProgram === 'PDCS') {
        return courses.filter(c => c.courseName === 'OPERATING SYSTEMS');
    }

    return []; 
  }, [formData.course, courses]);

  const validateRegistrationNumber = (regNum: string) => {
    const regNumRegex = /^20\d{2}-\d{2}-\d{5}$/;
    if (regNum && !regNumRegex.test(regNum)) {
      setRegNumError('Format must be 20xx-xx-xxxxx');
      return false;
    }
    setRegNumError('');
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'registrationNumber') {
        validateRegistrationNumber(value);
    }

    if (name === 'course') {
        setFormData(prev => ({
            ...prev,
            course: value,
            selectedCourseIds: [], 
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCourseSelectionChange = (courseId: string) => {
    setFormData(prev => {
        const selected = new Set(prev.selectedCourseIds);
        if (selected.has(courseId)) {
            selected.delete(courseId);
        } else {
            selected.add(courseId);
        }
        return { ...prev, selectedCourseIds: Array.from(selected) };
    });
  };

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateRegistrationNumber(formData.registrationNumber)) {
        return;
    }

    const { selectedCourseIds, ...otherFields } = formData;
    for (const key in otherFields) {
      if (otherFields[key as keyof typeof otherFields] === '' && key !== 'intakeId') {
        setError('All fields except Intake (optional but recommended) are required.');
        return;
      }
    }

    if (formData.selectedCourseIds.length === 0) {
      setError('You must select at least one course to enroll in.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if(regNumError) {
        return;
    }

    setStep('preview');
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const { confirmPassword, selectedCourseIds, ...studentPayload } = formData;
      const newUser = await registerStudent(studentPayload);
      
      if (newUser) {
        const enrollmentPromises = selectedCourseIds.map(courseId => enrollInCourse(newUser.id, courseId));
        await Promise.all(enrollmentPromises);

        const webhookFormData = new URLSearchParams();
        const { password, ...webhookData } = studentPayload;

        for (const key in webhookData) {
            webhookFormData.append(key, webhookData[key as keyof typeof webhookData]);
        }
        
        const selectedCoursesText = selectedCourseIds.map(id => {
            const course = courses.find(c => c.id === id);
            return course ? `${course.courseCode} - ${course.courseName}` : 'Unknown Course';
        }).join('; ');
        webhookFormData.append('enrolledCourses', selectedCoursesText);

        fetch('https://n8n.srv843328.hstgr.cloud/webhook/student-register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: webhookFormData.toString(),
            mode: 'no-cors',
        }).catch(err => console.error("Webhook failed:", err)); 
        
        alert('You have successfully been registered! Please log in.');
        navigate('/login');
      } else {
        setError('Registration number already exists.');
        setStep('form');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => (
    <form className="mt-8 space-y-6" onSubmit={handlePreview}>
      <div className="rounded-md shadow-sm space-y-4">
        <input name="fullName" type="text" required value={formData.fullName} onChange={handleChange} className="input-field" placeholder="Full Name" />
        <div>
          <input 
            name="registrationNumber" 
            type="text" 
            required 
            value={formData.registrationNumber} 
            onChange={handleChange} 
            className={`input-field ${regNumError ? 'border-red-500 focus:border-red-500' : ''}`}
            placeholder="Registration Number (e.g., 2024-01-12345)" 
          />
          {regNumError && <p className="text-red-500 text-xs mt-1 px-1">{regNumError}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
            <select name="course" value={formData.course} onChange={handleChange} required className="input-field">
            {COURSE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <select name="session" value={formData.session} onChange={handleChange} required className="input-field">
            {SESSION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Intake</label>
          <select name="intakeId" value={formData.intakeId} onChange={handleChange} className="input-field">
            <option value="">-- Choose Intake Group --</option>
            {activeIntakes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="groupRole-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Role in Group
          </label>
          <select id="groupRole-select" name="groupRole" value={formData.groupRole} onChange={handleChange} required className="input-field">
              {GROUP_ROLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div className="flex space-x-4">
            <input name="yearOfStudy" type="number" required value={formData.yearOfStudy} onChange={handleChange} className="input-field w-1/2" placeholder="Year of Study" />
            <input name="semester" type="number" required value={formData.semester} onChange={handleChange} className="input-field w-1/2" placeholder="Semester" />
        </div>
        <input name="telephone" type="tel" required value={formData.telephone} onChange={handleChange} className="input-field" placeholder="Telephone" />
        <input name="email" type="email" required value={formData.email} onChange={handleChange} className="input-field" placeholder="Email Address" />
        
        <div className="border border-gray-300 dark:border-gray-600 rounded-md p-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Enroll in Courses</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">You must select at least one course.</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableCourseUnits.length > 0 ? (
                    availableCourseUnits.map(course => (
                        <label key={course.id} className="flex items-center space-x-3 cursor-pointer p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                            <input
                                type="checkbox"
                                checked={formData.selectedCourseIds.includes(course.id)}
                                onChange={() => handleCourseSelectionChange(course.id)}
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                {course.courseCode} - {course.courseName}
                            </span>
                        </label>
                    ))
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Select your main course program to see available units for enrollment.
                    </p>
                )}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="relative">
            <input name="password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={handleChange} className="input-field pr-10" placeholder="Password" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none">
                {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.303 6.546A10.048 10.048 0 00.458 10c1.274 4.057 5.022 7 9.542 7 1.655 0 3.213-.409 4.542-1.135z" />
                </svg>
                ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                )}
            </button>
            </div>
            <div className="relative">
            <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required value={formData.confirmPassword} onChange={handleChange} className="input-field pr-10" placeholder="Confirm Password" />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none">
                {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.303 6.546A10.048 10.048 0 00.458 10c1.274 4.057 5.022 7 9.542 7 1.655 0 3.213-.409 4.542-1.135z" />
                </svg>
                ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                )}
            </button>
            </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}

      <div>
        <button type="submit" className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none shadow-lg">
          Proceed to Preview
        </button>
      </div>
    </form>
  );

  const renderPreview = () => {
    const selectedCourses = formData.selectedCourseIds.map(id => courses.find(c => c.id === id)).filter((c): c is NonNullable<typeof c> => c !== undefined);
    const selectedIntake = intakes.find(i => i.id === formData.intakeId);

    return (
        <div className="mt-8">
            <h3 className="text-lg font-bold leading-6 text-gray-900 dark:text-white">Verify Registration Details</h3>
            <div className="mt-4 border-t border-gray-200 dark:border-gray-700">
                <dl className="sm:divide-y sm:divide-gray-200 dark:sm:divide-gray-700">
                    {Object.entries(formData).map(([key, value]) => {
                        if (key === 'password' || key === 'confirmPassword' || key === 'selectedCourseIds' || key === 'intakeId') return null;
                        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        return (
                            <div key={key} className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{String(value)}</dd>
                            </div>
                        );
                    })}
                     <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Intake</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{selectedIntake?.name || 'Not assigned'}</dd>
                    </div>
                     <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Enrolling Courses</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                           <ul className="list-disc list-inside space-y-1">
                               {selectedCourses.map(c => <li key={c.id}>{c.courseName}</li>)}
                           </ul>
                        </dd>
                    </div>
                </dl>
            </div>
            
            {error && <p className="text-red-500 text-sm text-center mt-4 font-bold">{error}</p>}

            <div className="mt-6 flex justify-between space-x-4">
                <button onClick={() => setStep('form')} className="w-full justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50">
                    Back to Edit
                </button>
                <button onClick={handleFinalSubmit} disabled={loading} className="w-full justify-center py-2 px-4 border border-transparent rounded-md shadow-lg text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300">
                    {loading ? 'Submitting...' : 'Confirm & Register'}
                </button>
            </div>
        </div>
    );
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <style>{`.input-field { appearance: none; border-radius: 0.375rem; position: relative; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; placeholder-color: #6b7280; color: #111827; background-color: #ffffff; } .dark .input-field { border-color: #4b5563; color: #f9fafb; background-color: #374151; } .input-field:focus { outline: none; --tw-ring-color: #3b82f6; border-color: #3b82f6; z-index: 10; font-size: 0.875rem; }`}</style>
      <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {step === 'form' ? 'Student Registration' : 'Review Information'}
          </h2>
        </div>
        
        {step === 'form' ? renderForm() : renderPreview()}

        <div className="text-center text-sm">
           <p className="text-gray-600 dark:text-gray-400">
              Already a student?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                  Sign in
              </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;