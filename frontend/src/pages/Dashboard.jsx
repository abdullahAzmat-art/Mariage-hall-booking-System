import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerDashboard from '../components/CustomerDashboard';
import AdminDashboard from '../components/AdminDashboard';
import ManagerDashboard from '../components/ManagerDashboard';
import { FaSignOutAlt } from 'react-icons/fa';
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

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-text">Dashboard</h1>
                        <p className="text-gray-500">Welcome back, {user.name}</p>
                    </div>

                    <div className="flex items-center space-x-4 mt-4 md:mt-0">
                        <button
                            onClick={handleLogout}
                            className="flex items-center text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
                        >
                            <FaSignOutAlt className="mr-2" /> Logout
                        </button>
                    </div>
                </div>

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
