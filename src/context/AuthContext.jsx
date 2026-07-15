/* eslint-disable react-refresh/only-export-components */
/**
 * @file AuthContext.jsx
 * @description Provides global authentication state, session management, and extended profile data via Supabase.
 */

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

/**
 * Global Context for Authentication.
 * @type {React.Context<Object|null>}
 */
const AuthContext = createContext(null);

/**
 * Custom hook to consume the AuthContext safely.
 * @returns {Object} The authentication context payload (user, profile, loading, helper methods).
 */
export const useAuth = () => {
    return useContext(AuthContext);
};

/**
 * Helper function to wrap any Promise with a strict timeout execution.
 * @param {Promise<any>} promise - The original promise to execute.
 * @param {number} ms - Timeout duration in milliseconds before rejecting.
 * @returns {Promise<any>} Resolves with the original promise result or rejects if the timeout is reached.
 */
const withTimeout = (promise, ms) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), ms)
        )
    ]);
};

/**
 * AuthProvider component that wraps the application to inject global authentication state.
 * @param {Object} props - React component props.
 * @param {React.ReactNode} props.children - Child components that require access to the auth context.
 * @returns {JSX.Element} The AuthContext Provider wrapping children elements.
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfileState] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // We use a ref to track profile state synchronously inside the onAuthStateChange listener
    const profileRef = useRef(null);

    const setProfile = (newProfile) => {
        profileRef.current = newProfile;
        setProfileState(newProfile);
    };

    // Track in-progress fetches to prevent duplicate/concurrent runs that cause Supabase lock theft
    const fetchInProgress = useRef(false);

    /**
     * Fetches the extended user profile from the database with robust retry and timeout logic.
     * Wrapped in a strict try/catch/finally block to ensure graceful degradation.
     * 
     * @param {string} userId - The unique identifier of the authenticated user.
     * @param {number} [retries=3] - The number of allowed attempts before failing.
     * @returns {Promise<void>} Resolves when the profile fetch is completely resolved or fails securely.
     */
    const fetchProfile = useCallback(async (userId, retries = 3, isSilentRetry = false) => {
        // Prevent concurrent execution of fetchProfile which causes lock races
        if (fetchInProgress.current) {
            console.log('⏳ fetchProfile already in progress, skipping concurrent call.');
            return;
        }
        fetchInProgress.current = true;

        try {
            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    // Attempt to fetch the profile with a 10-second timeout to prevent infinite hanging
                    console.log(`📋 Fetching profile (attempt ${attempt}/${retries})...`);

                    const result = await withTimeout(
                        supabase
                            .from('profiles')
                            .select('id, username, role, created_at')
                            .eq('id', userId)
                            .single(),
                        10000 // 10 second timeout per attempt
                    );

                    const { data, error } = result;

                    if (error) {
                        console.warn('⚠️ Profile fetch error:', error.message);

                        if (error.message && error.message.includes('stole it')) {
                            console.warn('🔄 Transient auth lock theft detected. Retrying safely...');
                            if (attempt < retries) {
                                // Add a longer delay to allow the competing token request to resolve and release the lock
                                await new Promise(r => setTimeout(r, 1200));
                                continue;
                            }
                            // If all retries fail, do not force logout. Soft fail and retry silently.
                            if (!isSilentRetry) toast('الاتصال بطيء، جاري تحميل بيانات الحساب...', { icon: '⚠️', id: 'slow-conn' });
                            setTimeout(() => { fetchProfile(userId, 1, true); }, 5000);
                            return; // Exit loop and function without clearing user state
                        }

                        if (error.code === 'PGRST116') {
                            toast.error('لم يتم العثور على ملف تعريف لهذا المستخدم.');
                            setProfile(null);
                            setUser(null);
                            return;
                        } else {
                            if (attempt < retries) {
                                await new Promise(r => setTimeout(r, 1200));
                                continue;
                            }
                            // Soft fail for other errors
                            if (!isSilentRetry) toast('الاتصال بطيء، جاري تحميل بيانات الحساب...', { icon: '⚠️', id: 'slow-conn' });
                            setTimeout(() => { fetchProfile(userId, 1, true); }, 5000);
                            return; // Do not clear user state
                        }
                    }

                    if (!data.role || !['admin', 'employee', 'company_manager'].includes(data.role)) {
                        console.warn('⚠️ Invalid role detected:', data.role);
                        toast.error('هذا الحساب ليس لديه صلاحيات الدخول المحددة.');
                        
                        setProfile(null);
                        setUser(null);
                        await supabase.auth.signOut();
                        return; // Exit loop and function
                    }

                    // If user is a company_manager, fetch their company_id
                    if (data.role === 'company_manager') {
                        const { data: cmData, error: cmError } = await supabase
                            .from('company_managers')
                            .select('company_id')
                            .eq('user_id', userId)
                            .single();
                        
                        if (!cmError && cmData) {
                            data.company_id = cmData.company_id;
                        } else {
                            console.warn('⚠️ Failed to fetch company_id for manager:', cmError);
                        }
                    }

                    // Profile fetch successful
                    if (isSilentRetry) toast.success('تم استعادة الاتصال وتحميل البيانات');
                    console.log('✅ Profile loaded:', { username: data.username, role: data.role });
                    setProfile(data);
                    return; // Success — exit the loop and function

                } catch (err) {
                    if (err.message === 'TIMEOUT') {
                        console.warn(`⏳ Profile fetch timed out (attempt ${attempt}/${retries})`);

                        if (attempt < retries) {
                            console.log('🔄 Retrying fetch...');
                            continue; // Try again, loop continues
                        }

                        // All retries exhausted, gracefully fallback using soft fail
                        console.warn('⚠️ All profile fetch attempts timed out. Soft failing...');
                        if (!isSilentRetry) toast('الاتصال بطيء، جاري تحميل بيانات الحساب...', { icon: '⚠️', id: 'slow-conn' });
                        setTimeout(() => { fetchProfile(userId, 1, true); }, 5000);
                        return;
                    } else {
                        // Catching any other potential JS execution bugs during the fetch cycle
                        console.warn('⚠️ Unexpected error during profile fetch:', err);
                        
                        if (attempt < retries) {
                            continue;
                        }
                        
                        if (!isSilentRetry) toast('الاتصال بطيء، جاري تحميل بيانات الحساب...', { icon: '⚠️', id: 'slow-conn' });
                        setTimeout(() => { fetchProfile(userId, 1, true); }, 5000);
                        return;
                    }
                }
            }
        } catch (fatalError) {
            // Outermost strict try/catch to prevent ANY unhandled rejections from escaping
            console.warn('⚠️ Fatal error in profile fetching logic:', fatalError);
            setProfile(null);
            setUser(null);
        } finally {
            // Ensure loading state is explicitly disabled in all scenarios so the app never gets stuck on a loading screen
            setLoading(false);
            fetchInProgress.current = false;
        }
    }, []);

    /**
     * Initializes global auth listener on component mount.
     * Tracks login, logout, and token refresh events triggered by Supabase.
     */
    useEffect(() => {
        let isMounted = true;

        // Subscribing to Supabase authentication state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return;

            console.log('🔐 Auth event:', event, '| User:', session?.user?.email || 'none');

            if (event === 'SIGNED_OUT') {
                // Clear context state immediately when the user signs out
                setUser(null);
                setProfile(null);
                setLoading(false);
                return;
            }

            if (session?.user) {
                // User is authenticated, anchor base user state
                setUser(session.user);

                // Fetch extended profile data if the session is initiating, logging in, or refreshing
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                    if (!profileRef.current) {
                        await fetchProfile(session.user.id);
                    } else {
                        console.log('✅ Profile already in state, skipping redundant database fetch.');
                        setLoading(false);
                    }
                }
            } else {
                // No session user object found, fallback to logged out state
                setUser(null);
                setProfile(null);
                setLoading(false);
            }
        });

        // Safety net interval: if nothing resolves within 25 seconds, forcibly stop the loading overlay
        const safetyTimeout = setTimeout(() => {
            if (!isMounted) return;
            console.warn('⚠️ Auth safety timeout reached — forcing loading spinner to stop.');
            setLoading(false);
        }, 25000);

        return () => {
            // Cleanup phase on component unmount to prevent memory leaks and redundant fetches
            isMounted = false;
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

    // Construct the context payload exported to consuming components
    const value = {
        user,
        profile,
        loading,
        isAdmin: profile?.role?.toLowerCase() === 'admin',
        isEmployee: profile?.role?.toLowerCase() === 'employee',
        isCompanyManager: profile?.role?.toLowerCase() === 'company_manager',
        signOut: () => supabase.auth.signOut(),
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
