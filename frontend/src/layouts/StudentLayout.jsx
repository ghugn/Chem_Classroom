import { Outlet } from 'react-router-dom';
import StudentSidebar from '../components/Sidebar/StudentSidebar';
import TopBar from '../components/TopBar/TopBar';

const StudentLayout = () => {
    return (
        <div className="flex bg-white dark:bg-gray-950 min-h-screen text-slate-800 dark:text-slate-100">
            <StudentSidebar />
            <div className="ml-60 flex-1 flex flex-col">
                <TopBar role="Học Sinh" />
                <main className="flex-1 p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default StudentLayout;
