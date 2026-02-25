import { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

const StudentDocuments = () => {
    const [documents, setDocuments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [filterSubject, setFilterSubject] = useState('ALL');
    const [filterClass, setFilterClass] = useState('ALL');
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [docsRes, subjectsRes] = await Promise.all([
                api.get('/student/documents'),
                api.get('/subjects')
            ]);
            setDocuments(docsRes.data);
            setSubjects(subjectsRes.data);
        } catch (err) {
            console.error('Lỗi lấy dữ liệu:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const classMap = new Map();
    documents.forEach(doc => {
        if (doc.class_id && doc.class_name) {
            classMap.set(doc.class_id, doc.class_name);
        }
    });
    const enrolledClasses = Array.from(classMap.entries()).map(([id, name]) => ({ id, name }));

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
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div className="mb-8">
                    <motion.h1 variants={itemVariants} className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Tài liệu Lớp học
                    </motion.h1>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">Danh sách tài liệu được phát hành riêng cho lớp của bạn.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-48">
                        <select
                            className="w-full pl-3 pr-8 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 appearance-none bg-white dark:bg-slate-900 font-medium text-[13px] text-slate-600 dark:text-white"
                            value={filterClass}
                            onChange={(e) => setFilterClass(e.target.value)}
                        >
                            <option value="ALL">Tất cả các lớp</option>
                            <option value="GENERAL">Dành cho mọi học sinh</option>
                            {enrolledClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Tìm kiếm tài liệu..."
                            className="pl-4 pr-4 py-2 w-full border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 transition-shadow dark:bg-slate-900 dark:text-white text-[13px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </motion.div>

            {/* Subject Filter Tabs */}
            <motion.div variants={itemVariants} className="overflow-x-auto pb-2">
                <div className="flex space-x-2">
                    <button
                        onClick={() => setFilterSubject('ALL')}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-[13px] font-medium transition-colors ${filterSubject === 'ALL'
                            ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                    >
                        Tất cả loại tài liệu
                    </button>
                    <button
                        onClick={() => setFilterSubject('UNASSIGNED')}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-[13px] font-medium transition-colors ${filterSubject === 'UNASSIGNED'
                            ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                    >
                        Chưa phân loại
                    </button>
                    {subjects.map(sub => (
                        <button
                            key={sub.id}
                            onClick={() => setFilterSubject(sub.id)}
                            className={`px-4 py-2 rounded-full whitespace-nowrap text-[13px] font-medium transition-colors ${filterSubject === sub.id
                                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 shadow-sm'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            {sub.name}
                        </button>
                    ))}
                </div>
            </motion.div>

            {loading ? (
                <p className="text-slate-500">Đang tải...</p>
            ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-gray-500 dark:text-gray-400 font-medium text-[13px]">
                                <th className="px-4 py-3">Tên Tài liệu</th>
                                <th className="px-4 py-3">Loại tài liệu</th>
                                <th className="px-4 py-3">Lớp Học</th>
                                <th className="px-4 py-3">Ngày Upload</th>
                                <th className="px-4 py-3 text-center">Tải xuống</th>
                            </tr>
                        </thead>
                        <tbody className="text-[13px]">
                            {documents
                                .filter(doc => filterSubject === 'ALL' || (filterSubject === 'UNASSIGNED' ? !doc.subject_id : doc.subject_id === filterSubject))
                                .filter(doc => filterClass === 'ALL' || (filterClass === 'GENERAL' ? !doc.class_id : doc.class_id === filterClass))
                                .filter(doc => doc.title.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                                <tr><td colSpan="5" className="p-4 text-center text-slate-500 dark:text-slate-400 cursor-default">Không có tài liệu nào phù hợp với bộ lọc</td></tr>
                            ) : documents
                                .filter(doc => filterSubject === 'ALL' || (filterSubject === 'UNASSIGNED' ? !doc.subject_id : doc.subject_id === filterSubject))
                                .filter(doc => filterClass === 'ALL' || (filterClass === 'GENERAL' ? !doc.class_id : doc.class_id === filterClass))
                                .filter(doc => doc.title.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map((doc) => (
                                    <tr key={doc.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                                            <div className="flex flex-col">
                                                <span>{doc.title}</span>
                                                {doc.description && <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">{doc.description}</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {doc.subject_name ? (
                                                <span className="bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap border border-slate-100 dark:border-slate-500/20">
                                                    {doc.subject_name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-[12px] italic">Chưa phân loại</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">{doc.class_name || 'General'}</td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{new Date(doc.created_at).toLocaleDateString('vi-VN')}</td>
                                        <td className="px-4 py-3 text-center">
                                            {doc.file_url ? (
                                                <a href={`http://localhost:5000${doc.file_url}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all duration-150 text-[11px] font-medium border border-indigo-100 dark:border-indigo-500/30">Download</a>
                                            ) : (
                                                <span className="text-[11px] text-gray-400 italic">Không có file</span>
                                            )}
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

export default StudentDocuments;
