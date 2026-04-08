import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { createEmployeeUser, isUsernameAvailable } from '../../services/adminAuth';
import { useCompany } from '../../context/CompanyContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AddEmployee = () => {
    const { selectedCompanyId } = useCompany();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        national_id: '',
        job_title: '',
        salary: '',
        username: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: '' });

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        
        // Check username availability when it changes
        if (e.target.name === 'username') {
            checkUsernameAvailability(e.target.value);
        }
    };

    const checkUsernameAvailability = async (username) => {
        if (!username || username.length < 3) {
            setUsernameStatus({ checking: false, available: null, message: '' });
            return;
        }

        setUsernameStatus({ checking: true, available: null, message: 'جاري التحقق...' });

        try {
            const available = await isUsernameAvailable(username);
            if (available) {
                setUsernameStatus({ 
                    checking: false, 
                    available: true, 
                    message: '✓ اسم المستخدم متاح' 
                });
            } else {
                setUsernameStatus({ 
                    checking: false, 
                    available: false, 
                    message: '✗ اسم المستخدم مستخدم بالفعل' 
                });
            }
        } catch (error) {
            setUsernameStatus({ checking: false, available: null, message: '' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedCompanyId) {
            toast.error("يرجى اختيار شركة أولاً");
            navigate('/admin/company-selection');
            return;
        }

        // Validate username and password
        if (!formData.username || formData.username.length < 3) {
            toast.error("اسم المستخدم يجب أن يكون 3 أحرف على الأقل");
            return;
        }

        if (!formData.password || formData.password.length < 6) {
            toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
            return;
        }

        setLoading(true);

        try {
            console.log('🔐 Starting employee creation process...');
            
            // Step 1: Check if username is available
            const usernameAvailable = await isUsernameAvailable(formData.username);
            if (!usernameAvailable) {
                toast.error('اسم المستخدم مستخدم بالفعل. يرجى اختيار اسم آخر');
                setLoading(false);
                return;
            }

            // Step 2: Create user account in Supabase Auth
            const userEmail = formData.email || `${formData.username}@system.local`;
            
            const { success, userId, error: authError } = await createEmployeeUser({
                username: formData.username,
                password: formData.password,
                email: userEmail
            });

            if (!success) {
                throw new Error(authError || 'فشل إنشاء حساب المستخدم');
            }

            console.log('✅ User account created:', userId);

            // Step 3: Create employee record linked to the user
            const employeeData = {
                name: formData.name,
                phone: formData.phone,
                email: userEmail,
                national_id: formData.national_id,
                job_title: formData.job_title,
                salary: parseFloat(formData.salary),
                company_id: selectedCompanyId,
                user_id: userId // Link employee to auth user
            };

            const { error: employeeError } = await supabase
                .from('employees')
                .insert([employeeData]);

            if (employeeError) {
                console.error('❌ Employee insert error:', employeeError);
                throw new Error(`فشل إضافة بيانات الموظف: ${employeeError.message}`);
            }

            console.log('✅ Employee record created successfully');
            
            toast.success(
                `تم إضافة الموظف بنجاح!\n\nاسم المستخدم: ${formData.username}\nكلمة المرور: ${formData.password}\n\nيرجى حفظ هذه البيانات وتسليمها للموظف`,
                { duration: 8000 }
            );
            
            navigate('/admin/employees');
            
        } catch (error) {
            console.error('❌ Error adding employee:', error);
            toast.error(error.message || "حدث خطأ أثناء إضافة الموظف");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-100">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">person_add</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold headline-font text-zinc-900">إضافة موظف جديد</h2>
                        <p className="text-sm text-zinc-500">أدخل بيانات الموظف الأساسية والمعلومات الوظيفية</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information Section */}
                    <div className="space-y-4">
                        <h3 className="text-base font-bold text-zinc-800 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">badge</span>
                            المعلومات الشخصية
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700">الاسم الرباعي</label>
                                <input 
                                    required
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    type="text" 
                                    className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20" 
                                    placeholder="مثال: أحمد محمد عبدالله" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700">الهوية الوطنية / الإقامة</label>
                                <input 
                                    required
                                    name="national_id"
                                    value={formData.national_id}
                                    onChange={handleChange}
                                    type="text" 
                                    className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20" 
                                    placeholder="10XXXXXXXX" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700">البريد الإلكتروني (اختياري)</label>
                                <input 
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    type="email" 
                                    className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20" 
                                    placeholder="employee@company.com" 
                                />
                                <p className="text-xs text-zinc-500">إذا لم يتم إدخاله، سيتم إنشاء بريد تلقائي</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700">رقم الجوال</label>
                                <input 
                                    required
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    type="tel" 
                                    className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20" 
                                    placeholder="05XXXXXXXX" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700">المسمى الوظيفي</label>
                                <input 
                                    required
                                    name="job_title"
                                    value={formData.job_title}
                                    onChange={handleChange}
                                    type="text" 
                                    className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20" 
                                    placeholder="مثال: مبرمج واجهات" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700">الراتب الأساسي</label>
                                <input 
                                    required
                                    name="salary"
                                    value={formData.salary}
                                    onChange={handleChange}
                                    type="number" 
                                    className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20" 
                                    placeholder="5000" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Login Credentials Section */}
                    <div className="space-y-4 pt-6 border-t border-zinc-200">
                        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <span className="material-symbols-outlined text-blue-600 mt-0.5">info</span>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-blue-900 mb-1">بيانات تسجيل الدخول</h3>
                                <p className="text-xs text-blue-700">سيتم إنشاء حساب للموظف في النظام باستخدام اسم المستخدم وكلمة المرور أدناه</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">person</span>
                                    اسم المستخدم
                                </label>
                                <input 
                                    required
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    type="text"
                                    minLength={3}
                                    className={`w-full bg-surface-container border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/40 ${
                                        usernameStatus.available === true ? 'border-green-500' :
                                        usernameStatus.available === false ? 'border-red-500' :
                                        'border-primary/20'
                                    }`}
                                    placeholder="مثال: ahmed.mohammed" 
                                />
                                {usernameStatus.message && (
                                    <p className={`text-xs flex items-center gap-1 ${
                                        usernameStatus.available === true ? 'text-green-600' :
                                        usernameStatus.available === false ? 'text-red-600' :
                                        'text-zinc-500'
                                    }`}>
                                        {usernameStatus.checking && (
                                            <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                        )}
                                        {usernameStatus.message}
                                    </p>
                                )}
                                {!usernameStatus.message && (
                                    <p className="text-xs text-zinc-500">3 أحرف على الأقل، يستخدم لتسجيل الدخول</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">lock</span>
                                    كلمة المرور
                                </label>
                                <div className="relative">
                                    <input 
                                        required
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        type={showPassword ? "text" : "password"}
                                        minLength={6}
                                        className="w-full bg-surface-container border-2 border-primary/20 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-primary/40 focus:border-primary" 
                                        placeholder="••••••••" 
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                    >
                                        <span className="material-symbols-outlined text-xl">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                                <p className="text-xs text-zinc-500">6 أحرف على الأقل، يُنصح باستخدام أحرف وأرقام</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-100 flex justify-end gap-4">
                        <button type="button" onClick={() => navigate('/admin/employees')} className="px-6 py-3 font-bold text-zinc-500 hover:bg-zinc-100 rounded-xl transition-colors">
                            إلغاء
                        </button>
                        <button disabled={loading} type="submit" className="px-8 py-3 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity">
                            {loading ? 'جاري الحفظ...' : 'حفظ بيانات الموظف'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEmployee;
