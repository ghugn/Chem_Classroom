import { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { BadgeDollarSign } from 'lucide-react';

const StudentTuition = () => {
    const [tuitions, setTuitions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/student/tuitions');
            setTuitions(res.data);
        } catch (err) {
            console.error('Lỗi lấy dữ liệu:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6">
            <div className="mb-8">
                <motion.h1 variants={itemVariants} className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Học phí của tôi
                </motion.h1>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">Dưới đây là các đợt đóng học phí mà bạn cần hoàn thành.</p>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-gray-500 dark:text-gray-400 font-medium text-[13px]">
                                <th className="px-4 py-3">Tên khoản thu</th>
                                <th className="px-4 py-3 text-center">Số tiền</th>
                                <th className="px-4 py-3 text-center">Trạng thái</th>
                                <th className="px-4 py-3 text-center">Ngày đóng</th>
                            </tr>
                        </thead>
                        <tbody className="text-[13px]">
                            {tuitions.length === 0 ? (
                                <tr><td colSpan="4" className="p-4 text-center text-slate-500 dark:text-slate-400">Bạn chưa có khoản thu nào</td></tr>
                            ) : tuitions.map((t) => (
                                <tr key={t.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                                        {t.title}
                                        <div className="text-[11px] font-normal text-slate-400 mt-1">Thông báo lúc: {new Date(t.created_at).toLocaleDateString('vi-VN')}</div>
                                    </td>
                                    <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-200">
                                        {parseInt(t.amount).toLocaleString('vi-VN')} ₫
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {t.status === 'paid' ? (
                                            <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 px-3 py-1 rounded-full text-[13px] font-medium border border-emerald-100 dark:border-emerald-500/20">Đã Nộp</span>
                                        ) : (
                                            <span className="bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 px-3 py-1 rounded-full text-[13px] font-medium border border-rose-100 dark:border-rose-500/20">Chưa Nộp</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 font-medium">
                                        {t.paid_at ? new Date(t.paid_at).toLocaleDateString('vi-VN') : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            )}
        </motion.div>
    );
};

export default StudentTuition;
