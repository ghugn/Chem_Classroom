import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Edit2, Trash2, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminDocuments = () => {
    const [documents, setDocuments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClass, setFilterClass] = useState('ALL');
    const [filterSubject, setFilterSubject] = useState('ALL');
    const [classesTree, setClassesTree] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ id: null, title: '', description: '', class_id: '', subject_id: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [docsRes, classesRes, subjectsRes] = await Promise.all([
                api.get('/admin/documents'),
                api.get('/admin/classes'),
                api.get('/subjects')
            ]);
            setDocuments(docsRes.data);
            setClassesTree(classesRes.data);
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

    const handleOpenModal = (doc = null) => {
        if (doc) {
            setEditMode(true);
            setFormData({ id: doc.id, title: doc.title, description: doc.description || '', class_id: doc.class_id || '', subject_id: doc.subject_id || '' });
            setSelectedFile(null); // File is not editable once uploaded, user can delete and re-upload if needed, based on UI requirements "Edit: Title, description, Select class"
        } else {
            setEditMode(false);
            setFormData({ id: null, title: '', description: '', class_id: '', subject_id: '' });
            setSelectedFile(null);
        }
        setError('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('class_id', formData.class_id);
            if (formData.subject_id) {
                data.append('subject_id', formData.subject_id);
            }

            if (selectedFile) {
                data.append('file', selectedFile);
            }

            if (editMode) {
                await api.put(`/admin/documents/${formData.id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/admin/documents', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            handleCloseModal();
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return;
        try {
            await api.delete(`/admin/documents/${id}`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi khi xóa tài liệu');
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
            <div className="flex flex-col gap-6 mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Quản lý Tài liệu
                    </h1>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full">
                    <div className="relative w-full sm:w-auto min-w-[180px]">
                        <select
                            className="w-full pl-3 pr-8 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 appearance-none bg-white dark:bg-gray-700 font-medium text-gray-600 dark:text-gray-200"
                            value={filterSubject}
                            onChange={(e) => setFilterSubject(e.target.value)}
                        >
                            <option value="ALL">Tất cả loại tài liệu</option>
                            <option value="UNASSIGNED">Chưa phân loại</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="relative w-full sm:w-auto min-w-[180px]">
                        <select
                            className="w-full pl-3 pr-8 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 appearance-none bg-white dark:bg-gray-700 font-medium text-gray-600 dark:text-gray-200"
                            value={filterClass}
                            onChange={(e) => setFilterClass(e.target.value)}
                        >
                            <option value="ALL">Tất cả các lớp</option>
                            <option value="GENERAL">Dành cho mọi học sinh</option>
                            {classesTree.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="relative w-full sm:w-auto flex-1 min-w-[200px]">
                        <input
                            type="text"
                            placeholder="Tìm kiếm tài liệu..."
                            className="pl-4 pr-4 py-2 w-full border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 transition-all duration-150-shadow dark:bg-gray-700 dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={() => handleOpenModal()} className="bg-gray-900 hover:bg-gray-800 text-[13px] px-3.5 py-1.5 text-white px-4 py-2 rounded-lg font-medium transition-all duration-150 whitespace-nowrap">
                        + Upload Tài liệu
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-medium text-[13px]">
                                <th className="px-4 py-3 text-[13px]">Tên Tài liệu</th>
                                <th className="px-4 py-3 text-[13px]">Loại tài liệu</th>
                                <th className="px-4 py-3 text-[13px]">Lớp Học</th>
                                <th className="px-4 py-3 text-[13px]">Ngày Upload</th>
                                <th className="px-4 py-3 text-[13px] text-center">Tải xuống</th>
                                <th className="px-4 py-3 text-[13px] text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents
                                .filter(doc => filterSubject === 'ALL' || (filterSubject === 'UNASSIGNED' ? !doc.subject_id : doc.subject_id === filterSubject))
                                .filter(doc => filterClass === 'ALL' || (filterClass === 'GENERAL' ? !doc.class_id : doc.class_id === filterClass))
                                .filter(doc => doc.title.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                                <tr><td colSpan="6" className="p-6 text-center text-gray-500 dark:text-gray-400 cursor-default">Không có tài liệu nào phù hợp với bộ lọc</td></tr>
                            ) : documents
                                .filter(doc => filterSubject === 'ALL' || (filterSubject === 'UNASSIGNED' ? !doc.subject_id : doc.subject_id === filterSubject))
                                .filter(doc => filterClass === 'ALL' || (filterClass === 'GENERAL' ? !doc.class_id : doc.class_id === filterClass))
                                .filter(doc => doc.title.toLowerCase().includes(searchTerm.toLowerCase())).map((doc) => (
                                    <tr key={doc.id} className="border-b border-gray-200 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-all duration-150-colors">
                                        <td className="px-4 py-3 text-[13px] font-semibold text-gray-800 dark:text-gray-200">
                                            <div className="flex flex-col">
                                                <span>{doc.title}</span>
                                                {doc.description && <span className="text-[13px] font-normal text-gray-500 dark:text-gray-400">{doc.description}</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-[13px]">
                                            {doc.subject_name ? (
                                                <span className="bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap border border-gray-100 dark:border-gray-800/50">
                                                    {doc.subject_name}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-[13px] italic">Chưa phân loại</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-[13px] text-gray-900 dark:text-gray-300 font-medium">{doc.class_name || 'Tất cả các lớp'}</td>
                                        <td className="px-4 py-3 text-[13px] text-gray-600 dark:text-gray-400">{new Date(doc.created_at).toLocaleDateString('vi-VN')}</td>
                                        <td className="px-4 py-3 text-[13px] text-center">
                                            {doc.file_url ? (
                                                <a href={`http://localhost:5000${doc.file_url}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all duration-150 text-[11px] font-medium border border-indigo-100 dark:border-indigo-500/30">Download</a>
                                            ) : (
                                                <span className="text-[11px] text-gray-400 italic">Không có file</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-[13px] text-center whitespace-nowrap">
                                            <div className="flex justify-center items-center gap-2">
                                                <button onClick={() => handleOpenModal(doc)} className="p-1.5 text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-150" title="Sửa">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-150" title="Xóa">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </motion.div>
            )
            }

            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-[2px] flex items-center justify-center p-6 z-50">
                        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{editMode ? 'Cập nhật' : 'Upload'} Tài liệu</h2>
                            {error && <p className="text-red-500 bg-red-50 dark:bg-red-500/10 p-2 rounded mb-4">{error}</p>}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Tiêu đề</label>
                                    <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Mô tả (Không bắt buộc)</label>
                                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-gray-700 dark:text-white" rows="3"></textarea>
                                </div>
                                <div>
                                    <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Loại tài liệu (Tuỳ chọn)</label>
                                    <select value={formData.subject_id} onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 bg-white dark:bg-gray-700 dark:text-white">
                                        <option value="">-- Chưa phân loại --</option>
                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Gán cho Lớp (Tuỳ chọn)</label>
                                    <select value={formData.class_id} onChange={(e) => setFormData({ ...formData, class_id: e.target.value })} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 bg-white dark:bg-gray-700 dark:text-white">
                                        <option value="">-- Dành cho mọi học sinh --</option>
                                        {classesTree.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">
                                        {editMode ? 'Chọn File đính kèm mới (Tuỳ chọn)' : 'Chọn File đính kèm (Tuỳ chọn)'}
                                    </label>
                                    <input type="file" onChange={handleFileChange} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-150">Hủy</button>
                                    <button type="submit" className="px-4 py-2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-[13px] font-medium border border-transparent rounded-lg hover:bg-gray-800 dark:hover:bg-white transition-all duration-150">Lưu</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </motion.div >
    );
};

export default AdminDocuments;
