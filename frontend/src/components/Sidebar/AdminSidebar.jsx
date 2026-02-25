import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    UserIcon,
    FileText,
    BookOpen,
    BadgeDollarSign,
    CalendarDays,
    Settings,
    LogOut
} from 'lucide-react';
import clsx from 'clsx';

const AdminSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const navItems = [
        { name: 'Tổng quan', path: '/admin', icon: LayoutDashboard },
        { name: 'Quản lý lớp', path: '/admin/classes', icon: Users },
        { name: 'Học sinh', path: '/admin/students', icon: UserIcon },
        { name: 'Điểm thi', path: '/admin/grades', icon: FileText },
        { name: 'Tài liệu', path: '/admin/documents', icon: BookOpen },
        { name: 'Học phí', path: '/admin/payments', icon: BadgeDollarSign },
        { name: 'Lịch dạy', path: '/admin/schedule', icon: CalendarDays },
        { name: 'Cài đặt', path: '/admin/settings', icon: Settings },
    ];

    return (
        <div className="w-60 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col fixed left-0 top-0 z-10">
            <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">ChemClass</h2>
                <div className="text-[11px] font-medium text-gray-400 dark:text-gray-500 tracking-wide uppercase mt-0.5">Admin</div>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                "flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] font-medium transition-all duration-150 ease-in-out",
                                isActive
                                    ? "bg-gray-100 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 border-l-2 border-gray-900 dark:border-gray-300 -ml-px"
                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/40 hover:text-gray-800 dark:hover:text-gray-200"
                            )}
                        >
                            <item.icon className={clsx("w-[18px] h-[18px]", isActive ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-500")} strokeWidth={1.75} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-2.5 py-[7px] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300 rounded-md transition-colors text-[13px] font-medium"
                >
                    <LogOut className="w-[18px] h-[18px]" strokeWidth={1.75} />
                    Đăng xuất
                </button>
            </div>
        </div>
    );
};

export default AdminSidebar;
