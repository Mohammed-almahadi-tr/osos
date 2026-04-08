import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CompaniesList = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCompany, setEditingCompany] = useState(null);
    const [editName, setEditName] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .order('name');
            
            if (error) throw error;
            setCompanies(data || []);
        } catch (error) {
            console.error('Error fetching companies:', error);
            toast.error('حدث خطأ أثناء جلب الشركات');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (company) => {
        setEditingCompany(company.id);
        setEditName(company.name);
    };

    const handleCancelEdit = () => {
        setEditingCompany(null);
        setEditName('');
    };

    const handleSaveEdit = async (companyId) => {
        if (!editName || editName.trim().length < 3) {
            toast.error('اسم الشركة يجب أن يكون 3 أحرف على الأقل');
            return;
        }

        try {
            const { error } = await supabase
                .from('companies')
                .update({ name: editName.trim() })
                .eq('id', companyId);

            if (error) throw error;

            toast.success('تم تحديث الشركة بنجاح');
            setEditingCompany(null);
            setEditName('');
            fetchCompanies();
        } catch (error) {
            console.error('Error updating company:', error);
            toast.error('حدث خطأ أثناء تحديث الشركة');
        }
    };

    const handleDelete = async (companyId, companyName) => {
        if (!confirm(`هل أنت متأكد من حذف الشركة "${companyName}"؟\n\nتحذير: سيتم حذف جميع الموظفين المرتبطين بهذه الشركة!`)) {
            return;
        }

        try {
            // First, check if there are employees linked to this company
            const { data: employees, error: checkError } = await supabase
                .from('employees')
                .select('id')
                .eq('company_id', companyId);

            if (checkError) throw checkError;

            if (employees && employees.length > 0) {
                const confirmDelete = confirm(
                    `تحذير: يوجد ${employees.length} موظف مرتبط بهذه الشركة.\n\nهل تريد المتابعة؟ سيتم حذف جميع الموظفين والبيانات المرتبطة بهم.`
                );
                if (!confirmDelete) return;
            }

            const { error } = await supabase
                .from('companies')
                .delete()
                .eq('id', companyId);

            if (error) throw error;

            toast.success('تم حذف الشركة بنجاح');
            fetchCompanies();
        } catch (error) {
            console.error('Error deleting company:', error);
            toast.error('حدث خطأ أثناء حذف الشركة');
        }
    };

    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-zinc-900 mb-2">إدارة الشركات</h2>
                    <p className="text-zinc-500">عرض وتعديل وحذف الشركات المسجلة في النظام</p>
                </div>
                <button
                    onClick={() => navigate('/admin/add-company')}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity w-full md:w-auto"
                >
                    <span className="material-symbols-outlined">add</span>
                    <span>إضافة شركة جديدة</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
                <div className="relative">
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">search</span>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="البحث عن شركة..."
                        className="w-full pr-12 pl-4 py-3 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                    />
                </div>
            </div>

            {/* Companies List */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-zinc-500">
                        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p>جاري تحميل الشركات...</p>
                    </div>
                ) : filteredCompanies.length === 0 ? (
                    <div className="p-12 text-center">
                        <span className="material-symbols-outlined text-6xl text-zinc-300 mb-4">corporate_fare</span>
                        <p className="text-zinc-500 mb-2">
                            {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد شركات مسجلة'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => navigate('/admin/add-company')}
                                className="mt-4 text-primary font-bold hover:underline"
                            >
                                إضافة شركة جديدة
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-surface-container-low">
                                <tr>
                                    <th className="px-6 py-4 text-right text-sm font-bold text-zinc-700">اسم الشركة</th>
                                    <th className="px-6 py-4 text-right text-sm font-bold text-zinc-700">تاريخ الإضافة</th>
                                    <th className="px-6 py-4 text-center text-sm font-bold text-zinc-700">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {filteredCompanies.map((company) => (
                                    <tr key={company.id} className="hover:bg-surface-container-low/50 transition-colors">
                                        <td className="px-6 py-4">
                                            {editingCompany === company.id ? (
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="w-full px-3 py-2 border-2 border-primary rounded-lg focus:ring-2 focus:ring-primary/20"
                                                    autoFocus
                                                />
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                        <span className="material-symbols-outlined">corporate_fare</span>
                                                    </div>
                                                    <span className="font-medium text-zinc-900">{company.name}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600 text-sm">
                                            {new Date(company.created_at).toLocaleDateString('ar-SA')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {editingCompany === company.id ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleSaveEdit(company.id)}
                                                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-bold"
                                                        >
                                                            حفظ
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            className="px-4 py-2 bg-zinc-500 text-white rounded-lg hover:bg-zinc-600 transition-colors text-sm font-bold"
                                                        >
                                                            إلغاء
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(company)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="تعديل"
                                                        >
                                                            <span className="material-symbols-outlined">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(company.id, company.name)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="حذف"
                                                        >
                                                            <span className="material-symbols-outlined">delete</span>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Stats Card */}
            {!loading && companies.length > 0 && (
                <div className="bg-gradient-to-br from-primary/5 to-primary-container/5 p-6 rounded-2xl border border-primary/10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">analytics</span>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-600">إجمالي الشركات المسجلة</p>
                            <p className="text-3xl font-bold text-zinc-900">{companies.length}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompaniesList;
