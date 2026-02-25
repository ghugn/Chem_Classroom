import { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Users } from 'lucide-react';

const AdminClasses = () => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ id: null, name: '', fee: 0, scheduleDay: 'Thứ 2', scheduleStart: '18:00', scheduleEnd: '19:30' });
    const [error, setError] = useState('');

    // Class Students State
    const [selectedClass, setSelectedClass] = useState(null);
    const [classStudents, setClassStudents] = useState([]);
    const [isPnlLoading, setIsPnlLoading] = useState(false);

    // Add Student to Class Modal State
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [addStudentError, setAddStudentError] = useState('');

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/classes');
            setClasses(res.data);
        } catch (err) {
            console.error("Lỗi lấy danh sách lớp:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    const handleOpenModal = (cls = null) => {
        if (cls) {
            setEditMode(true);
            let day = 'Thứ 2';
            let start = '18:00';
            let end = '19:30';
            if (cls.schedule) {
                const match = cls.schedule.match(/^(.*?) \((.*?) - (.*?)\)$/);
                if (match) {
                    day = match[1];
                    start = match[2];
                    end = match[3];
                }
            }
            setFormData({ id: cls.id, name: cls.name, fee: cls.fee || 0, scheduleDay: day, scheduleStart: start, scheduleEnd: end });
        } else {
            setEditMode(false);
            setFormData({ id: null, name: '', fee: 0, scheduleDay: 'Thứ 2', scheduleStart: '18:00', scheduleEnd: '19:30' });
        }
        setError('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleClassClick = async (cls) => {
        setSelectedClass(cls);
        try {
            setIsPnlLoading(true);
            const res = await api.get(`/admin/classes/${cls.id}/students`);
            setClassStudents(res.data);
        } catch (err) {
            console.error("Lỗi lấy danh sách học sinh của lớp:", err);
            alert("Không thể tải danh sách học sinh.");
            setSelectedClass(null);
        } finally {
            setIsPnlLoading(false);
        }
    };

    const handleCloseClassPanel = () => {
        setSelectedClass(null);
        setClassStudents([]);
    };

    const handleOpenAddStudentModal = async () => {
        setSelectedStudentIds([]);
        setStudentSearchTerm('');
        setAddStudentError('');
        try {
            // Fetch all students
            const allRes = await api.get('/admin/students');
            // Filter out students already in this class
            const currentIds = classStudents.map(s => s.id);
            const available = allRes.data.filter(s => !currentIds.includes(s.id));
            setAvailableStudents(available);
        } catch (err) {
            setAvailableStudents([]);
        }
        setIsAddStudentModalOpen(true);
    };

    const handleCloseAddStudentModal = () => setIsAddStudentModalOpen(false);

    const handleAddStudentSubmit = async () => {
        if (selectedStudentIds.length === 0) {
            setAddStudentError('Vui lòng chọn ít nhất 1 học sinh.');
            return;
        }
        try {
            // Add each selected student to class
            for (const sid of selectedStudentIds) {
                await api.post(`/admin/classes/${selectedClass.id}/students`, { student_id: sid });
            }
            handleCloseAddStudentModal();
            // Reload students for this class
            const res = await api.get(`/admin/classes/${selectedClass.id}/students`);
            setClassStudents(res.data);
            fetchClasses();
        } catch (err) {
            setAddStudentError(err.response?.data?.message || 'Có lỗi xảy ra khi thêm học sinh');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formattedSchedule = `${formData.scheduleDay} (${formData.scheduleStart} - ${formData.scheduleEnd})`;
            if (editMode) {
                await api.put(`/admin/classes/${formData.id}`, { name: formData.name, fee: parseFloat(formData.fee), schedule: formattedSchedule });
            } else {
                await api.post('/admin/classes', { name: formData.name, fee: parseFloat(formData.fee), schedule: formattedSchedule });
            }
            handleCloseModal();
            fetchClasses(); // Reload 
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa lớp học này không?')) return;

        try {
            await api.delete(`/admin/classes/${id}`);
            fetchClasses(); // Reload
        } catch (err) {
            alert(err.response?.data?.message || 'Không thể xóa lớp học này');
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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                    Quản lý Lớp học
                </h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-gray-900 hover:bg-gray-800 text-white text-[13px] px-3.5 py-2 rounded-md font-medium transition-all duration-150"
                >
                    + Thêm Lớp
                </button>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                                <th className="px-4 py-3 text-[13px]">Tên lớp</th>
                                <th className="px-4 py-3 text-[13px]">Số đợt thu</th>
                                <th className="px-4 py-3 text-[13px] text-center">Số học sinh</th>
                                <th className="px-4 py-3 text-[13px]">Thời gian học</th>
                                <th className="px-4 py-3 text-[13px] text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classes.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-6 text-center text-gray-500 dark:text-gray-400">Chưa có lớp học nào</td>
                                </tr>
                            ) : (
                                classes.map((cls) => (
                                    <tr key={cls.id} className="border-b border-gray-200 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-all duration-150">
                                        <td className="px-4 py-3 text-[13px] font-semibold text-gray-800 dark:text-gray-200">{cls.name}</td>
                                        <td className="px-4 py-3 text-[13px] text-gray-900 dark:text-gray-100 font-medium">{Number(cls.tuition_batch_count) || 0}</td>
                                        <td className="px-4 py-3 text-[13px] text-center text-gray-600 dark:text-gray-400">{cls.student_count || 0}</td>
                                        <td className="px-4 py-3 text-[13px] text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{cls.schedule || '-'}</td>
                                        <td className="px-4 py-3 text-[13px] text-center whitespace-nowrap">
                                            <div className="flex justify-center items-center gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); handleClassClick(cls); }} className="px-3 py-1 bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-150 text-[13px] font-medium">
                                                    Xem DS
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenModal(cls); }} className="p-1.5 text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-150" title="Sửa">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(cls.id); }} className="p-1.5 text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-150" title="Xóa">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </motion.div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-[2px] flex items-center justify-center p-6 z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 w-full max-w-md p-6">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{editMode ? 'Sửa thông tin Lớp' : 'Thêm Lớp học mới'}</h2>
                        {error && <p className="text-red-500 bg-red-50 dark:bg-red-500/10 text-[13px] p-2 rounded mb-4">{error}</p>}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Tên Lớp</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-gray-700 dark:text-white"
                                    placeholder="VD: Hóa 12 - Ôn Thi THPT..."
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Học phí (VND)</label>
                                <input
                                    type="number"
                                    min="0"
                                    required
                                    value={formData.fee}
                                    onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Ngày học</label>
                                    <select
                                        value={formData.scheduleDay}
                                        onChange={(e) => setFormData({ ...formData, scheduleDay: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 bg-white dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="Thứ 2">Thứ 2</option>
                                        <option value="Thứ 3">Thứ 3</option>
                                        <option value="Thứ 4">Thứ 4</option>
                                        <option value="Thứ 5">Thứ 5</option>
                                        <option value="Thứ 6">Thứ 6</option>
                                        <option value="Thứ 7">Thứ 7</option>
                                        <option value="Chủ nhật">Chủ nhật</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Giờ bắt đầu</label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.scheduleStart}
                                        onChange={(e) => setFormData({ ...formData, scheduleStart: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Giờ kết thúc</label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.scheduleEnd}
                                        onChange={(e) => setFormData({ ...formData, scheduleEnd: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-150">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-[13px] font-medium border border-transparent rounded-lg hover:bg-gray-800 dark:hover:bg-white transition-all duration-150">
                                    {editMode ? 'Lưu thay đổi' : 'Thêm lớp'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Class Students Panel */}
            {selectedClass && (
                <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-[2px] flex items-center justify-center p-6 z-40">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 w-full max-w-4xl p-6 max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Danh sách Học sinh lớp: {selectedClass.name}</h2>
                            <button onClick={handleCloseClassPanel} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-150">
                                Đóng
                            </button>
                        </div>

                        <div className="mb-4">
                            <button
                                onClick={handleOpenAddStudentModal}
                                className="px-3.5 py-2 bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-150 text-[13px] font-medium"
                            >
                                + Thêm Học sinh vào lớp
                            </button>
                        </div>

                        {isPnlLoading ? (
                            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>
                        ) : (
                            <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-lg">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-medium sticky top-0">
                                            <th className="px-4 py-3 text-[13px]">Tên Học sinh</th>
                                            <th className="px-4 py-3 text-[13px]">Email</th>
                                            <th className="px-4 py-3 text-[13px]">Mật khẩu</th>
                                            <th className="px-4 py-3 text-[13px] text-center">Học phí</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {classStudents.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="p-6 text-center text-gray-500 dark:text-gray-400">Lớp chưa có học sinh nào</td>
                                            </tr>
                                        ) : (
                                            classStudents.map(std => (
                                                <tr key={std.id} className="border-b border-gray-200 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-all duration-150">
                                                    <td className="px-4 py-3 text-[13px] font-semibold text-gray-800 dark:text-gray-200">{std.name}</td>
                                                    <td className="px-4 py-3 text-[13px] text-gray-600 dark:text-gray-400">{std.email}</td>
                                                    <td className="px-4 py-3 text-[13px] text-gray-600 dark:text-gray-400">{std.password}</td>
                                                    <td className="px-4 py-3 text-[13px] text-center">
                                                        {Number(std.unpaid_count) === 0 ? (
                                                            <span className="bg-gray-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 px-3 py-1 rounded-full text-[13px] font-medium">Nộp đủ</span>
                                                        ) : (
                                                            <span className="bg-gray-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 px-3 py-1 rounded-full text-[13px] font-medium">Thiếu {std.unpaid_count} buổi</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add Student to Class Modal */}
            {isAddStudentModalOpen && (
                <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-[2px] flex items-center justify-center p-6 z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 w-full max-w-md p-6 max-h-[85vh] flex flex-col">
                        <h2 className="text-lg font-semibold tracking-tight text-gray-800 dark:text-white mb-3">Thêm học sinh vào lớp: {selectedClass?.name}</h2>
                        {addStudentError && <p className="text-red-500 bg-red-50 dark:bg-red-500/10 p-2 rounded mb-3 text-[13px]">{addStudentError}</p>}
                        <input
                            type="text"
                            placeholder="Tìm tên học sinh..."
                            value={studentSearchTerm}
                            onChange={(e) => setStudentSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-gray-700 dark:text-white mb-3"
                        />
                        <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-lg">
                            {availableStudents
                                .filter(s => s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()))
                                .length === 0 ? (
                                <p className="p-6 text-center text-gray-400 text-[13px]">Không tìm thấy học sinh nào</p>
                            ) : (
                                availableStudents
                                    .filter(s => s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()))
                                    .map(s => (
                                        <label key={s.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-800 last:border-0 transition-all duration-150-colors">
                                            <input
                                                type="checkbox"
                                                checked={selectedStudentIds.includes(s.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedStudentIds([...selectedStudentIds, s.id]);
                                                    } else {
                                                        setSelectedStudentIds(selectedStudentIds.filter(id => id !== s.id));
                                                    }
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-gray-800"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">{s.name}</p>
                                                <p className="text-[11px] text-gray-400 truncate">{s.email}</p>
                                            </div>
                                        </label>
                                    ))
                            )}
                        </div>
                        {selectedStudentIds.length > 0 && (
                            <p className="text-[11px] text-gray-900 dark:text-gray-100 mt-2">Đã chọn {selectedStudentIds.length} học sinh</p>
                        )}
                        <div className="flex justify-end space-x-3 mt-4">
                            <button type="button" onClick={handleCloseAddStudentModal} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-150">Hủy</button>
                            <button
                                type="button"
                                onClick={handleAddStudentSubmit}
                                disabled={selectedStudentIds.length === 0}
                                className="px-4 py-2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-[13px] font-medium border border-transparent rounded-lg hover:bg-gray-800 dark:hover:bg-white transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Thêm {selectedStudentIds.length > 0 ? `(${selectedStudentIds.length})` : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default AdminClasses;
