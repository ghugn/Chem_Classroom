import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/Sidebar/AdminSidebar';
import TopBar from '../components/TopBar/TopBar';

const AdminLayout = () => {
    return (
        <div className="flex bg-white dark:bg-gray-950 min-h-screen text-gray-800 dark:text-gray-100">
            <AdminSidebar />
            <div className="ml-60 flex-1 flex flex-col">
                <TopBar role="Admin" />
                <main className="flex-1 p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
