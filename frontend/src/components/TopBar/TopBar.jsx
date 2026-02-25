import { Sun, Moon, User } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TopBar = ({ role = 'Admin' }) => {
    const { isDark, toggleTheme } = useTheme();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="h-12 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 flex items-center justify-end px-6 sticky top-0 z-10 transition-colors duration-150">
            <div className="flex items-center gap-3">
                <button
                    onClick={toggleTheme}
                    className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 dark:text-gray-500 transition-all duration-150"
                    aria-label="Toggle Theme"
                >
                    {isDark ? <Sun size={16} /> : <Moon size={16} />}
                </button>

                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all duration-150"
                    >
                        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 text-xs font-semibold shadow-sm border border-gray-200 dark:border-gray-700">
                            {user.full_name ? user.full_name.charAt(0).toUpperCase() : <User size={14} />}
                        </div>
                        <div className="hidden sm:block text-left">
                            <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200 leading-none">{user.full_name || role}</div>
                        </div>
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 py-1 z-50 shadow-sm">
                            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                                <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200 truncate">{user.full_name}</p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{user.email || user.username}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-150"
                            >
                                Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopBar;
