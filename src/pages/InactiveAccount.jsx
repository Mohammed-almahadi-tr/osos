import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const InactiveAccount = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            console.log('🚪 Logging out...');
            
            // Sign out from Supabase
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                console.error('Logout error:', error);
            }
            
            // Clear all storage
            localStorage.clear();
            sessionStorage.clear();
            
            console.log('✅ Logged out successfully');
            
            // Force hard redirect to login page
            window.location.href = '/login';
        } catch (error) {
            console.error('❌ Error during logout:', error);
            
            // Force logout anyway
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/login';
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center text-center p-6 bg-gradient-to-br from-zinc-50 to-zinc-100">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-5xl text-red-600">error</span>
                </div>
                
                <h2 className="text-2xl font-bold text-zinc-900 mb-3">حساب غير مفعل</h2>
                
                <p className="text-zinc-600 mb-6 leading-relaxed">
                    هذا الحساب لا يمتلك صلاحيات حالياً. يرجى التأكد من تعيين دور (admin / employee) في جدول profiles الخاص بك في Supabase.
                </p>

                {user && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-right">
                        <p className="text-sm text-blue-900 mb-2">
                            <strong>معلومات الحساب:</strong>
                        </p>
                        <p className="text-xs text-blue-700">
                            البريد الإلكتروني: {user.email}
                        </p>
                        <p className="text-xs text-blue-700">
                            معرف المستخدم: {user.id}
                        </p>
                    </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-right">
                    <p className="text-sm font-bold text-amber-900 mb-2">
                        كيفية تفعيل الحساب:
                    </p>
                    <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
                        <li>افتح لوحة تحكم Supabase</li>
                        <li>انتقل إلى Table Editor → profiles</li>
                        <li>ابحث عن حسابك باستخدام البريد الإلكتروني</li>
                        <li>عدّل حقل role إلى admin أو employee</li>
                        <li>احفظ التغييرات</li>
                        <li>ارجع وسجل الدخول مرة أخرى</li>
                    </ol>
                </div>

                <button 
                    onClick={handleLogout}
                    className="w-full px-6 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg font-bold shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined">logout</span>
                    <span>تسجيل الخروج والعودة للدخول</span>
                </button>

                <div className="mt-4 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                    <p className="text-xs text-zinc-600 mb-2 font-bold">
                        إذا لم يعمل الزر أعلاه، افتح Console (F12) وشغل:
                    </p>
                    <code className="text-xs bg-zinc-800 text-green-400 p-2 rounded block font-mono">
                        localStorage.clear(); window.location.href='/login'
                    </code>
                </div>

                <p className="text-xs text-zinc-500 mt-4">
                    بعد تفعيل الحساب، يمكنك تسجيل الدخول مرة أخرى
                </p>
            </div>
        </div>
    );
};

export default InactiveAccount;
