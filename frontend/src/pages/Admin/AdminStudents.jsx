import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { Edit2, Trash2, UserCheck } from 'lucide-react';

const AdminStudents = () => {
    const [students, setStudents] = useState([]);
    const [classesTree, setClassesTree] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClass, setFilterClass] = useState('ALL');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        full_name: '',
        email: '',
        password: '',
        class_ids: []
    });
    const [error, setError] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [studentsRes, classesRes] = await Promise.all([
                api.get('/admin/students'),
                api.get('/admin/classes')
            ]);
            setStudents(studentsRes.data);
            setClassesTree(classesRes.data);
        } catch (err) {
            console.error("Lỗi lấy dữ liệu:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Derived states for rendering
    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const matchName = student.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchClass = filterClass === 'ALL' || (student.classes && student.classes.some(c => c.id === filterClass));
            return matchName && matchClass;
        });
    }, [students, searchTerm, filterClass]);

    // Group dependencies removed natively from useMemo constraint

    const handleOpenModal = (student = null) => {
        if (student) {
            setEditMode(true);
            setFormData({
                id: student.id,
                full_name: student.name,
                email: student.email,
                password: '',
                class_ids: student.classes ? student.classes.map(c => c.id) : []
            });
        } else {
            setEditMode(false);
            setFormData({
                id: null,
                full_name: '',
                email: '',
                password: '',
                class_ids: []
            });
        }
        setError('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.class_ids.length === 0) {
            setError('Vui lòng chọn ít nhất 1 lớp.');
            return;
        }
        try {
            if (editMode) {
                await api.put(`/admin/students/${formData.id}`, {
                    full_name: formData.full_name,
                    class_ids: formData.class_ids
                });
            } else {
                await api.post('/admin/students', {
                    full_name: formData.full_name,
                    email: formData.email,
                    password: formData.password || '123456',
                    class_ids: formData.class_ids
                });
            }
            handleCloseModal();
            fetchData(); // Reload
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa học sinh này không? Tác vụ này sẽ xóa mọi dữ liệu liên quan.')) return;
        try {
            await api.delete(`/admin/students/${id}`);
            fetchData(); // Reload
        } catch (err) {
            alert(err.response?.data?.message || 'Không thể xóa học sinh này');
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
                    Quản lý Học sinh
                </h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-gray-900 hover:bg-gray-800 text-[13px] text-white px-3.5 py-2 rounded-md font-medium transition-all duration-150"
                >
                    + Thêm Học sinh
                </button>
            </div>

            <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 p-6 rounded-lg  border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-6 mb-6">
                <input
                    type="text"
                    placeholder="Tìm theo tên học sinh..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-gray-700 dark:text-white"
                />
                <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 bg-white dark:bg-gray-700 dark:text-white"
                >
                    <option value="ALL">Tất cả các lớp</option>
                    {classesTree.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </motion.div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                                <th className="px-4 py-3 text-[13px]">Tên Học sinh</th>
                                <th className="px-4 py-3 text-[13px]">Email</th>
                                <th className="px-4 py-3 text-[13px]">Mật khẩu</th>
                                <th className="px-4 py-3 text-[13px]">Lớp</th>
                                <th className="px-4 py-3 text-[13px] text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-6 text-center text-gray-500 dark:text-gray-400">Không tìm thấy học sinh nào</td>
                                </tr>
                            ) : (
                                filteredStudents.map((std) => (
                                    <tr key={std.id} className="border-b border-gray-200 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-all duration-150">
                                        <td className="px-4 py-3 text-[13px] font-semibold text-gray-800 dark:text-gray-200">{std.name}</td>
                                        <td className="px-4 py-3 text-[13px] text-gray-600 dark:text-gray-400 truncate max-w-[150px]" title={std.email}>{std.email}</td>
                                        <td className="px-4 py-3 text-[13px] text-gray-600 dark:text-gray-400">{std.password || '123456'}</td>
                                        <td className="px-4 py-3 text-[13px]">
                                            <div className="flex flex-wrap gap-1">
                                                {std.classes && std.classes.length > 0 ? std.classes.map(c => (
                                                    <span key={c.id} className="inline-block bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 rounded-md text-[11px] font-medium border border-gray-100 dark:border-gray-800/50">{c.name}</span>
                                                )) : <span className="text-gray-400 italic text-[11px]">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-[13px] text-center whitespace-nowrap">
                                            <div className="flex justify-center items-center gap-2">
                                                <button onClick={() => handleOpenModal(std)} className="p-1.5 text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-150" title="Sửa">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(std.id)} className="p-1.5 text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-150" title="Xóa">
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
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{editMode ? 'Cập nhật Học sinh' : 'Thêm Học sinh mới'}</h2>
                        {error && <p className="text-red-500 bg-red-50 dark:bg-red-500/10 p-2 rounded mb-4">{error}</p>}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Họ và Tên</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            {!editMode && (
                                <>
                                    <div>
                                        <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Mật khẩu (Trống = mặc định 123456)</label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Lớp Học <span className="text-[11px] text-gray-400 font-normal">(chọn nhiều lớp)</span></label>
                                <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2 bg-white dark:bg-gray-700">
                                    {classesTree.map(c => (
                                        <label key={c.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-1.5 rounded-lg transition-all duration-150-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.class_ids.includes(c.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setFormData({ ...formData, class_ids: [...formData.class_ids, c.id] });
                                                    } else {
                                                        setFormData({ ...formData, class_ids: formData.class_ids.filter(id => id !== c.id) });
                                                    }
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-gray-800"
                                            />
                                            <span className="text-[13px] text-gray-700 dark:text-gray-200">{c.name}</span>
                                        </label>
                                    ))}
                                </div>
                                {formData.class_ids.length === 0 && <p className="text-[11px] text-rose-500 mt-1">Vui lòng chọn ít nhất 1 lớp</p>}
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-150">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-[13px] font-medium border border-transparent rounded-lg hover:bg-gray-800 dark:hover:bg-white transition-all duration-150">
                                    {editMode ? 'Lưu thay đổi' : 'Hoàn tất'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default AdminStudents;
