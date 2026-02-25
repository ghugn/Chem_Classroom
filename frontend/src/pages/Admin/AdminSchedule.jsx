import { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';

const AdminSchedule = () => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await api.get('/admin/classes');
                setClasses(res.data);
            } catch (err) {
                console.error("Lỗi lấy danh sách lớp:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, []);

    // Helper function to group classes by day of week
    const getClassesForDay = (day) => {
        return classes.filter(cls => cls.schedule && cls.schedule.startsWith(day))
            .sort((a, b) => {
                const timeA = a.schedule.match(/\((.*?)\s*-/)?.[1] || '';
                const timeB = b.schedule.match(/\((.*?)\s*-/)?.[1] || '';
                return timeA.localeCompare(timeB);
            });
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
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-6xl space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                    Lịch Dạy & Học
                </h1>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-7 gap-6"
                >
                    {daysOfWeek.map((day) => {
                        const dayClasses = getClassesForDay(day);
                        return (
                            <div key={day} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-full min-h-[300px]">
                                <div className="bg-gray-100 dark:bg-gray-900/50 p-3 text-center border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="font-bold text-gray-700 dark:text-gray-300">{day}</h3>
                                </div>
                                <div className="p-3 flex-1 overflow-y-auto space-y-3 bg-gray-50/50 dark:bg-gray-900/40">
                                    {dayClasses.length === 0 ? (
                                        <p className="text-[13px] text-gray-400 dark:text-gray-500 text-center italic mt-4">Không có lịch</p>
                                    ) : (
                                        dayClasses.map(cls => {
                                            const timeString = cls.schedule.match(/\((.*?)\)/)?.[1] || '';
                                            return (
                                                <div key={cls.id} className="bg-white dark:bg-gray-900 border-l-4 border-gray-900 dark:border-gray-500 p-3 rounded  hover:shadow-md transition-all duration-150">
                                                    <h4 className="font-semibold text-gray-800 dark:text-white text-[13px] mb-1">{cls.name}</h4>
                                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-700 inline-block px-2 py-1 rounded">
                                                        🕒 {timeString}
                                                    </p>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </motion.div>
            )}
        </motion.div>
    );
};

export default AdminSchedule;
