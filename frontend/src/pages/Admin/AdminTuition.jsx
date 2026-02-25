import { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { BadgeDollarSign, Banknote, CreditCard } from 'lucide-react';

const AdminTuition = () => {
    const [classesTree, setClassesTree] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [tuitions, setTuitions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal Create Batch
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ title: '', amount: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchClasses();
    }, []);

    // 2️⃣ FE CHECK: useEffect dependency [selectedClassId]
    useEffect(() => {
        console.log('FE DEBUG: selectedClassId changed:', selectedClassId);
        if (selectedClassId) {
            fetchBatches(selectedClassId);
            setSelectedBatch(null);
            setTuitions([]);
        } else {
            console.log('FE DEBUG: Resetting batches because no class selected');
            setBatches([]);
        }
    }, [selectedClassId]);

    useEffect(() => {
        if (selectedBatch) {
            console.log('FE DEBUG: selectedBatch changed to:', selectedBatch.id);
            fetchTuitions(selectedBatch.id);
        } else {
            setTuitions([]);
        }
    }, [selectedBatch]);

    const fetchClasses = async () => {
        try {
            console.log('FE DEBUG: Fetching classes...');
            const res = await api.get('/admin/classes');
            setClassesTree(res.data);
        } catch (err) {
            console.error('Lỗi lấy danh sách lớp:', err);
        }
    };

    const fetchBatches = async (classId) => {
        try {
            setLoading(true);
            console.log('FE DEBUG: Calling API GET /admin/tuition-batches/' + classId);
            const res = await api.get(`/admin/tuition-batches/${classId}`);
            console.log('FE DEBUG: Received batches:', res.data);
            setBatches(res.data);

            // Auto-select first batch if available and none selected
            if (res.data && res.data.length > 0 && !selectedBatch) {
                console.log('FE DEBUG: Auto-selecting first batch:', res.data[0].id);
                setSelectedBatch(res.data[0]);
            }
        } catch (err) {
            console.error('Lỗi lấy đợt thu:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTuitions = async (batchId) => {
        try {
            setLoading(true);
            console.log('FE DEBUG: Calling API GET /admin/tuitions/' + batchId);
            const res = await api.get(`/admin/tuitions/${batchId}`);
            setTuitions(res.data);
        } catch (err) {
            console.error('Lỗi lấy ds học sinh:', err);
        } finally {
            setLoading(false);
        }
    };

    // 3️⃣ FE CHECK: handleCreateBatch and reload
    const handleCreateBatch = async (e) => {
        e.preventDefault();
        console.log('FE DEBUG: handleCreateBatch called', { selectedClassId, formData });
        if (!selectedClassId) return setError('Vui lòng chọn lớp trước');
        if (!formData.title || !formData.amount) return setError('Vui lòng điền đủ thông tin');

        try {
            const res = await api.post('/admin/tuition-batches', {
                title: formData.title,
                class_id: selectedClassId,
                amount: parseFloat(formData.amount)
            });
            console.log('FE DEBUG: Batch created response:', res.data);
            setIsModalOpen(false);
            setFormData({ title: '', amount: '' });

            // Reload batches and select the newly created one
            console.log('FE DEBUG: Reloading batches for class:', selectedClassId);
            const reloadRes = await api.get(`/admin/tuition-batches/${selectedClassId}`);
            console.log('FE DEBUG: Reloaded batches:', reloadRes.data);
            setBatches(reloadRes.data);

            // If the backend returns the new batch, select it immediately
            if (res.data.batch) {
                console.log('FE DEBUG: Setting selectedBatch to new batch:', res.data.batch.id);
                setSelectedBatch(res.data.batch);
            } else {
                fetchBatches(selectedClassId);
            }

            alert('Tạo đợt thu thành công');
        } catch (err) {
            console.error('FE DEBUG: Create batch error:', err);
            setError(err.response?.data?.message || 'Lỗi khi tạo đợt thu');
        }
    };

    const handleMarkPaid = async (tuitionId) => {
        try {
            await api.put(`/admin/tuitions/${tuitionId}/pay`);
            // Update UI
            setTuitions(prev => prev.map(t => t.id === tuitionId ? { ...t, status: 'paid', paid_at: new Date().toISOString() } : t));
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi cập nhật');
        }
    };

    const handleUnpay = async (tuitionId) => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy trạng thái đã nộp tiền của học sinh này?')) return;
        try {
            await api.put(`/admin/tuitions/${tuitionId}/unpay`);
            // Update UI
            setTuitions(prev => prev.map(t => t.id === tuitionId ? { ...t, status: 'unpaid', paid_at: null } : t));
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi cập nhật');
        }
    };

    const handleDeleteBatch = async (batchId) => {
        if (!window.confirm('CẢNH BÁO: Xóa đợt thu này sẽ xóa toàn bộ dữ liệu học phí (kể cả những bạn đã nộp) của đợt này. Bạn có chắc chắn?')) return;
        try {
            await api.delete(`/admin/tuition-batches/${batchId}`);
            // Update UI
            setBatches(prev => prev.filter(b => b.id !== batchId));
            if (selectedBatch && selectedBatch.id === batchId) {
                setSelectedBatch(null);
                setTuitions([]);
            }
            alert('Đã xóa đợt thu thành công');
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi khi xóa đợt thu');
        }
    };

    // Calculations
    const totalExpected = selectedBatch ? tuitions.length * selectedBatch.amount : 0;
    const paidCount = tuitions.filter(t => t.status === 'paid').length;
    const totalCollected = selectedBatch ? paidCount * selectedBatch.amount : 0;
    const totalRemaining = totalExpected - totalCollected;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-6xl p-6 space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                    Quản lý Học phí
                </h1>
                {selectedClassId && (
                    <button onClick={() => setIsModalOpen(true)} className="bg-gray-900 hover:bg-gray-800 text-[13px] text-white px-3.5 py-2 rounded-md font-medium transition-all duration-150">
                        + Tạo đợt thu mới
                    </button>
                )}
            </div>

            {/* Bước 1: Chọn Lớp */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 p-6 rounded-lg  border border-gray-200 dark:border-gray-800 mb-6">
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">1. Chọn Lớp Học</label>
                <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full max-w-sm px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 bg-white dark:bg-gray-700 dark:text-white"
                >
                    <option value="">-- Chọn 1 Lớp --</option>
                    {classesTree.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </motion.div>

            {selectedClassId && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-6"
                >
                    {/* Bước 2: Xem các đợt thu */}
                    <div className="md:col-span-1 border-r border-gray-200 dark:border-gray-800 pr-4">
                        <h2 className="text-lg font-semibold tracking-tight text-gray-800 dark:text-white mb-4">2. Các đợt thu</h2>
                        {loading && !selectedBatch ? (
                            <div className="flex h-32 items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {batches.length === 0 ? <p className="text-gray-500 dark:text-gray-400 text-[13px] italic">Chưa có đợt thu nào</p> : batches.map(batch => (
                                    <div key={batch.id} className={`flex items-stretch w-full rounded-lg border transition-all duration-150 overflow-hidden ${selectedBatch?.id === batch.id ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white shadow-sm font-medium' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 text-gray-700 dark:text-gray-300'}`}>
                                        <button
                                            onClick={() => setSelectedBatch(batch)}
                                            className="flex-1 text-left p-3 min-w-0"
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="font-semibold truncate min-w-0">{batch.title}</div>
                                                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                                                    {batch.student_count || 0} hs
                                                </span>
                                            </div>
                                            <div className="text-[13px] opacity-80 mt-1">{parseInt(batch.amount).toLocaleString('vi-VN')} ₫</div>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteBatch(batch.id); }}
                                            className="px-4 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/50 dark:hover:bg-gray-700 transition-all duration-150-colors"
                                            title="Xóa đợt thu"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bước 3: Xem danh sách học sinh theo đợt */}
                    <div className="md:col-span-3 pb-8">
                        {selectedBatch ? (
                            <>
                                <h2 className="text-lg font-semibold tracking-tight text-gray-800 dark:text-white mb-4 truncate">3. Danh sách đóng tiền: <span className="text-gray-900 dark:text-white font-black">{selectedBatch.title}</span></h2>

                                {/* Thống kê */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                    <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                <Banknote size={16} />
                                                <span className="text-[13px] font-medium text-nowrap">Đã thu</span>
                                            </div>
                                            <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">Paid</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalCollected.toLocaleString('vi-VN')}</span>
                                            <span className="text-gray-400 dark:text-gray-500 font-medium text-sm">₫</span>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                <CreditCard size={16} />
                                                <span className="text-[13px] font-medium text-nowrap">Chưa thu</span>
                                            </div>
                                            <span className="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full">Unpaid</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalRemaining.toLocaleString('vi-VN')}</span>
                                            <span className="text-gray-400 dark:text-gray-500 font-medium text-sm">₫</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bảng học sinh */}
                                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50/50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-medium text-[13px]">
                                                <th className="px-4 py-3 text-[13px]">Tên học sinh</th>
                                                <th className="px-4 py-3 text-[13px] text-center">Trạng thái</th>
                                                <th className="px-4 py-3 text-[13px] text-right">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tuitions.length === 0 ? <tr><td colSpan="3" className="p-6 text-center text-gray-500 dark:text-gray-400 italic">Đợt thu này chưa có thành viên nào. <br />(Hãy kiểm tra lại việc xếp lớp/nhóm của học sinh)</td></tr> : tuitions.map(t => (
                                                <tr key={t.id} className="border-b border-gray-200 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-all duration-150">
                                                    <td className="px-4 py-3 text-[13px] font-semibold text-gray-800 dark:text-gray-200">{t.student_name}</td>
                                                    <td className="px-4 py-3 text-[13px] text-center">
                                                        {t.status === 'paid' ? (
                                                            <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-3 py-1 rounded-full text-[13px] font-medium border border-emerald-100 dark:border-emerald-500/30">Đã Nộp</span>
                                                        ) : (
                                                            <span className="bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 px-3 py-1 rounded-full text-[13px] font-medium border border-rose-100 dark:border-rose-500/30">Chưa Nộp</span>
                                                        )}
                                                        {t.paid_at && <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 italic">{new Date(t.paid_at).toLocaleDateString('vi-VN')}</div>}
                                                    </td>
                                                    <td className="px-4 py-3 text-[13px] text-right">
                                                        {t.status === 'unpaid' ? (
                                                            <button
                                                                onClick={() => handleMarkPaid(t.id)}
                                                                className="px-3 py-1 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 rounded hover:bg-gray-800 dark:hover:bg-white transition-all duration-150 text-[13px] font-medium"
                                                            >
                                                                Đánh dấu Đã Nộp
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleUnpay(t.id)}
                                                                className="px-3 py-1 bg-white border border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-150 text-[13px] font-medium"
                                                            >
                                                                Hủy
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-center p-8">
                                <span>Vui lòng chọn 1 đợt thu bên trái để xem chi tiết danh sách học sinh</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Modal Tạo đợt thu */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-[2px] flex items-center justify-center p-6 z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 w-full max-w-sm p-6">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Tạo Đợt thu mới</h2>
                        {error && <p className="text-red-500 bg-red-50 dark:bg-red-500/10 p-2 rounded mb-4 text-[13px]">{error}</p>}
                        <form onSubmit={handleCreateBatch} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Tên đợt (VD: Tháng 1, Lần 1...)</label>
                                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Số tiền mỗi học sinh (VND)</label>
                                <input type="number" required min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-150">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-[13px] font-medium border border-transparent rounded-lg hover:bg-gray-800 dark:hover:bg-white transition-all duration-150">Tạo ngay</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default AdminTuition;
