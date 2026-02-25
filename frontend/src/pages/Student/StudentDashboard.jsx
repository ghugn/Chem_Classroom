import { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { Presentation, CreditCard, Users, Clock, LayoutDashboard } from 'lucide-react';

const formatCurrency = (val) => {
    if (val === undefined || val === null) return '0 ₫';
    return parseInt(val).toLocaleString('vi-VN') + ' ₫';
};

const StudentDashboard = () => {
    const [classes, setClasses] = useState([]);
    const [summary, setSummary] = useState({
        totalClasses: 0,
        totalFee: 0,
        unpaidTuition: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/students/dashboard');
                const data = res.data;
                setClasses(data.classes || []);
                setSummary({
                    totalClasses: data.summary?.totalClasses || 0,
                    totalFee: data.summary?.totalFee || 0,
                    unpaidTuition: data.summary?.unpaidTuition || 0
                });
            } catch (err) {
                console.error("Lỗi lấy thông tin tổng quan từ API Dashboard mới:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="flex h-64 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8">
            <div className="mb-8">
                <motion.h1 variants={itemVariants} className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Tổng quan
                </motion.h1>
                <motion.p variants={itemVariants} className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Nắm bắt nhanh tình hình học tập của bạn.</motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-5 group"
                >
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg transition-transform duration-300 group-hover:scale-105">
                        <Presentation size={24} strokeWidth={1.75} />
                    </div>
                    <div>
                        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Lớp đang học</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{summary.totalClasses}</h3>
                    </div>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-5 group"
                >
                    <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg transition-transform duration-300 group-hover:scale-105">
                        <CreditCard size={24} strokeWidth={1.75} />
                    </div>
                    <div>
                        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Học phí chưa đóng</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(summary.unpaidTuition)}</h3>
                    </div>
                </motion.div>
            </div>

            <motion.div variants={itemVariants}>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Lớp học của bạn</h2>
                {classes.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400">
                        <Presentation size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">Bạn chưa được xếp vào lớp học nào</p>
                        <p className="text-sm mt-1">Vui lòng liên hệ trung tâm để được sắp xếp lịch học sớm nhất.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {classes.map((cls, idx) => (
                            <motion.div
                                key={cls.class_id}
                                variants={itemVariants}
                                whileHover={{ y: -4 }}
                                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden"
                            >
                                <div className="bg-gray-50 dark:bg-slate-950/40 p-5 border-b border-gray-200 dark:border-slate-800">
                                    <h3 className="text-lg font-bold text-black dark:text-gray-300 mb-2">{cls.class_name}</h3>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md shadow-sm border border-slate-100 dark:border-slate-800">
                                            <Clock size={14} /> {cls.schedule || "Lịch linh hoạt"}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                            <Users size={16} />
                                            <span className="text-[13px] font-medium">Danh sách lớp</span>
                                        </div>
                                        <span className="bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border border-slate-100 dark:border-slate-500/20 text-[11px] font-bold px-2 py-0.5 rounded-md">
                                            {cls.classmate_count} bạn
                                        </span>
                                    </div>

                                    {cls.classmates && cls.classmates.length > 0 ? (
                                        <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                                            {cls.classmates.map((student, i) => (
                                                <div key={i} className="flex items-center gap-2.5 p-2 rounded-md bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                    <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-slate-900 flex items-center justify-center text-gray-900 dark:text-gray-100 text-[10px] font-bold shrink-0">
                                                        {student.full_name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 truncate">
                                                        {student.full_name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 dark:text-slate-500 italic text-center py-4">Chưa có bạn học nào khác.</p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default StudentDashboard;
