import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { createEmployeeUser, isUsernameAvailable } from '../../services/adminAuth';
import { useCompany } from '../../context/CompanyContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

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
        job_skills: '',
        username: '',
        password: '',
        isAI: false
    });
    const [showPassword, setShowPassword] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: '' });
    
    // Bulk Upload State
    const [isBulkUploading, setIsBulkUploading] = useState(false);
    const [bulkProgress, setBulkProgress] = useState({ total: 0, current: 0, success: 0, failed: 0 });

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData(prev => ({ ...prev, [e.target.name]: value }));
        
        // Check username availability when it changes
        if (e.target.name === 'username') {
            checkUsernameAvailability(value);
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
        } catch {
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
                job_skills: formData.job_skills,
                company_id: selectedCompanyId,
                user_id: userId, // Link employee to auth user
                is_ai: formData.isAI
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
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!selectedCompanyId) {
            toast.error("يرجى اختيار شركة أولاً");
            return;
        }

        setIsBulkUploading(true);
        setBulkProgress({ total: 0, current: 0, success: 0, failed: 0 });

        try {
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const bstr = evt.target.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws);

                    if (data.length === 0) {
                        toast.error("الملف فارغ");
                        setIsBulkUploading(false);
                        return;
                    }

                    setBulkProgress(prev => ({ ...prev, total: data.length }));

                    let successCount = 0;
                    let failedCount = 0;

                    for (let i = 0; i < data.length; i++) {
                        const row = data[i];
                        
                        // Extract values trying English and Arabic keys flexibly
                        const name = row['Name'] || row['name'] || row['الاسم'] || row['الاسم الرباعي'] || row['اسم الموظف'];
                        const national_id = row['National ID'] || row['national_id'] || row['الهوية'] || row['الهوية الوطنية'] || row['رقم الهوية'] || row['الإقامة'];
                        const email = row['Email'] || row['email'] || row['البريد'] || row['البريد الإلكتروني'];
                        const phone = row['Phone'] || row['phone'] || row['الجوال'] || row['رقم الجوال'] || row['الهاتف'];
                        const job_title = row['Job Title'] || row['job_title'] || row['المسمى الوظيفي'] || row['الوظيفة'];
                        const salary = row['Salary'] || row['salary'] || row['الراتب'] || row['المرتب'];
                        const job_skills = row['Job Skills'] || row['job_skills'] || row['المهارات'] || row['المهارات الوظيفية'];
                        const username = row['Username'] || row['username'] || row['اسم المستخدم'] || row['اليوزر'];
                        const password = row['Password'] || row['password'] || row['كلمة المرور'] || row['الرقم السري'] || row['الباسورد'];

                        if (!name || !username || !password || !phone || !job_title || !salary) {
                            console.error('Row validation failed:', { name, username, password: !!password, phone, job_title, salary, raw: row });
                            toast.error(`خطأ: بيانات غير مكتملة في الصف ${i + 2}`);
                            failedCount++;
                            setBulkProgress(prev => ({ ...prev, current: prev.current + 1, failed: failedCount }));
                            continue;
                        }

                        try {
                            const usernameAvailable = await isUsernameAvailable(username);
                            if (!usernameAvailable) {
                                console.warn(`Username ${username} is not available`);
                                toast.error(`اسم المستخدم "${username}" غير متاح`);
                                failedCount++;
                                setBulkProgress(prev => ({ ...prev, current: prev.current + 1, failed: failedCount }));
                                continue;
                            }

                            const userEmail = email || `${username}@system.local`;
                            const { success, userId, error: createAuthError } = await createEmployeeUser({
                                username,
                                password: String(password),
                                email: userEmail
                            });

                            if (!success) {
                                console.error(`Failed to create auth for ${username}:`, createAuthError);
                                failedCount++;
                                setBulkProgress(prev => ({ ...prev, current: prev.current + 1, failed: failedCount }));
                                continue;
                            }

                            const employeeData = {
                                name,
                                phone: String(phone),
                                email: userEmail,
                                national_id: national_id ? String(national_id) : null,
                                job_title,
                                salary: parseFloat(salary) || 0,
                                job_skills: job_skills || '',
                                company_id: selectedCompanyId,
                                user_id: userId
                            };

                            const { error: employeeError } = await supabase
                                .from('employees')
                                .insert([employeeData]);

                            if (employeeError) {
                                console.error(`Failed to insert employee data for ${username}:`, employeeError.message);
                                toast.error(`خطأ في بيانات ${name}: ${employeeError.message}`);
                                failedCount++;
                            } else {
                                successCount++;
                            }
                        } catch (err) {
                            console.error(`Unexpected bulk error for ${username}:`, err);
                            toast.error(`خطأ غير متوقع لـ ${username}: ${err.message}`);
                            failedCount++;
                        }

                        setBulkProgress(prev => ({ ...prev, current: prev.current + 1, success: successCount, failed: failedCount }));
                    }

                    toast.success(`تم الانتهاء! نجاح: ${successCount}، فشل: ${failedCount}`, { duration: 6000 });
                } catch (error) {
                    console.error("Error parsing file:", error);
                    toast.error("حدث خطأ أثناء معالجة الملف");
                } finally {
                    setIsBulkUploading(false);
                    e.target.value = ''; // Reset file input
                }
            };
            reader.readAsBinaryString(file);
        } catch (error) {
            console.error("Error reading file:", error);
            toast.error("حدث خطأ أثناء قراءة الملف");
            setIsBulkUploading(false);
            e.target.value = '';
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-100">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">person_add</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold headline-font text-zinc-900">إضافة موظف جديد</h2>
                            <p className="text-sm text-zinc-500">أدخل بيانات الموظف الأساسية والمعلومات الوظيفية</p>
                        </div>
                    </div>
                    
                    {/* Bulk Upload Button */}
                    <div className="relative">
                        <input 
                            type="file" 
                            accept=".xlsx, .xls, .csv" 
                            onChange={handleFileUpload} 
                            disabled={isBulkUploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                        />
                        <button 
                            disabled={isBulkUploading}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${
                                isBulkUploading 
                                ? 'bg-zinc-100 text-zinc-400' 
                                : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm">
                                {isBulkUploading ? 'hourglass_empty' : 'upload_file'}
                            </span>
                            {isBulkUploading ? 'جاري الرفع...' : 'رفع ملف Excel / CSV'}
                        </button>
                    </div>
                </div>

                {/* Bulk Upload Progress */}
                {isBulkUploading && (
                    <div className="mb-8 p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                        <div className="flex justify-between text-sm font-bold text-zinc-700">
                            <span>جاري معالجة الموظفين...</span>
                            <span>{bulkProgress.current} / {bulkProgress.total}</span>
                        </div>
                        <div className="w-full bg-zinc-200 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${(bulkProgress.current / (bulkProgress.total || 1)) * 100}%` }}></div>
                        </div>
                        <div className="flex gap-4 text-xs font-bold">
                            <span className="text-green-600">نجاح: {bulkProgress.success}</span>
                            <span className="text-red-600">فشل: {bulkProgress.failed}</span>
                        </div>
                    </div>
                )}

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
                                <label className="text-sm font-bold text-zinc-700">المرتب</label>
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
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-bold text-zinc-700">المهارات الوظيفية</label>
                                <textarea 
                                    name="job_skills"
                                    value={formData.job_skills}
                                    onChange={handleChange}
                                    className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 min-h-[100px]" 
                                    placeholder="مثال: البرمجة، إدارة المشاريع، تصميم الواجهات..." 
                                ></textarea>
                                <p className="text-xs text-zinc-500">يمكنك إدخال مهارات متعددة مفصولة بفاصلة</p>
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

                        {/* AI Agent Option */}
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mt-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <div className="mt-1">
                                    <input 
                                        type="checkbox"
                                        name="isAI"
                                        checked={formData.isAI}
                                        onChange={handleChange}
                                        className="w-5 h-5 text-purple-600 rounded border-purple-300 focus:ring-purple-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-purple-900 mb-1">موظف افتراضي (Agent AI)</h4>
                                    <p className="text-xs text-purple-700">عند التفعيل: سيقوم النظام يومياً بشكل آلي بتسجيل حضور الموظف، وتنفيذ مهامه المعلقة بالترتيب وكتابة وصف الإنجاز تلقائياً، ثم تسجيل الانصراف بدون تدخل بشري.</p>
                                </div>
                            </label>
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
