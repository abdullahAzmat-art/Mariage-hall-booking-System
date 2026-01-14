import React, { useState, useEffect } from 'react';
import { FaUsers, FaMoneyBillWave, FaUserTie, FaTrash, FaBuilding, FaEnvelope, FaReply } from 'react-icons/fa';
import userService from '../services/userService';
import hallService from '../services/hallService';
import commissionService from '../services/commissionService';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [applications, setApplications] = useState([]);
    const [users, setUsers] = useState([]);
    const [halls, setHalls] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [replyText, setReplyText] = useState({}); // Map of complaint ID to reply text
    const [payments, setPayments] = useState([]);
    const [rejectionReasons, setRejectionReasons] = useState({}); // Map of payment ID to rejection reason

    useEffect(() => {
        if (activeTab === 'applications') {
            fetchApplications();
        } else if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'halls') {
            fetchHalls();
        } else if (activeTab === 'complaints') {
            fetchComplaints();
        } else if (activeTab === 'commissions') {
            fetchPayments();
        }
    }, [activeTab]);

    const fetchApplications = async () => {
        try {
            const data = await userService.getManagerApplications();
            setApplications(data);
        } catch (error) {
            console.error('Failed to fetch applications', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const data = await userService.getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const fetchHalls = async () => {
        try {
            const data = await hallService.getAllHalls();
            setHalls(data);
        } catch (error) {
            console.error('Failed to fetch halls', error);
        }
    };

    const fetchPayments = async () => {
        try {
            const data = await commissionService.getPendingPayments();
            setPayments(data);
        } catch (error) {
            console.error('Failed to fetch payments', error);
        }
    };

    const handleVerifyPayment = async (paymentId) => {
        if (window.confirm('Verify this payment?')) {
            try {
                await commissionService.verifyPayment(paymentId);
                alert('Payment verified successfully');
                fetchPayments();
            } catch (error) {
                alert('Failed to verify payment');
            }
        }
    };

    const handleRejectPayment = async (paymentId) => {
        const reason = rejectionReasons[paymentId];
        if (!reason) {
            alert('Please provide a rejection reason');
            return;
        }
        if (window.confirm('Reject this payment?')) {
            try {
                await commissionService.rejectPayment(paymentId, reason);
                alert('Payment rejected');
                fetchPayments();
                setRejectionReasons({ ...rejectionReasons, [paymentId]: '' });
            } catch (error) {
                alert('Failed to reject payment');
            }
        }
    };

    const fetchComplaints = async () => {
        try {
            const complaintService = (await import('../services/complaintService')).default;
            const data = await complaintService.getAllComplaints();
            setComplaints(data);
        } catch (error) {
            console.error('Failed to fetch complaints', error);
        }
    };

    const handleReply = async (complaintId) => {
        try {
            const complaintService = (await import('../services/complaintService')).default;
            await complaintService.replyToComplaint(complaintId, replyText[complaintId]);
            alert('Reply sent successfully');
            fetchComplaints();
            setReplyText({ ...replyText, [complaintId]: '' });
        } catch (error) {
            alert('Failed to send reply');
        }
    };

    const handleStatusUpdate = async (userId, status) => {
        try {
            await userService.updateManagerApplicationStatus(userId, status);
            fetchApplications();
            alert(`Application ${status}`);
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await userService.deleteUser(userId);
                setUsers(users.filter(user => user._id !== userId));
                alert('User deleted successfully');
            } catch (error) {
                alert('Failed to delete user');
            }
        }
    };

    const handleDeleteHall = async (hallId) => {
        if (window.confirm('Are you sure you want to delete this hall? This action cannot be undone.')) {
            try {
                await hallService.deleteHall(hallId);
                setHalls(halls.filter(hall => hall._id !== hallId));
                alert('Hall deleted successfully');
            } catch (error) {
                alert('Failed to delete hall');
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-500">Total Revenue</h3>
                        <FaMoneyBillWave className="text-green-500 text-xl" />
                    </div>
                    <p className="text-3xl font-bold text-text">Rs 45,200</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-500">Total Bookings</h3>
                        <FaBuilding className="text-primary text-xl" />
                    </div>
                    <p className="text-3xl font-bold text-text">128</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-500">Active Halls</h3>
                        <FaBuilding className="text-blue-500 text-xl" />
                    </div>
                    <p className="text-3xl font-bold text-text">{halls.length || 12}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-500">Total Users</h3>
                        <FaUsers className="text-gold text-xl" />
                    </div>
                    <p className="text-3xl font-bold text-text">{users.length || 850}</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 overflow-x-auto pb-2">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-6 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${activeTab === 'users' ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                    Manage Users
                </button>
                <button
                    onClick={() => setActiveTab('applications')}
                    className={`px-6 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${activeTab === 'applications' ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                    Manager Applications
                </button>
                <button
                    onClick={() => setActiveTab('halls')}
                    className={`px-6 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${activeTab === 'halls' ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                    View Halls (Supervision)
                </button>
                <button
                    onClick={() => setActiveTab('complaints')}
                    className={`px-6 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${activeTab === 'complaints' ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                    Manage Complaints
                </button>
                <button
                    onClick={() => setActiveTab('commissions')}
                    className={`px-6 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${activeTab === 'commissions' ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                    Verify Commissions
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 min-h-[400px]">
                {activeTab === 'users' && (
                    <div>
                        <h2 className="text-xl font-bold text-text mb-6">User Management</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 font-medium">
                                    <tr>
                                        <th className="p-4">Name</th>
                                        <th className="p-4">Email</th>
                                        <th className="p-4">Role</th>
                                        <th className="p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map(user => (
                                        <tr key={user._id} className="hover:bg-gray-50">
                                            <td className="p-4 font-medium">{user.name}</td>
                                            <td className="p-4 text-gray-600">{user.email}</td>
                                            <td className="p-4 capitalize">{user.role}</td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                                                    title="Delete User"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                )}

                {activeTab === 'applications' && (
                    <div>
                        <h2 className="text-xl font-bold text-text mb-6">Manager Applications</h2>
                        {applications.length === 0 ? (
                            <p className="text-gray-500">No pending applications.</p>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {applications.map(app => (
                                    <div key={app._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg">{app.managerApplication.businessName}</h3>
                                                <p className="text-sm text-gray-600 mb-2">{app.managerApplication.businessAddress}</p>
                                                <p className="text-gray-700 mb-3">{app.managerApplication.description}</p>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <FaUserTie className="mr-2" /> {app.name} ({app.email})
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleStatusUpdate(app._id, 'approved')}
                                                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(app._id, 'rejected')}
                                                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'halls' && (
                    <div>
                        <h2 className="text-xl font-bold text-text mb-6">All Halls (Supervision View)</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 font-medium">
                                    <tr>
                                        <th className="p-4">Name</th>
                                        <th className="p-4">Location</th>
                                        <th className="p-4">Capacity</th>
                                        <th className="p-4">Price</th>
                                        <th className="p-4">Manager</th>
                                        <th className="p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {halls.map(hall => (
                                        <tr key={hall._id} className="hover:bg-gray-50">
                                            <td className="p-4 font-medium">{hall.name}</td>
                                            <td className="p-4 text-gray-600">{hall.location}</td>
                                            <td className="p-4">{hall.capacity}</td>
                                            <td className="p-4">Rs {hall.price}</td>
                                            <td className="p-4 text-gray-600">{hall.manager?.name || 'N/A'}</td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleDeleteHall(hall._id)}
                                                    className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                                                    title="Delete Hall"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {halls.length === 0 && (
                                <p className="text-center text-gray-500 py-4">No halls found.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'complaints' && (
                    <div>
                        <h2 className="text-xl font-bold text-text mb-6">User Complaints</h2>
                        {complaints.length === 0 ? (
                            <p className="text-gray-500">No complaints found.</p>
                        ) : (
                            <div className="space-y-4">
                                {complaints.map(complaint => (
                                    <div key={complaint._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-800">{complaint.subject}</h3>
                                                <p className="text-sm text-gray-500">From: {complaint.name} ({complaint.email})</p>
                                                <p className="text-xs text-gray-400">{new Date(complaint.createdAt).toLocaleString()}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${complaint.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {complaint.status.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                            <p className="text-gray-700">{complaint.message}</p>
                                        </div>

                                        {complaint.adminReply ? (
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                                <p className="text-sm font-bold text-blue-800 mb-1">Your Reply:</p>
                                                <p className="text-blue-900">{complaint.adminReply}</p>
                                            </div>
                                        ) : (
                                            <div className="mt-4">
                                                <textarea
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none mb-2"
                                                    placeholder="Write your reply here..."
                                                    rows="3"
                                                    value={replyText[complaint._id] || ''}
                                                    onChange={(e) => setReplyText({ ...replyText, [complaint._id]: e.target.value })}
                                                ></textarea>
                                                <button
                                                    onClick={() => handleReply(complaint._id)}
                                                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
                                                    disabled={!replyText[complaint._id]}
                                                >
                                                    <FaReply /> Send Reply
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'commissions' && (
                    <div>
                        <h2 className="text-xl font-bold text-text mb-6">Commission Payment Verification</h2>
                        {payments.length === 0 ? (
                            <p className="text-gray-500">No pending commission payments to verify.</p>
                        ) : (
                            <div className="space-y-4">
                                {payments.map(payment => (
                                    <div key={payment._id} className="border border-gray-200 rounded-lg p-6 bg-white">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg">Manager: {payment.managerId?.name}</h3>
                                                <p className="text-sm text-gray-600">Email: {payment.managerId?.email}</p>
                                                <p className="text-sm text-gray-600">Booking ID: #{payment.bookingId?._id?.slice(-6)}</p>
                                                <p className="text-sm font-bold text-primary mt-2">Commission Amount: Rs {payment.amount.toLocaleString()}</p>
                                                <p className="text-xs text-gray-400">Due Date: {new Date(payment.dueDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        {payment.paymentProof && (
                                            <div className="mb-4">
                                                <p className="text-sm font-medium text-gray-700 mb-2">Payment Proof:</p>
                                                <img
                                                    src={`http://localhost:5000/${payment.paymentProof}`}
                                                    alt="Payment Proof"
                                                    className="max-w-md rounded-lg border border-gray-300"
                                                />
                                            </div>
                                        )}

                                        <div className="flex gap-4 items-end">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason (if rejecting)</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                                    placeholder="Enter reason for rejection"
                                                    value={rejectionReasons[payment._id] || ''}
                                                    onChange={(e) => setRejectionReasons({ ...rejectionReasons, [payment._id]: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleVerifyPayment(payment._id)}
                                                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                                                >
                                                    Verify
                                                </button>
                                                <button
                                                    onClick={() => handleRejectPayment(payment._id)}
                                                    className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

};

export default AdminDashboard;
