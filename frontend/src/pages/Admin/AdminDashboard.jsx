import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Presentation, BookOpen, Banknote, CreditCard } from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalClasses: 0,
        totalMaterials: 0,
        financials: { totalPaid: 0, totalUnpaid: 0 }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/dashboard');
                setStats(res.data);
            } catch (err) {
                console.error("Lỗi lấy thống kê:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="max-w-5xl">
            {/* Page header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Tổng quan</h1>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">Chào mừng trở lại bảng điều khiển.</p>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-600"></div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Stats row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'Tổng số học sinh', value: stats.totalStudents, icon: Users },
                            { label: 'Số lớp học', value: stats.totalClasses, icon: Presentation },
                            { label: 'Tài liệu', value: stats.totalMaterials, icon: BookOpen }
                        ].map((stat, idx) => (
                            <div
                                key={idx}
                                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:border-gray-300 dark:hover:border-gray-700 transition-colors duration-200"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <stat.icon className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={1.75} />
                                    <span className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">{stat.label}</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Financial section */}
                    <div>
                        <h2 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 mb-4">Tình trạng học phí</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Đã thu */}
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:border-gray-300 dark:hover:border-gray-700 transition-colors duration-200">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Banknote className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={1.75} />
                                        <span className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">Đã thu</span>
                                    </div>
                                    <span className="text-[10px] font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">Paid</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {stats.financials.totalPaid.toLocaleString('vi-VN')} <span className="text-sm font-medium text-gray-400">đ</span>
                                </div>
                            </div>

                            {/* Chưa thu */}
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:border-gray-300 dark:hover:border-gray-700 transition-colors duration-200">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={1.75} />
                                        <span className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">Chưa thu</span>
                                    </div>
                                    <span className="text-[10px] font-medium bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">Unpaid</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {stats.financials.totalUnpaid.toLocaleString('vi-VN')} <span className="text-sm font-medium text-gray-400">đ</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
