import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        
        // Initial session fetch
        const fetchSession = async () => {
            let timeoutId;
            try {
                timeoutId = setTimeout(() => {
                    if (!isMounted) return;
                    setAuthError('Error: Connection to authentication server timed out. Please check your network and VITE_SUPABASE_URL.');
                    setLoading(false);
                }, 8000);

                const { data: { session }, error } = await supabase.auth.getSession();
                if (timeoutId) clearTimeout(timeoutId);

                if (!isMounted) return;
                if (error) throw error;
                
                if (session?.user) {
                    setUser(session.user);
                    await fetchProfile(session.user.id);
                } else {
                    setLoading(false);
                }
            } catch (error) {
                if (timeoutId) clearTimeout(timeoutId);
                if (!isMounted) return;
                
                // Ignore Supabase internal lock errors caused by rapid StrictMode double-mounting
                // If we get a lock broken error from the active component, just log out and show login screen!
                if (error.message && (error.message.includes('Lock') || error.message.includes('lock'))) {
                    console.warn('Ignored Supabase lock error, defaulting to no session:', error.message);
                    setLoading(false);
                    return;
                }

                console.error('Error fetching session:', error);
                setAuthError(error.message || 'Error occurred during authentication.');
                setLoading(false);
            }
        };

        fetchSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return;
            if (session?.user) {
                setUser(session.user);
                await fetchProfile(session.user.id);
            } else {
                setUser(null);
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            if (subscription) subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (error) throw error;
            setProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const value = {
        user,
        profile,
        loading,
        authError,
        isAdmin: profile?.role?.toLowerCase() === 'admin',
        isEmployee: profile?.role?.toLowerCase() === 'employee',
        signOut: () => supabase.auth.signOut(),
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
