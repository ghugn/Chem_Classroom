import { Outlet } from 'react-router-dom';

const MainLayout = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow-sm p-4">
                <h1 className="text-xl font-bold text-gray-900">Fullstack Project</h1>
            </header>
            <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
                <Outlet />
            </main>
            <footer className="bg-white border-t p-4 text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Fullstack Project
            </footer>
        </div>
    );
};

export default MainLayout;
