import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    BookOpen,
    BadgeDollarSign,
    Settings,
    LogOut
} from 'lucide-react';
import clsx from 'clsx';

const StudentSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const navItems = [
        { name: 'Tổng quan', path: '/student', icon: LayoutDashboard },
        { name: 'Điểm thi', path: '/student/grades', icon: FileText },
        { name: 'Tài liệu môn học', path: '/student/documents', icon: BookOpen },
        { name: 'Học phí', path: '/student/payments', icon: BadgeDollarSign },
        { name: 'Cài đặt', path: '/student/settings', icon: Settings },
    ];

    return (
        <div className="w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen flex flex-col fixed left-0 top-0 transition-colors duration-200 z-10">
            <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">ChemClass</h2>
                <div className="text-[11px] font-medium text-slate-500 dark:text-gray-500 tracking-wide uppercase mt-0.5">Student</div>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== '/student' && location.pathname.startsWith(item.path));
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                "flex items-center gap-2.5 px-2.5 py-[7px] rounded-md transition-all duration-200 font-medium text-[13px]",
                                isActive
                                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-l-2 border-gray-900 dark:border-gray-300 -ml-px"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                            )}
                        >
                            <item.icon className={clsx("w-[18px] h-[18px]", isActive ? "text-gray-900 dark:text-gray-100" : "text-slate-400 dark:text-slate-500")} strokeWidth={1.75} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-2.5 py-[7px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors duration-200 font-medium text-[13px]"
                >
                    <LogOut className="w-[18px] h-[18px]" strokeWidth={1.75} />
                    Đăng xuất
                </button>
            </div>
        </div>
    );
};

export default StudentSidebar;
