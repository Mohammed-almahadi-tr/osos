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

    useEffect(() => {
        let isMounted = true;
        let timeoutId = null;
        
        // Initial session fetch
        const fetchSession = async () => {
            try {
                // Set a timeout for slow connections
                timeoutId = setTimeout(() => {
                    if (!isMounted) return;
                    console.warn('⚠️ Connection to Supabase is taking longer than expected...');
                }, 5000);

                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }

                if (!isMounted) return;
                
                if (error) {
                    console.error('❌ Session fetch error:', error.message);
                    setLoading(false);
                    return;
                }
                
                if (session?.user) {
                    setUser(session.user);
                    await fetchProfile(session.user.id);
                } else {
                    setLoading(false);
                }
            } catch (error) {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                
                if (!isMounted) return;
                
                // Handle lock errors gracefully
                if (error.message && error.message.toLowerCase().includes('lock')) {
                    console.warn('⚠️ Lock error detected, clearing session:', error.message);
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                    return;
                }

                console.error('❌ Unexpected error during session fetch:', error);
                setLoading(false);
            }
        };

        fetchSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return;
            
            console.log('🔐 Auth state changed:', event);
            
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
            if (timeoutId) clearTimeout(timeoutId);
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
            
            if (error) {
                console.error('❌ Profile fetch error:', error.message);
                
                // If profile doesn't exist, user needs to have their role set
                if (error.code === 'PGRST116') {
                    console.error('❌ No profile found for user. The trigger may not have fired or role is not set.');
                }
                
                setProfile(null);
                setLoading(false);
                return;
            }
            
            if (!data.role || (data.role !== 'admin' && data.role !== 'employee')) {
                console.error('❌ Invalid or missing role in profile:', data);
                setProfile(null);
            } else {
                console.log('✅ Profile loaded successfully:', { username: data.username, role: data.role });
                setProfile(data);
            }
        } catch (error) {
            console.error('❌ Unexpected error fetching profile:', error);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    const value = {
        user,
        profile,
        loading,
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
