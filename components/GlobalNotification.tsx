
import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';

const GlobalNotification: React.FC = () => {
    const { systemSettings } = useData();
    const { enabled, message, id: notificationId } = systemSettings.globalNotification;
    
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (enabled) {
            const isDismissed = localStorage.getItem(notificationId);
            if (!isDismissed) {
                setIsVisible(true);
            }
        } else {
            setIsVisible(false);
        }
    }, [enabled, notificationId]);

    const handleDismiss = () => {
        localStorage.setItem(notificationId, 'true');
        setIsVisible(false);
    };

    if (!isVisible || !enabled) {
        return null;
    }

    return (
        <div className="relative bg-primary-600 text-white z-50 print:hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-center p-3 text-sm font-medium">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="flex-1 text-center md:ml-3">
                        <p>
                            <span className="font-semibold">System Announcement:</span>
                            <span className="ml-2">{message}</span>
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                         <button
                            type="button"
                            onClick={handleDismiss}
                            className="-mr-1 flex p-2 rounded-md hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-white sm:-mr-2"
                            aria-label="Dismiss"
                        >
                            <span className="sr-only">Dismiss</span>
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalNotification;