import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

const Login = () => {
    const { user, loading } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (!username || !password) {
            toast.error('يرجى إدخال اسم المستخدم وكلمة المرور');
            return;
        }

        setIsLoading(true);
        
        try {
            // Check if Supabase is configured
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            if (!supabaseUrl || !supabaseKey) {
                toast.error('خطأ في الإعدادات: لم يتم تكوين Supabase بشكل صحيح');
                console.error('❌ Supabase credentials missing in .env file');
                setIsLoading(false);
                return;
            }
            
            // Convert username to email format if needed
            const loginEmail = username.includes('@') ? username : `${username}@system.local`;
            
            console.log('🔐 Attempting login for:', loginEmail);

            const { error, data } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: password,
            });

            if (error) {
                console.error('❌ Login error:', error);
                
                if (error.message === 'Invalid login credentials') {
                    toast.error('بيانات الاعتماد غير صحيحة');
                } else if (error.message.includes('Email not confirmed')) {
                    toast.error('يرجى تأكيد البريد الإلكتروني أولاً');
                } else {
                    toast.error(`خطأ في تسجيل الدخول: ${error.message}`);
                }
            } else {
                console.log('✅ Login successful');
                toast.success('تم تسجيل الدخول بنجاح');
                // The AuthContext will catch the auth state change and redirect based on role
            }
        } catch (error) {
            console.error('❌ Unexpected login error:', error);
            toast.error('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div dir="rtl" className="bg-surface text-on-surface min-h-screen flex flex-col justify-center items-center p-6 relative overflow-hidden font-body">
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-tertiary/10 blur-[100px]"></div>
            </div>
            
            <main className="relative z-10 w-full max-w-[460px]">
                <div className="bg-surface-container-lowest rounded-xl shadow-[0_8px_24px_rgba(26,28,28,0.06)] overflow-hidden">
                    <div className="p-8 md:p-12">
                        <div className="flex flex-col items-center mb-10">
                            <div className="mb-6 flex items-center justify-center">
                                {/* Added the company logo */}
                                <img src="/logo.jpg" alt="أسس مدار الرؤية" className="h-32 w-32 object-cover rounded-2xl shadow-lg ring-1 ring-black/5" />
                            </div>
                            <h1 className="text-2xl font-headline font-bold text-on-surface tracking-tight text-center mb-2">
                                مرحبا بكم في نظام أسس مدار الرؤية
                            </h1>
                            <p className="text-on-surface-variant text-sm text-center">
                                يرجى إدخال بيانات الاعتماد الخاصة بك للوصول
                            </p>
                        </div>
                        
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-on-surface-variant pr-1" htmlFor="username">
                                    اسم المستخدم / البريد الإلكتروني
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-outline">person</span>
                                    </div>
                                    <input 
                                        type="text" 
                                        id="username" 
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="block w-full pr-12 pl-4 py-3.5 bg-surface-container-highest border-none rounded-lg text-on-surface placeholder-on-surface-variant/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200" 
                                        placeholder="أدخل اسم المستخدم" 
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-on-surface-variant pr-1" htmlFor="password">
                                    كلمة المرور
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-outline">lock</span>
                                    </div>
                                    <input 
                                        type="password" 
                                        id="password" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pr-12 pl-4 py-3.5 bg-surface-container-highest border-none rounded-lg text-on-surface placeholder-on-surface-variant/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200" 
                                        placeholder="••••••••" 
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between py-2">
                                <div className="flex items-center">
                                    <input type="checkbox" id="remember-me" className="h-4 w-4 text-primary focus:ring-primary border-outline-variant rounded bg-surface-container-low" />
                                    <label htmlFor="remember-me" className="mr-2 block text-sm text-on-surface-variant">
                                        تذكرني
                                    </label>
                                </div>
                                <div className="text-sm">
                                    <a href="#" className="font-medium text-primary hover:text-primary-container transition-colors">
                                        نسيت كلمة المرور؟
                                    </a>
                                </div>
                            </div>
                            
                            <div className="pt-4">
                                <button type="submit" disabled={isLoading} className="w-full editorial-gradient text-white font-headline font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed">
                                    <span>{isLoading ? 'جاري التحميل...' : 'تسجيل الدخول'}</span>
                                    <span className="material-symbols-outlined">login</span>
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    <div className="bg-surface-container-low px-8 py-6 flex justify-center items-center">
                        <p className="text-xs text-on-secondary-container flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">verified_user</span>
                            نظام آمن ومشفر لإدارة البيانات
                        </p>
                    </div>
                </div>
                
                <footer className="mt-8 text-center text-on-surface-variant/60 text-xs">
                    <p>© 2024 أسس مدار الرؤية. جميع الحقوق محفوظة.</p>
                </footer>
            </main>
            
            <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-l from-primary via-primary-container to-transparent"></div>
        </div>
    );
};

export default Login;
