/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CompanyContext = createContext();

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider = ({ children }) => {
    const { isAdmin, isCompanyManager, profile } = useAuth();
    // Persist company selection in localStorage for convenience
    const [selectedCompanyId, setSelectedCompanyId] = useState(() => {
        return localStorage.getItem('selected_company_id') || null;
    });

    useEffect(() => {
        if (selectedCompanyId) {
            localStorage.setItem('selected_company_id', selectedCompanyId);
        } else {
            localStorage.removeItem('selected_company_id');
        }
    }, [selectedCompanyId]);

    // Clear selected company if user is not admin and not company_manager
    useEffect(() => {
        if (isCompanyManager && profile?.company_id) {
            setSelectedCompanyId(profile.company_id);
        } else if (!isAdmin && !isCompanyManager && selectedCompanyId !== null) {
            const timeout = setTimeout(() => {
                setSelectedCompanyId(null);
            }, 0);
            return () => clearTimeout(timeout);
        }
    }, [isAdmin, isCompanyManager, profile?.company_id, selectedCompanyId]);

    return (
        <CompanyContext.Provider value={{ selectedCompanyId, setSelectedCompanyId }}>
            {children}
        </CompanyContext.Provider>
    );
};
