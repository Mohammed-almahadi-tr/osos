import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const EmployeeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [employee, setEmployee] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const today = new Date();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        return `${yyyy}-${mm}`;
    });
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [editForm, setEditForm] = useState({ check_in: '', check_out: '', percentage: '' });
    const [saving, setSaving] = useState(false);
    const [pdfExporting, setPdfExporting] = useState(false);

    useEffect(() => {
        fetchEmployeeData();
    }, [id, selectedMonth]);

    const fetchEmployeeData = async () => {
        setLoading(true);
        try {
            // Fetch employee details
            const { data: empData, error: empError } = await supabase
                .from('employees')
                .select('*')
                .eq('id', id)
                .single();
            
            if (empError) throw empError;
            setEmployee(empData);

            // Fetch attendance history
            // Calculate start and end dates of the selected month
            const [year, month] = selectedMonth.split('-');
            const startDate = `${year}-${month}-01`;
            
            // Get the last day of the month
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = `${year}-${month}-${lastDay}`;

            const { data: attData, error: attError } = await supabase
                .from('attendance')
                .select('*')
                .eq('employee_id', id)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: false });

            if (attError) throw attError;
            
            // Generate full month dates array
            const fullMonthAttendance = [];
            for (let i = 1; i <= lastDay; i++) {
                const currentDateStr = `${year}-${month}-${String(i).padStart(2, '0')}`;
                
                // Find if we have a record for this date
                const existingRecord = (attData || []).find(r => r.date === currentDateStr);
                
                if (existingRecord) {
                    fullMonthAttendance.push(existingRecord);
                } else {
                    // Push a placeholder absent record
                    fullMonthAttendance.push({
                        isAbsent: true,
                        date: currentDateStr,
                        check_in: null,
                        check_out: null,
                        percentage_of_achievement: null,
                        employee_id: id
                    });
                }
            }
            
            // Order descending (newest first)
            fullMonthAttendance.reverse();
            setAttendance(fullMonthAttendance);
        } catch (error) {
            console.error('Error fetching employee details:', error);
            toast.error('حدث خطأ أثناء جلب بيانات الموظف');
            navigate('/admin/employees');
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        if (!employee) return;
        
        // Prepare Data for Export
        const profileData = [
            ["معلومات الموظف", ""],
            ["الاسم", employee.name],
            ["المسمى الوظيفي", employee.job_title],
            ["الهوية الوطنية", employee.national_id || '-'],
            ["رقم الجوال", employee.phone || '-'],
            ["المرتب", employee.salary ? `${employee.salary} ريال` : '-'],
            ["المهارات الوظيفية", employee.job_skills || '-'],
            ["", ""], // empty row
            ["سجل الحضور", ""]
        ];

        const headers = ["التاريخ", "وقت الدخول", "وقت الخروج", "عدد الساعات", "نسبة الإنجاز"];
        
        const attendanceRows = attendance.map(rec => {
            return [
                rec.date,
                rec.isAbsent ? '00:00' : formatTime(rec.check_in),
                rec.isAbsent ? '00:00' : formatTime(rec.check_out),
                rec.isAbsent ? '0.0' : calculateHours(rec.check_in, rec.check_out),
                rec.isAbsent ? 'غائب' : (rec.percentage_of_achievement ? `${rec.percentage_of_achievement}%` : '-')
            ];
        });

        const worksheetData = [...profileData, headers, ...attendanceRows];
        
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        // RTL Support
        worksheet['!dir'] = 'rtl';
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "تقرير الموظف");
        
        // Write to blob and trigger download with explicit extension
        const wbOut = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        
        const safeName = (employee.name || 'Employee').replace(/[\\/:*?"<>|]/g, '-').trim();
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${safeName}_Attendance.xlsx`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    };

    // ─── PDF Export ─────────────────────────────────────────────
    const exportToPDF = async () => {
        if (!employee) return;
        setPdfExporting(true);
        try {
            // ── Fetch fresh data from Supabase ──
            const { data: empData, error: empError } = await supabase
                .from('employees')
                .select('*')
                .eq('id', id)
                .single();
            if (empError) throw empError;

            const [year, month] = selectedMonth.split('-');
            const startDate = `${year}-${month}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = `${year}-${month}-${lastDay}`;

            const { data: attData, error: attError } = await supabase
                .from('attendance')
                .select('*')
                .eq('employee_id', id)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: true });
            if (attError) throw attError;

            // Build full month array & calculate average achievement
            const fullMonth = [];
            let totalAchievement = 0;
            let presentDaysCount = 0;

            for (let i = 1; i <= lastDay; i++) {
                const dateStr = `${year}-${month}-${String(i).padStart(2, '0')}`;
                const existing = (attData || []).find(r => r.date === dateStr);
                
                if (existing && !existing.isAbsent && existing.percentage_of_achievement != null) {
                    totalAchievement += existing.percentage_of_achievement;
                    presentDaysCount++;
                }

                fullMonth.push(existing || {
                    isAbsent: true,
                    date: dateStr,
                    check_in: null,
                    check_out: null,
                    percentage_of_achievement: null,
                });
            }

            const calcAvg = presentDaysCount > 0 ? (totalAchievement / presentDaysCount).toFixed(1) : 0;
            const companyName = "أُسس"; // Generic fallback as per requirements

            // ── Load assets ──
            const pdfBytes = await fetch('/osos_paper.pdf').then(res => res.arrayBuffer());
            const fontBytes = await fetch('/fonts/Cairo-VariableFont_slnt,wght.ttf').then(res => res.arrayBuffer());

            // ── Initialize PDF using template ──
            const pdfDoc = await PDFDocument.load(pdfBytes);
            pdfDoc.registerFontkit(fontkit);
            const customFont = await pdfDoc.embedFont(fontBytes);

            // Helper: draw bi-directional segment-based text
            const drawRTL = (page, text, x, y, size = 12) => {
                if (!text) return;
                const str = String(text);
                
                // Split by contiguous English/number strings (e.g. "John Doe", "08:30", "2026-05-12")
                const regex = /([A-Za-z0-9.:%/-]+(?:\s+[A-Za-z0-9.:%/-]+)*)/g;
                const segments = str.split(regex).filter(Boolean);
                
                // Calculate total width of all segments
                let totalWidth = 0;
                const segWidths = segments.map(seg => {
                    const w = customFont.widthOfTextAtSize(seg, size);
                    totalWidth += w;
                    return w;
                });
                
                // Draw each segment from right to left (native RTL layout order)
                let currentX = x;
                segments.forEach((seg, index) => {
                    const w = segWidths[index];
                    page.drawText(seg, {
                        x: currentX - w,
                        y,
                        size,
                        font: customFont,
                    });
                    currentX -= w;
                });
            };

            // Helper: draw bi-directional centered text inside a bounding box
            const drawCenteredText = (page, text, rightBound, width, y, size) => {
                const regex = /([A-Za-z0-9.:%/-]+(?:\s+[A-Za-z0-9.:%/-]+)*)/g;
                const segments = String(text || '').split(regex).filter(Boolean);
                
                let totalW = 0;
                const segWidths = segments.map(seg => {
                    const w = customFont.widthOfTextAtSize(seg, size);
                    totalW += w;
                    return w;
                });

                let currentX = rightBound - (width / 2) + (totalW / 2);
                segments.forEach((seg, index) => {
                    const w = segWidths[index];
                    page.drawText(seg, {
                        x: currentX - w,
                        y,
                        size,
                        font: customFont,
                    });
                    currentX -= w;
                });
            };

            // ── PAGE 1: Employee Profile Details (Formal Form Structure) ──
            const page1 = pdfDoc.getPages()[0];
            
            // ── PAGE 2: Copy the BLANK template page FIRST, before any drawing ──
            const [pageTemplate] = await pdfDoc.copyPages(pdfDoc, [0]);
            const page2 = pdfDoc.addPage(pageTemplate);
            
            // Outer Form Box dimensions (under the template header)
            const boxX = 50;
            const boxY = 150;
            const boxWidth = 495;
            const boxHeight = 530;
            
            // Draw Outer Box
            page1.drawRectangle({
                x: boxX,
                y: boxY,
                width: boxWidth,
                height: boxHeight,
                borderColor: rgb(0.2, 0.2, 0.2),
                borderWidth: 1.5,
            });

            // 5 Rows for Employee Data (height 35 each)
            const rowHeight = 35;
            const startRowY = boxY + boxHeight - rowHeight; // 645

            // Draw Horizontal lines for rows
            for (let i = 1; i <= 5; i++) {
                const lineY = startRowY - (i - 1) * rowHeight;
                page1.drawLine({
                    start: { x: boxX, y: lineY },
                    end: { x: boxX + boxWidth, y: lineY },
                    thickness: 1,
                    color: rgb(0.2, 0.2, 0.2)
                });
            }

            // Draw Vertical Divider between label and value columns
            const labelColWidth = 140;
            const dividerX = boxX + boxWidth - labelColWidth; // 405
            page1.drawLine({
                start: { x: dividerX, y: startRowY - (4 * rowHeight) }, // Down through Row 5
                end: { x: dividerX, y: boxY + boxHeight },
                thickness: 1,
                color: rgb(0.2, 0.2, 0.2)
            });

            // Draw Row Labels (Right side)
            const labelX = boxX + boxWidth - 15; // Padding from right edge
            drawRTL(page1, "الشركة", labelX, startRowY + 10, 13);
            drawRTL(page1, "اسم الموظف", labelX, startRowY - rowHeight + 10, 13);
            drawRTL(page1, "المهمة", labelX, startRowY - (2 * rowHeight) + 10, 13);
            drawRTL(page1, "الراتب", labelX, startRowY - (3 * rowHeight) + 10, 13);
            drawRTL(page1, "نسبة الانجاز", labelX, startRowY - (4 * rowHeight) + 10, 13);

            // Draw Row Values (Left side)
            const valueX = dividerX - 15; // Padding from divider
            drawRTL(page1, companyName, valueX, startRowY + 10, 13);
            drawRTL(page1, empData.name || '', valueX, startRowY - rowHeight + 10, 13);
            drawRTL(page1, empData.job_title || '', valueX, startRowY - (2 * rowHeight) + 10, 13);
            drawRTL(page1, `${empData.salary || 0} ريال`, valueX, startRowY - (3 * rowHeight) + 10, 13);
            drawRTL(page1, `${calcAvg}%`, valueX, startRowY - (4 * rowHeight) + 10, 13);

            // "مهام الوظيفة" (Job Tasks) Section
            const tasksSectionY = startRowY - (5 * rowHeight); // 470
            
            // Section Title inside the box
            drawRTL(page1, "مهام الوظيفة", labelX, tasksSectionY - 25, 14);

            // Draw separator line under title inside the box
            page1.drawLine({
                start: { x: boxX, y: tasksSectionY - 35 },
                end: { x: boxX + boxWidth, y: tasksSectionY - 35 },
                thickness: 1,
                color: rgb(0.2, 0.2, 0.2)
            });

            // Draw Skills bullet points
            const skillsStr = empData.job_skills || '';
            const skills = skillsStr ? skillsStr.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [];
            let skillY = tasksSectionY - 60;

            if (skills.length > 0) {
                skills.forEach((skill) => {
                    if (skillY > boxY + 20) { // Stay within box boundary
                        drawRTL(page1, `•  ${skill}`, labelX - 10, skillY, 12);
                        skillY -= 22;
                    }
                });
            } else {
                drawRTL(page1, "-", labelX - 10, skillY, 12);
            }

            // ── PAGE 2: Bordered Attendance Table ──

            // Table Title
            drawRTL(page2, "سجل الحضور والانصراف", 350, 610, 16);

            const startX = 50;
            let tableY = 580;
            const tableRowHeight = 14; 
            const colWidths = [70, 100, 100, 100, 100]; 
            const tableWidth = colWidths.reduce((a, b) => a + b, 0); // 470

            const headers = ["اليوم", "وقت الدخول", "وقت الخروج", "عدد الساعات", "نسبة الانجاز"];

            const getColRightBound = (index) => {
                let r = startX + tableWidth;
                for (let j = 0; j < index; j++) {
                    r -= colWidths[j];
                }
                return r;
            };

            // Draw Headers
            headers.forEach((text, i) => {
                const rBound = getColRightBound(i);
                drawCenteredText(page2, text, rBound, colWidths[i], tableY - 11, 10);
            });

            // Header lines
            page2.drawLine({ start: { x: startX, y: tableY }, end: { x: startX + tableWidth, y: tableY }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });
            page2.drawLine({ start: { x: startX, y: tableY - tableRowHeight }, end: { x: startX + tableWidth, y: tableY - tableRowHeight }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });

            let loopY = tableY - tableRowHeight;

            fullMonth.forEach((rec) => {
                const dateText = rec.date;
                const checkIn = rec.isAbsent ? '00:00' : formatTime(rec.check_in);
                const checkOut = rec.isAbsent ? '00:00' : formatTime(rec.check_out);
                const hours = rec.isAbsent ? '0.0' : calculateHours(rec.check_in, rec.check_out);
                const achievement = rec.isAbsent ? '-' : (rec.percentage_of_achievement ? `${rec.percentage_of_achievement}%` : '-');

                const rowData = [dateText, checkIn, checkOut, hours, achievement];

                rowData.forEach((text, i) => {
                    const rBound = getColRightBound(i);
                    drawCenteredText(page2, text, rBound, colWidths[i], loopY - 11, 8);
                });

                // Row bottom line
                page2.drawLine({ start: { x: startX, y: loopY - tableRowHeight }, end: { x: startX + tableWidth, y: loopY - tableRowHeight }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });
                
                loopY -= tableRowHeight;
            });

            // Draw Vertical Lines
            let vx = startX + tableWidth;
            page2.drawLine({ start: { x: vx, y: tableY }, end: { x: vx, y: loopY }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });
            for (let i = 0; i < colWidths.length; i++) {
                vx -= colWidths[i];
                page2.drawLine({ start: { x: vx, y: tableY }, end: { x: vx, y: loopY }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });
            }

            // ── Trigger download ──
            const pdfOutput = await pdfDoc.save();
            const blob = new Blob([pdfOutput], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            const safeName = (empData.name || 'Employee').replace(/[\\/:*?"<>|]/g, '-').trim();
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${safeName}_سجل_الموظف.pdf`;
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);

            toast.success('تم تصدير ملف PDF بنجاح');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            toast.error('حدث خطأ أثناء تصدير PDF');
        } finally {
            setPdfExporting(false);
        }
    };

    const openEditModal = (record) => {
        setEditingRecord(record);
        // Convert timestamp to time string for input type="time"
        const formatForInput = (iso) => {
            if (!iso) return '';
            const d = new Date(iso);
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        };

        setEditForm({
            check_in: formatForInput(record.check_in),
            check_out: formatForInput(record.check_out),
            percentage: record.percentage_of_achievement || ''
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const dateStr = editingRecord.date;
            
            // Reconstruct ISO timestamps
            const checkInIso = editForm.check_in ? new Date(`${dateStr}T${editForm.check_in}:00`).toISOString() : null;
            const checkOutIso = editForm.check_out ? new Date(`${dateStr}T${editForm.check_out}:00`).toISOString() : null;
            const percentage = editForm.percentage ? parseFloat(editForm.percentage) : null;

            if (editingRecord.id) {
                const { error } = await supabase
                    .from('attendance')
                    .update({
                        check_in: checkInIso,
                        check_out: checkOutIso,
                        percentage_of_achievement: percentage
                    })
                    .eq('id', editingRecord.id);

                if (error) throw error;
            } else {
                // It's an absent day, so insert a new record
                if (!checkInIso || !checkOutIso) {
                    toast.error('يرجى إدخال أوقات الحضور والانصراف لتسجيل يوم جديد');
                    setSaving(false);
                    return;
                }
                const { error } = await supabase
                    .from('attendance')
                    .insert([{
                        employee_id: id,
                        date: dateStr,
                        check_in: checkInIso,
                        check_out: checkOutIso,
                        percentage_of_achievement: percentage
                    }]);

                if (error) throw error;
            }

            toast.success('تم تحديث السجل بنجاح');
            setIsEditModalOpen(false);
            fetchEmployeeData(); // refresh
        } catch (error) {
            console.error('Error updating attendance:', error);
            toast.error('حدث خطأ أثناء التحديث');
        } finally {
            setSaving(false);
        }
    };

    const formatTime = (isoString) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    };

    const calculateHours = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return '0.0';
        const inTime = new Date(checkIn);
        const outTime = new Date(checkOut);
        const diffHours = (outTime - inTime) / (1000 * 60 * 60);
        return diffHours > 0 ? diffHours.toFixed(1) : '0.0';
    };

    // Calculate Average Achievement
    const presentDays = attendance.filter(r => !r.isAbsent && r.percentage_of_achievement != null);
    const averageAchievement = presentDays.length > 0
        ? presentDays.reduce((acc, curr) => acc + curr.percentage_of_achievement, 0) / presentDays.length
        : 0;

    if (loading || !employee) {
        return <div className="text-center py-20 font-bold text-primary">جاري التحميل...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 bg-surface-container hover:bg-zinc-200 rounded-xl transition-colors">
                        <span className="material-symbols-outlined text-zinc-700">arrow_forward</span>
                    </button>
                    <h2 className="text-xl font-bold headline-font text-zinc-900">تفاصيل الموظف</h2>
                </div>
                <div className="flex items-center gap-4">
                    <input 
                        type="month" 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-surface-container border-none rounded-xl px-4 py-2.5 font-bold text-zinc-700 focus:ring-2 focus:ring-primary/20"
                    />
                    <button onClick={handleExportExcel} className="bg-primary hover:opacity-90 text-white font-bold px-4 py-2.5 rounded-xl transition-opacity flex items-center gap-2 shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-sm">download</span>
                        تصدير Excel
                    </button>
                    <button
                        onClick={exportToPDF}
                        disabled={pdfExporting}
                        className="bg-red-600 hover:opacity-90 text-white font-bold px-4 py-2.5 rounded-xl transition-opacity flex items-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined text-sm">{pdfExporting ? 'hourglass_empty' : 'picture_as_pdf'}</span>
                        {pdfExporting ? 'جاري التصدير...' : 'تصدير PDF'}
                    </button>
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                        {employee.name.charAt(0)}
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm text-zinc-500 mb-1">الاسم</p>
                            <p className="font-bold text-zinc-900 text-lg">{employee.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500 mb-1">المسمى الوظيفي</p>
                            <p className="font-bold text-zinc-900 text-lg">{employee.job_title}</p>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500 mb-1">الهوية الوطنية</p>
                            <p className="font-bold text-zinc-900 text-lg">{employee.national_id || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500 mb-1">رقم الجوال</p>
                            <p className="font-bold text-zinc-900 text-lg" dir="ltr">{employee.phone || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500 mb-1">المرتب</p>
                            <p className="font-bold text-zinc-900 text-lg">{employee.salary ? `${employee.salary} ريال` : '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500 mb-1">متوسط الإنجاز</p>
                            <p className="font-bold text-green-600 text-lg">{averageAchievement.toFixed(1)}%</p>
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                            <p className="text-sm text-zinc-500 mb-2">المهارات الوظيفية</p>
                            {employee.job_skills ? (
                                <ul className="list-disc list-inside space-y-1 text-zinc-700 font-medium">
                                    {employee.job_skills.split(',').map((skill, idx) => (
                                        <li key={idx}>{skill.trim()}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-zinc-500">-</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-zinc-900">سجل الحضور والغياب</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-surface-container-low text-zinc-600 font-bold">
                            <tr>
                                <th className="px-6 py-4">اليوم/التاريخ</th>
                                <th className="px-6 py-4">وقت الدخول</th>
                                <th className="px-6 py-4">وقت الخروج</th>
                                <th className="px-6 py-4">عدد الساعات</th>
                                <th className="px-6 py-4">نسبة الإنجاز</th>
                                <th className="px-6 py-4 text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {attendance.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-10 text-zinc-500">لا يوجد سجلات في هذا الشهر</td></tr>
                            ) : (
                                attendance.map((rec) => (
                                    <tr key={rec.id || rec.date} className={`transition-colors ${rec.isAbsent ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-zinc-50'}`}>
                                        <td className="px-6 py-4 font-bold text-zinc-900">
                                            {rec.date}
                                            {rec.isAbsent && <span className="mr-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md">غائب</span>}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-700">{rec.isAbsent ? '00:00' : formatTime(rec.check_in)}</td>
                                        <td className="px-6 py-4 text-zinc-700">{rec.isAbsent ? '00:00' : formatTime(rec.check_out)}</td>
                                        <td className="px-6 py-4 font-bold text-primary">{rec.isAbsent ? '0.0' : calculateHours(rec.check_in, rec.check_out)} ساعة</td>
                                        <td className="px-6 py-4 font-bold text-green-600">
                                            {rec.isAbsent ? '-' : (rec.percentage_of_achievement ? `${rec.percentage_of_achievement}%` : '-')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => openEditModal(rec)}
                                                className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors inline-flex"
                                            >
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-surface-container-lowest">
                            <h3 className="font-bold text-lg headline-font text-zinc-900">تعديل سجل الحضور</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700">وقت الدخول</label>
                                <input 
                                    type="time" 
                                    value={editForm.check_in}
                                    onChange={(e) => setEditForm({...editForm, check_in: e.target.value})}
                                    className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700">وقت الخروج</label>
                                <input 
                                    type="time" 
                                    value={editForm.check_out}
                                    onChange={(e) => setEditForm({...editForm, check_out: e.target.value})}
                                    className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700">نسبة الإنجاز (%)</label>
                                <input 
                                    type="number" 
                                    min="0" max="100" step="0.1"
                                    value={editForm.percentage}
                                    onChange={(e) => setEditForm({...editForm, percentage: e.target.value})}
                                    className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20" 
                                    placeholder="مثال: 85.5"
                                />
                            </div>
                            
                            <div className="mt-4 p-4 bg-primary/5 rounded-xl">
                                <p className="text-sm text-primary font-bold flex justify-between">
                                    <span>عدد الساعات المحسوب:</span>
                                    <span>{calculateHours(`2000-01-01T${editForm.check_in || '00:00'}:00`, `2000-01-01T${editForm.check_out || '00:00'}:00`)} ساعة</span>
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 font-bold text-zinc-600 bg-surface-container hover:bg-zinc-200 rounded-xl transition-colors">
                                    إلغاء
                                </button>
                                <button disabled={saving} type="submit" className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                                    {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeDetail;
