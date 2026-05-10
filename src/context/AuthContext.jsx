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

    const fetchProfile = async (userId) => {
        console.log('📋 Fetching profile for:', userId);
        try {
            const result = await withTimeout(
                supabase
                    .from('profiles')
                    .select('id, username, role, created_at')
                    .eq('id', userId)
                    .single(),
                8000 // 8 second timeout
            );

            const { data, error } = result;

            if (error) {
                console.error('❌ Profile fetch error:', error.message, error.code, error.details);

                if (error.code === 'PGRST116') {
                    toast.error('لم يتم العثور على ملف تعريف لهذا المستخدم. يرجى مراجعة المسؤول.');
                } else {
                    toast.error(`خطأ في جلب بيانات المستخدم: ${error.message}`);
                }

                setProfile(null);
                setUser(null);
                setLoading(false);
                return;
            }

            console.log('✅ Profile data received:', data);

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
        } catch (err) {
            if (err.message === 'TIMEOUT') {
                console.error('❌ Profile fetch TIMED OUT after 8 seconds');
                console.error('❌ This means the profiles table query is hanging.');
                console.error('❌ Check Supabase Dashboard → SQL Editor and run:');
                console.error('   SELECT * FROM profiles WHERE id = \'' + userId + '\';');
                toast.error('انتهت مهلة الاتصال بقاعدة البيانات. تحقق من إعدادات RLS.');
            } else {
                console.error('❌ Unexpected error:', err);
            }

            setProfile(null);
            setUser(null);
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        console.log('🔄 AuthProvider mounting...');

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

        // Safety net
        const safetyTimeout = setTimeout(() => {
            if (!isMounted) return;
            console.warn('⚠️ Safety timeout — forcing loading to stop.');
            setLoading(false);
        }, 15000);

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
