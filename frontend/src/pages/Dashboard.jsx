import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CustomerDashboard from '../components/CustomerDashboard';
import AdminDashboard from '../components/AdminDashboard';
import ManagerDashboard from '../components/ManagerDashboard';
import { FaSignOutAlt, FaHome, FaUser, FaBell } from 'react-icons/fa';
import authService from '../services/authService';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
            navigate('/login');
        } else {
            setUser(currentUser);
        }
    }, [navigate]);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (!user) return null;

    const roleLabel = user.role === 'admin' ? 'Administrator' : user.role === 'manager' ? 'Hall Manager' : 'Member';
    const roleBg = user.role === 'admin' ? 'bg-navy text-white' : user.role === 'manager' ? 'bg-terracotta text-white' : 'bg-gray-100 text-gray-700';

    return (
        <div className="bg-ivory-warm min-h-screen font-body">
        
       

            {/* Dashboard Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-playfair font-bold text-navy capitalize">
                            {user.role} Dashboard
                        </h1>
                        <p className="text-gray-500 mt-1.5 font-medium">
                            Welcome back, <span className="text-terracotta">{user.name}</span>! Here's what's happening today.
                        </p>
                    </div>
                    <div className={`px-5 py-2 rounded-full text-sm font-bold shadow-sm self-start sm:self-auto flex items-center gap-2 ${roleBg}`}>
                        <FaUser className="text-xs opacity-80" />
                        {roleLabel}
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                {user.role === 'admin' ? (
                    <AdminDashboard />
                ) : user.role === 'manager' ? (
                    <ManagerDashboard />
                ) : (
                    <CustomerDashboard />
                )}
            </div>
        </div>
    );
};

export default Dashboard;
