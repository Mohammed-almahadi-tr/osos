import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CompanyContext = createContext();

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider = ({ children }) => {
    const { isAdmin } = useAuth();
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

    // Clear selected company if user is not admin
    useEffect(() => {
        if (!isAdmin) {
            setSelectedCompanyId(null);
        }
    }, [isAdmin]);

    return (
        <CompanyContext.Provider value={{ selectedCompanyId, setSelectedCompanyId }}>
            {children}
        </CompanyContext.Provider>
    );
};
