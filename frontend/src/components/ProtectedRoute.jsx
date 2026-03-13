import { Navigate, Outlet } from 'react-router-dom';
import '../styles/ProtectedRoute.css';

const ProtectedRoute = () => {
    // In a real application, consider using Context or Redux for auth state
    const token = localStorage.getItem('token');
    const isAuthenticated = !!token; // simple check, real implementation should verify token expiry if possible

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
