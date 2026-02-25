import { useState } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const [formData, setFormData] = useState({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });

        if (formData.new_password && formData.new_password !== formData.confirm_password) {
            return setStatus({ type: 'error', message: 'Mật khẩu mới không khớp' });
        }

        try {
            setLoading(true);
            const res = await api.put('/auth/profile', {
                full_name: formData.full_name,
                email: formData.email,
                phone: user.role === 'STUDENT' ? formData.phone : undefined,
                current_password: formData.current_password,
                new_password: formData.new_password || undefined
            });

            setStatus({ type: 'success', message: 'Cập nhật thành công!' });

            // Update local storage user
            const updatedUser = { ...user, ...res.data.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Allow success message to show then Reset password fields
            setFormData(prev => ({
                ...prev,
                current_password: '',
                new_password: '',
                confirm_password: ''
            }));

        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.message || 'Có lỗi xảy ra' });
        } finally {
            setLoading(false);
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
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-2xl mx-auto">
            <motion.h1 variants={itemVariants} className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-6">
                Cài đặt Tài khoản
            </motion.h1>

            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                {status.message && (
                    <div className={`p-4 mb-6 rounded-lg ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">Họ và Tên</label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-slate-700 dark:text-white"
                            />
                        </div>

                        {user.role === 'STUDENT' && (
                            <div>
                                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">Số Điện thoại</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-slate-700 dark:text-white"
                                />
                            </div>
                        )}
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6">
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Đổi Mật khẩu</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">Mật khẩu Hiện tại (Bắt buộc để lưu)</label>
                                <input
                                    type="password"
                                    name="current_password"
                                    value={formData.current_password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Nhập mật khẩu hiện tại"
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-slate-700 dark:text-white"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">Mật khẩu Mới</label>
                                    <input
                                        type="password"
                                        name="new_password"
                                        value={formData.new_password}
                                        onChange={handleChange}
                                        minLength="6"
                                        placeholder="Bỏ trống nếu không đổi"
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-slate-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">Xác nhận Mật khẩu Mới</label>
                                    <input
                                        type="password"
                                        name="confirm_password"
                                        value={formData.confirm_password}
                                        onChange={handleChange}
                                        minLength="6"
                                        placeholder="Xác nhận mật khẩu mới"
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-slate-700 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 px-6 py-2 rounded-lg font-medium transition hover:bg-gray-800 dark:hover:bg-white disabled:opacity-50 text-[13px]"
                        >
                            {loading ? 'Đang lưu...' : 'Lưu Thay đổi'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default Settings;
