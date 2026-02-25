import { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';

const StudentGrades = () => {
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGrades = async () => {
            try {
                setLoading(true);
                const res = await api.get('/student/grades');
                setGrades(res.data);
            } catch (err) {
                console.error('Lỗi lấy điểm sinh viên:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchGrades();
    }, []);

    // Helper: calculate color based on score percentage
    const getGradeColor = (score, maxScore) => {
        if (score === null || score === undefined) return 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800';
        const percentage = score / maxScore;
        if (percentage >= 0.8) return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
        if (percentage >= 0.5) return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
        return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20';
    };

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="mb-8">
                    <motion.h1 variants={itemVariants} className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Điểm thi
                    </motion.h1>
                    <motion.p variants={itemVariants} className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">Xem lại kết quả các bài kiểm tra, bài thi đã tham gia.</motion.p>
                </div>
            </div>

            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-gray-500 dark:text-gray-400 font-medium text-[13px]">
                                    <th className="px-4 py-3 pl-6 whitespace-nowrap">Bài kiểm tra</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Lớp học</th>
                                    <th className="px-4 py-3 text-center whitespace-nowrap">Điểm số</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Nhận xét</th>
                                    <th className="px-4 py-3 pr-6 whitespace-nowrap text-right">Ngày thi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50 text-[13px]">
                                {grades.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-12 text-center text-slate-500 dark:text-slate-400">
                                            <GraduationCap size={48} className="mx-auto mb-4 opacity-20" />
                                            <p className="text-lg font-medium">Chưa có bản ghi điểm nào.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    grades.map(g => (
                                        <motion.tr
                                            key={g.exam_id}
                                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group cursor-default"
                                        >
                                            <td className="px-4 py-3 pl-6 font-semibold text-slate-800 dark:text-slate-200">{g.title}</td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-500/10 text-[11px] font-medium text-slate-700 dark:text-slate-400 border border-slate-100 dark:border-slate-500/20">
                                                    {g.class_name}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {g.score !== null ? (
                                                    <div className={`inline-flex flex-col items-center justify-center p-2 rounded-lg border min-w-[4rem] ${getGradeColor(g.score, g.max_score)}`}>
                                                        <span className="text-xl font-bold leading-none">{Number(g.score)}</span>
                                                        <span className="text-[10px] opacity-70 mt-1 uppercase tracking-wider">/ {Number(g.max_score)}</span>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 font-bold text-lg">
                                                        -
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-[13px] max-w-[200px] truncate" title={g.comment}>
                                                {g.comment ? (
                                                    <span className="italic">{g.comment}</span>
                                                ) : (
                                                    <span className="text-slate-400 dark:text-slate-600">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 pr-6 text-slate-500 dark:text-slate-400 text-[13px] text-right">
                                                {new Date(g.exam_date).toLocaleDateString('vi-VN')}
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default StudentGrades;
