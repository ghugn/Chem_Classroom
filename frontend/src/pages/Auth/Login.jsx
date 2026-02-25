import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { LogIn } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', formData);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            if (res.data.user.role === 'ADMIN') {
                navigate('/admin');
            } else {
                navigate('/student');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center transition-colors duration-200">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-slate-100 dark:border-slate-700">
                <h2 className="text-3xl font-bold mb-6 text-center text-slate-800 dark:text-white flex items-center justify-center gap-3">
                    <div className="p-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl">
                        <LogIn size={28} />
                    </div>
                    Đăng nhập
                </h2>
                {error && <p className="text-red-500 mb-4 text-center bg-red-50 dark:bg-red-500/10 p-2 rounded">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-slate-700 dark:text-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Mật khẩu</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 dark:bg-slate-700 dark:text-white"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-black transition"
                    >
                        Đăng nhập
                    </button>
                </form>
                <p className="mt-4 text-center text-slate-600 dark:text-slate-400">
                    Chưa có tài khoản? <Link to="/register" className="text-gray-900 dark:text-gray-100 hover:underline">Đăng ký ở đây</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;

