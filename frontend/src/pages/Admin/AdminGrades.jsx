import { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { motion } from 'framer-motion';
import { GraduationCap, Plus, Edit2, Trash2, ClipboardEdit } from 'lucide-react';

const AdminGrades = () => {
    const [classesTree, setClassesTree] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [exams, setExams] = useState([]);
    const [loadingExams, setLoadingExams] = useState(false);

    // Modal tạo buổi thi
    const [isExamModalOpen, setIsExamModalOpen] = useState(false);
    const [examForm, setExamForm] = useState({ id: null, title: '', date: '', max_score: 10, class_ids: [] });

    // Modal & trạng thái nhập điểm
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [currentExam, setCurrentExam] = useState(null);
    const [grades, setGrades] = useState([]);
    const [savingGrades, setSavingGrades] = useState(false);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await api.get('/admin/classes');
                setClassesTree(res.data);
                if (res.data.length > 0) {
                    setSelectedClass(res.data[0].id);
                }
            } catch (err) {
                console.error('Lỗi lấy danh sách lớp:', err);
            }
        };
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchExams(selectedClass);
        } else {
            setExams([]);
        }
    }, [selectedClass]);

    const fetchExams = async (classId) => {
        try {
            setLoadingExams(true);
            console.log('Fetching exams for class:', classId);
            const res = await api.get(`/admin/grades/classes/${classId}/exams`);
            console.log('API Exams Response:', res.data);
            if (Array.isArray(res.data)) {
                setExams(res.data);
            } else {
                console.error('Dữ liệu API không phải là mảng:', res.data);
                setExams([]);
            }
        } catch (err) {
            console.error('Lỗi lấy khoá học:', err);
            setExams([]);
        } finally {
            setLoadingExams(false);
        }
    };

    const handleOpenExamModal = (exam = null) => {
        if (exam) {
            setExamForm({
                id: exam.id,
                title: exam.title,
                date: new Date(exam.date).toISOString().split('T')[0],
                max_score: exam.max_score,
                class_ids: exam.classes ? exam.classes.map(c => c.id) : []
            });
        } else {
            setExamForm({
                id: null,
                title: '',
                date: new Date().toISOString().split('T')[0],
                max_score: 10,
                class_ids: selectedClass ? [selectedClass] : []
            });
        }
        setIsExamModalOpen(true);
    };

    const handleSaveExam = async (e) => {
        e.preventDefault();
        try {
            if (examForm.id) {
                await api.put(`/admin/grades/exams/${examForm.id}`, examForm);
            } else {
                await api.post('/admin/grades/exams', examForm);
            }
            setIsExamModalOpen(false);
            fetchExams(selectedClass);
        } catch (err) {
            alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu buổi thi');
        }
    };

    const handleDeleteExam = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa buổi thi này và TOÀN BỘ điểm của học sinh?')) return;
        try {
            await api.delete(`/admin/grades/exams/${id}`);
            fetchExams(selectedClass);
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi khi xóa buổi thi');
        }
    };

    const handleOpenGrades = async (exam) => {
        setCurrentExam(exam);
        setIsGradeModalOpen(true);
        setGrades([]);
        try {
            const res = await api.get(`/admin/grades/exams/${exam.id}/grades`);
            setGrades(res.data.map(g => ({
                student_id: g.student_id,
                full_name: g.full_name,
                score: g.score !== null ? g.score : '',
                comment: g.comment || ''
            })));
        } catch (err) {
            console.error('Lỗi lấy danh sách điểm:', err);
            alert('Lỗi lấy danh sách điểm');
        }
    };

    const handleGradeChange = (studentId, field, value) => {
        setGrades(prev => prev.map(g => {
            if (g.student_id === studentId) {
                return { ...g, [field]: value };
            }
            return g;
        }));
    };

    const handleSaveGrades = async () => {
        try {
            setSavingGrades(true);
            const payload = grades.map(g => ({
                student_id: g.student_id,
                score: g.score === '' ? null : Number(g.score),
                comment: g.comment
            }));
            await api.post(`/admin/grades/exams/${currentExam.id}/grades`, { grades: payload });
            alert('Đã lưu điểm thành công!');
            setIsGradeModalOpen(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi khi lưu điểm');
        } finally {
            setSavingGrades(false);
        }
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Quản lý Điểm thi
                    </h1>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">Tạo buổi thi và nhập điểm số cho học sinh lớp bạn quản lý.</p>
                </div>

                <motion.div variants={itemVariants} className="w-full sm:w-auto">
                    <div className="relative">
                        <select
                            className="w-full sm:w-72 pl-4 pr-10 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 appearance-none text-gray-700 dark:text-gray-200 font-medium  transition-all duration-150-shadow"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            {classesTree.length === 0 && <option value="">Chưa có lớp học nào</option>}
                            {classesTree.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -trangray-y-1/2 pointer-events-none text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </motion.div>
            </div>

            {selectedClass ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white dark:bg-gray-900 rounded-2xl  border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                        <h2 className="font-semibold text-gray-800 dark:text-gray-200">Danh sách Buổi thi & Kiểm tra</h2>
                        <button
                            onClick={() => handleOpenExamModal()}
                            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-[13px] px-3.5 py-1.5 text-white px-4 py-2 rounded-lg font-medium transition-all duration-150  text-[13px]"
                        >
                            <Plus size={18} />
                            Thêm Buổi thi
                        </button>
                    </div>
                    {loadingExams ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-medium text-[13px]">
                                        <th className="px-4 py-3 text-[13px] pl-6 whitespace-nowrap">Tên Buổi thi / Bài kiểm tra</th>
                                        <th className="px-4 py-3 text-[13px] whitespace-nowrap">Ngày thi</th>
                                        <th className="px-4 py-3 text-[13px] whitespace-nowrap">Các Lớp tham gia</th>
                                        <th className="px-4 py-3 text-[13px] whitespace-nowrap text-center">Thang điểm</th>
                                        <th className="px-4 py-3 text-[13px] pr-6 whitespace-nowrap text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                    {(!Array.isArray(exams) || exams.length === 0) ? (
                                        <tr>
                                            <td colSpan="5" className="p-12 text-center text-gray-500 dark:text-gray-400">
                                                <ClipboardEdit size={48} className="mx-auto mb-4 opacity-20" />
                                                <p className="text-lg font-medium">Chưa có buổi thi nào cho lớp này.</p>
                                                <button onClick={() => handleOpenExamModal()} className="mt-4 text-gray-900 hover:underline">Tạo mới ngay</button>
                                            </td>
                                        </tr>
                                    ) : (
                                        exams.map(exam => (
                                            <motion.tr
                                                key={exam.id || Math.random()}
                                                className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-all duration-150-colors group"
                                            >
                                                <td className="px-4 py-3 text-[13px] pl-6 font-semibold text-gray-800 dark:text-gray-200">{exam.title || 'Không rõ'}</td>
                                                <td className="px-4 py-3 text-[13px] text-gray-600 dark:text-gray-400">{exam.date ? new Date(exam.date).toLocaleDateString('vi-VN') : 'N/A'}</td>
                                                <td className="px-4 py-3 text-[13px] text-gray-600 dark:text-gray-400 text-[13px] max-w-[200px] truncate" title="Lớp tham gia">
                                                    {(() => {
                                                        let cls = [];
                                                        try {
                                                            cls = Array.isArray(exam.classes) ? exam.classes : (typeof exam.classes === 'string' ? JSON.parse(exam.classes) : []);
                                                        } catch (e) { cls = []; }
                                                        return cls.map(c => (
                                                            <span key={c.id || Math.random()} className="inline-block bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 rounded text-[11px] font-medium border border-gray-100 dark:border-gray-800/50 mr-1 mb-1">
                                                                {c.name || 'Lớp'}
                                                            </span>
                                                        ));
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3 text-[13px]">
                                                    <div className="mx-auto w-10 text-center font-mono opacity-80 text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 rounded py-1">
                                                        {Number(exam.max_score)}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-[13px] pr-6 text-right space-x-2 whitespace-nowrap flex justify-end">
                                                    <button onClick={() => handleOpenGrades(exam)} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-gray-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 rounded-lg transition-all duration-150 text-[13px] font-medium">
                                                        <ClipboardEdit size={16} />
                                                        <span className="hidden sm:inline">Nhập điểm</span>
                                                    </button>
                                                    <button onClick={() => handleOpenExamModal(exam)} className="p-1.5 text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-150" title="Sửa">
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button onClick={() => handleDeleteExam(exam.id)} className="p-1.5 text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-150" title="Xóa">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            ) : (
                <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-2xl  border border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                    <GraduationCap size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-lg">Vui lòng chọn hoặc tạo lớp học trước khi quản lý điểm.</p>
                </div>
            )}

            {/* Modal Tạo/Sửa Buổi Thi */}
            <Modal
                isOpen={isExamModalOpen}
                onClose={() => setIsExamModalOpen(false)}
                title={examForm.id ? 'Sửa Buổi thi' : 'Tạo Buổi thi mới'}
            >
                <form onSubmit={handleSaveExam} className="space-y-4">
                    <div>
                        <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tên Buổi thi / Bài kiểm tra</label>
                        <input type="text" required value={examForm.title} onChange={(e) => setExamForm({ ...examForm, title: e.target.value })} className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 text-gray-800 dark:text-gray-100" placeholder="VD: Khảo sát chất lượng Hóa..." />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ngày thi</label>
                            <input type="date" required value={examForm.date} onChange={(e) => setExamForm({ ...examForm, date: e.target.value })} className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 text-gray-800 dark:text-gray-100" />
                        </div>
                        <div>
                            <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Thang điểm tối đa</label>
                            <input type="number" step="0.25" min="0" required value={examForm.max_score} onChange={(e) => setExamForm({ ...examForm, max_score: e.target.value })} className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 text-gray-800 dark:text-gray-100" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Chọn Lớp tham gia</label>
                        <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2 bg-gray-50/50 dark:bg-gray-900/40">
                            {classesTree.map(c => (
                                <label key={c.id} className="flex items-center space-x-3 cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-150-colors">
                                    <input
                                        type="checkbox"
                                        value={c.id}
                                        checked={examForm.class_ids.includes(c.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setExamForm({ ...examForm, class_ids: [...examForm.class_ids, c.id] });
                                            } else {
                                                setExamForm({ ...examForm, class_ids: examForm.class_ids.filter(id => id !== c.id) });
                                            }
                                        }}
                                        className="w-4 h-4 text-gray-900 bg-white border-gray-300 rounded focus:ring-gray-900 dark:focus:ring-gray-100 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">{c.name}</span>
                                </label>
                            ))}
                        </div>
                        {examForm.class_ids.length === 0 && <p className="text-rose-500 text-[11px] mt-1.5">Vui lòng chọn ít nhất 1 lớp.</p>}
                    </div>
                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button type="button" onClick={() => setIsExamModalOpen(false)} className="px-5 py-2.5 text-[13px] font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-150">Hủy</button>
                        <button type="submit" className="px-5 py-2.5 text-[13px] font-medium bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-[13px] font-medium border border-transparent rounded-lg hover:bg-gray-800 dark:hover:bg-white  transition-all duration-150">Xác nhận</button>
                    </div>
                </form>
            </Modal>

            {/* Modal Nhập điểm */}
            <Modal
                isOpen={isGradeModalOpen && !!currentExam}
                onClose={() => setIsGradeModalOpen(false)}
                title={`Nhập điểm: ${currentExam?.title}`}
            >
                <div className="mb-4">
                    <p className="text-[13px] text-gray-500 dark:text-gray-400">Class filter applied. Thang điểm: <span className="font-mono font-bold text-gray-800 dark:text-white px-1.5 py-0.5 bg-gray-100 dark:bg-gray-900 rounded">{Number(currentExam?.max_score)}</span></p>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 text-[13px] font-medium">
                            <th className="p-3 pl-4 border-b border-gray-200 dark:border-gray-700">Học sinh</th>
                            <th className="p-3 w-32 text-center border-b border-gray-200 dark:border-gray-700">Điểm số</th>
                            <th className="p-3 pr-4 border-b border-gray-200 dark:border-gray-700">Nhận xét (Tuỳ chọn)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                        {grades.length === 0 ? (
                            <tr><td colSpan="3" className="p-8 text-center text-gray-500 dark:text-gray-400">Lớp không có học sinh hoặc đang tải dữ liệu...</td></tr>
                        ) : (
                            grades.map(g => (
                                <tr key={g.student_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                    <td className="p-3 pl-4 font-medium text-gray-800 dark:text-gray-200 text-[13px]">{g.full_name}</td>
                                    <td className="p-3">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max={currentExam.max_score}
                                            value={g.score}
                                            onChange={(e) => handleGradeChange(g.student_id, 'score', e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 text-center font-mono placeholder-gray-300 dark:placeholder-gray-600 text-gray-800 dark:text-gray-100"
                                            placeholder="--/--"
                                        />
                                    </td>
                                    <td className="p-3 pr-4">
                                        <input
                                            type="text"
                                            value={g.comment}
                                            onChange={(e) => handleGradeChange(g.student_id, 'comment', e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 text-[13px] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                            placeholder="Nhập nhận xét..."
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button type="button" onClick={() => setIsGradeModalOpen(false)} className="px-5 py-2.5 text-[13px] font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-150">Đóng</button>
                    <button
                        type="button"
                        onClick={handleSaveGrades}
                        disabled={savingGrades || grades.length === 0}
                        className="px-5 py-2.5 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-[13px] font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-white transition-all duration-150 disabled:opacity-50 flex items-center gap-2"
                    >
                        {savingGrades ? (
                            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-gray-900"></div> Lưu...</>
                        ) : 'Lưu Bảng điểm'}
                    </button>
                </div>
            </Modal>
        </motion.div>
    );
};

export default AdminGrades;
