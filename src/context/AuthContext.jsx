import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

// Helper: wrap any promise with a timeout
const withTimeout = (promise, ms) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), ms)
        )
    ]);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId, retries = 2) => {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
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
                    console.error('❌ Profile fetch error:', error.message);

                    if (error.code === 'PGRST116') {
                        toast.error('لم يتم العثور على ملف تعريف لهذا المستخدم.');
                    } else {
                        toast.error(`خطأ في جلب بيانات المستخدم: ${error.message}`);
                    }

                    setProfile(null);
                    setUser(null);
                    setLoading(false);
                    return;
                }

                if (!data.role || (data.role !== 'admin' && data.role !== 'employee')) {
                    console.error('❌ Invalid role:', data.role);
                    toast.error('هذا الحساب ليس لديه صلاحيات الدخول المحددة.');
                    setProfile(null);
                    setUser(null);
                    await supabase.auth.signOut();
                    setLoading(false);
                    return;
                }

                console.log('✅ Profile loaded:', { username: data.username, role: data.role });
                setProfile(data);
                setLoading(false);
                return; // Success — exit the retry loop

            } catch (err) {
                if (err.message === 'TIMEOUT') {
                    console.warn(`⏳ Profile fetch timed out (attempt ${attempt}/${retries})`);

                    if (attempt < retries) {
                        console.log('🔄 Retrying...');
                        continue; // Try again
                    }

                    // All retries exhausted
                    console.error('❌ All profile fetch attempts timed out.');
                    toast.error('تعذر الاتصال بقاعدة البيانات. يرجى تحديث الصفحة.');
                } else {
                    console.error('❌ Unexpected error:', err);
                }

                setProfile(null);
                setUser(null);
                setLoading(false);
                return;
            }
        }
    };

    useEffect(() => {
        let isMounted = true;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return;

            console.log('🔐 Auth event:', event, '| User:', session?.user?.email || 'none');

            if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
                setLoading(false);
                return;
            }

            if (session?.user) {
                setUser(session.user);

                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                    await fetchProfile(session.user.id);
                }
            } else {
                setUser(null);
                setProfile(null);
                setLoading(false);
            }
        });

        // Safety net: if nothing resolves within 25 seconds, stop loading
        const safetyTimeout = setTimeout(() => {
            if (!isMounted) return;
            console.warn('⚠️ Safety timeout — forcing loading to stop.');
            setLoading(false);
        }, 25000);

        return () => {
            isMounted = false;
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

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
