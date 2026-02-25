import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '../services/auth';

const ProtectedRoute = ({ allowedRoles }) => {
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    const userRole = getUserRole();

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Redirect based on role
        if (userRole === 'ADMIN') return <Navigate to="/admin" replace />;
        if (userRole === 'STUDENT') return <Navigate to="/student" replace />;
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
