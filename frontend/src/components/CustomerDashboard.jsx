import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaHistory, FaUserTie, FaStore, FaEnvelope, FaTrash, FaUtensils } from 'react-icons/fa';
import authService from '../services/authService';
import userService from '../services/userService';
import bookingService from '../services/bookingService';
import { FaRocketchat } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';


const CustomerDashboard = () => {
    const [activeTab, setActiveTab] = useState('bookings');
    const [user, setUser] = useState(authService.getCurrentUser());
    const [bookings, setBookings] = useState([]);
    const [applicationForm, setApplicationForm] = useState({
        businessName: '',
        businessAddress: '',
        description: ''
    });
    const [appStatus, setAppStatus] = useState(user?.managerApplication?.status || 'none');
    const [complaints, setComplaints] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [transactionId, setTransactionId] = useState('');
    const [paymentProof, setPaymentProof] = useState(null);

    useEffect(() => {
        fetchBookings();
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const complaintService = (await import('../services/complaintService')).default;
            const data = await complaintService.getMyComplaints();
            setComplaints(data);
        } catch (error) {
            console.error('Failed to fetch complaints', error);
        }
    };

    const navigate = useNavigate()
    const sendtochat=async(managerId)=>{
        sessionStorage.setItem("chatWith",managerId);
          navigate("/message")
    }

    const handleDeleteComplaint = async (complaintId) => {
        if (window.confirm('Are you sure you want to delete this complaint?')) {
            try {
                const complaintService = (await import('../services/complaintService')).default;
                await complaintService.deleteComplaint(complaintId);
                alert('Complaint deleted successfully');
                fetchComplaints();
            } catch (error) {
                alert('Failed to delete complaint');
            }
        }
    };

    const fetchBookings = async () => {
        try {
            const data = await bookingService.getUserBookings();
            setBookings(data);
            console.log(data)
        } catch (error) {
            console.error('Failed to fetch bookings', error);
        }
    };

    const handleApply = async (e) => {
        e.preventDefault();
        try {
            const updatedUser = await userService.applyForManager(applicationForm);
            setUser(updatedUser);
            setAppStatus('pending');
            alert('Application submitted successfully!');
        } catch (error) {
            alert('Failed to submit application');
        }
    };

    const handlePaymentUpload = async (e) => {
        e.preventDefault();
        if (!transactionId || !paymentProof) {
            alert('Please provide transaction ID and payment proof');
            return;
        }

        try {
            await bookingService.submitPaymentProof(selectedBooking._id, transactionId, paymentProof);
            alert('Payment proof submitted successfully!');
            setShowPaymentModal(false);
            setTransactionId('');
            setPaymentProof(null);
            setSelectedBooking(null);
            fetchBookings();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to submit payment proof');
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-500">My Bookings</h3>
                        <FaCalendarAlt className="text-primary text-xl" />
                    </div>
                    <p className="text-3xl font-bold text-text">{bookings.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-500">Total Spent</h3>
                        <FaHistory className="text-green-500 text-xl" />
                    </div>
                    <p className="text-3xl font-bold text-text">Rs {bookings.reduce((total, booking) => total + (booking.totalAmount || 0), 0).toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-500">Account Status</h3>
                        <FaUserTie className="text-blue-500 text-xl" />
                    </div>
                    <p className="text-lg font-bold text-text capitalize">{user?.role}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-gray-200 pb-1">
                <button
                    onClick={() => setActiveTab('bookings')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'bookings' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-text'}`}
                >
                    My Bookings
                </button>
                <button
                    onClick={() => setActiveTab('manager')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'manager' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-text'}`}
                >
                    Become a Manager
                </button>
                <button
                    onClick={() => setActiveTab('complaints')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'complaints' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-text'}`}
                >
                    My Complaints
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 min-h-[400px]">
                {activeTab === 'bookings' && (
                    <div>
                        <h2 className="text-xl font-bold text-text mb-6">My Bookings</h2>
                        {bookings.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-600 font-medium">
                                        <tr>
                                            <th className="p-4">Hall</th>
                                            <th className="p-4">Event Date</th>
                                            <th className="p-4">Guests</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Payment Status</th>
                                            <th className="p-4">Total Amount</th>
                                            <th className="p-4">Prebooking (10%)</th>
                                            <th className="p-4">Actions</th>
                                            <th className="p-4">Chat with manager </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {bookings.map((booking) => (
                                            <tr key={booking._id} className="hover:bg-gray-50">
                                                <td className="p-4 font-medium">{booking.hallId?.name || 'N/A'}</td>
                                                <td className="p-4">{new Date(booking.eventDate).toLocaleDateString()}</td>
                                                <td className="p-4">{booking.guestsCount}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${booking.status === 'completed' ? 'text-blue-600 bg-blue-100' :
                                                        booking.status === 'approved' ? 'text-green-600 bg-green-100' :
                                                            booking.status === 'payment_submitted' ? 'text-purple-600 bg-purple-100' :
                                                                booking.status === 'awaiting_payment' ? 'text-orange-600 bg-orange-100' :
                                                                    booking.status === 'payment_rejected' ? 'text-red-600 bg-red-100' :
                                                                        booking.status === 'rejected' ? 'text-red-600 bg-red-100' :
                                                                            'text-yellow-600 bg-yellow-100'
                                                        }`}>
                                                        {booking.status.replace(/_/g, ' ').charAt(0).toUpperCase() + booking.status.replace(/_/g, ' ').slice(1)}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {booking.status === 'awaiting_payment' && (
                                                        <span className="text-xs text-orange-600 font-semibold">⏳ Payment Pending</span>
                                                    )}
                                                    {booking.status === 'payment_submitted' && (
                                                        <span className="text-xs text-purple-600 font-semibold">🔍 Under Review</span>
                                                    )}
                                                    {booking.status === 'payment_rejected' && (
                                                        <div>
                                                            <span className="text-xs text-red-600 font-semibold block">❌ Rejected</span>
                                                            {booking.paymentRejectionReason && (
                                                                <span className="text-xs text-red-500 italic">{booking.paymentRejectionReason}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {booking.paymentVerified && (
                                                        <span className="text-xs text-green-600 font-semibold">✅ Verified</span>
                                                    )}
                                                </td>
                                                <td className="p-4 font-bold text-gray-700">Rs {(booking.totalAmount || 0).toLocaleString()}</td>
                                                <td className="p-4 font-bold text-primary">Rs {(booking.prebookingAmount || 0).toLocaleString()}</td>
                                                <td className="p-4">
                                                    {booking.status === 'pending' && (
                                                        <span className="text-xs text-gray-500 font-semibold italic">
                                                            Awaiting Manager Approval
                                                        </span>
                                                    )}
                                                    {(booking.status === 'awaiting_payment' || booking.status === 'payment_rejected') && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedBooking(booking);
                                                                setShowPaymentModal(true);
                                                            }}
                                                            className="px-3 py-1 bg-primary text-white rounded text-xs font-bold hover:bg-primary/90 transition-colors mr-2"
                                                        >
                                                            Upload Payment
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-15" onClick={()=>sendtochat(booking.hallId.manager)}><FaRocketchat />
</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500">You have no bookings yet.</p>
                        )}
                    </div>
                )}

                {/* ... existing manager and complaints tabs ... */}
                {activeTab === 'manager' && (
                    <div className="max-w-2xl">
                        {/* ... existing manager tab content ... */}
                        <h2 className="text-xl font-bold text-text mb-6 flex items-center">
                            <FaStore className="mr-2 text-primary" /> Partner with RoyalVenue
                        </h2>

                        {appStatus === 'none' && (
                            <form onSubmit={handleApply} className="space-y-4">
                                <p className="text-gray-600 mb-4">
                                    List your marriage hall on RoyalVenue and reach thousands of customers.
                                    Fill out the form below to apply for a Manager account.
                                </p>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                        value={applicationForm.businessName}
                                        onChange={(e) => setApplicationForm({ ...applicationForm, businessName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                        value={applicationForm.businessAddress}
                                        onChange={(e) => setApplicationForm({ ...applicationForm, businessAddress: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        required
                                        rows="4"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                        value={applicationForm.description}
                                        onChange={(e) => setApplicationForm({ ...applicationForm, description: e.target.value })}
                                    ></textarea>
                                </div>
                                <button type="submit" className="btn-primary px-6 py-2">Submit Application</button>
                            </form>
                        )}

                        {appStatus === 'pending' && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                                <h3 className="text-lg font-bold text-yellow-800 mb-2">Application Pending</h3>
                                <p className="text-yellow-700">
                                    Your application to become a Hall Manager is currently under review by our admin team.
                                    Please check back later.
                                </p>
                            </div>
                        )}

                        {appStatus === 'approved' && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                                <h3 className="text-lg font-bold text-green-800 mb-2">Application Approved!</h3>
                                <p className="text-green-700 mb-4">
                                    Congratulations! You are now a Hall Manager. You can now list your halls and manage bookings.
                                </p>
                                <button className="btn-primary px-6 py-2">Go to Manager Dashboard</button>
                            </div>
                        )}

                        {appStatus === 'rejected' && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                                <h3 className="text-lg font-bold text-red-800 mb-2">Application Rejected</h3>
                                <p className="text-red-700">
                                    Unfortunately, your application was not approved at this time. Please contact support for more information.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'complaints' && (
                    <div>
                        <h2 className="text-xl font-bold text-text mb-6 flex items-center">
                            <FaEnvelope className="mr-2 text-primary" /> My Complaints
                        </h2>
                        {complaints.length > 0 ? (
                            <div className="space-y-4">
                                {complaints.map((complaint) => (
                                    <div key={complaint._id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg text-gray-800">{complaint.subject}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${complaint.status === 'resolved' ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'}`}>
                                                    {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteComplaint(complaint._id)}
                                                    className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                                                    title="Delete Complaint"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-gray-600 mb-2">{complaint.message}</p>
                                        <p className="text-xs text-gray-400 mb-4">{new Date(complaint.createdAt).toLocaleDateString()}</p>

                                        {complaint.adminReply && (
                                            <div className="bg-white p-3 rounded border border-gray-200 mt-2">
                                                <p className="text-sm font-bold text-primary mb-1">Admin Reply:</p>
                                                <p className="text-gray-700 text-sm">{complaint.adminReply}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">You have no complaints yet.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Payment Upload Modal */}
            {showPaymentModal && selectedBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-text mb-4">Upload Payment Proof</h3>

                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                            <p className="text-sm text-blue-900 font-semibold mb-2">Booking Details:</p>
                            <p className="text-xs text-blue-800">Hall: {selectedBooking.hallId?.name}</p>
                            <p className="text-xs text-blue-800">Total Amount: Rs {(selectedBooking.totalAmount || 0).toLocaleString()}</p>
                            <p className="text-xs text-blue-800 font-bold">Prebooking Amount (10%): Rs {(selectedBooking.prebookingAmount || 0).toLocaleString()}</p>
                        </div>

                        {selectedBooking.status === 'payment_rejected' && selectedBooking.paymentRejectionReason && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                                <p className="text-sm text-red-900 font-semibold mb-1">Previous Rejection Reason:</p>
                                <p className="text-xs text-red-800">{selectedBooking.paymentRejectionReason}</p>
                            </div>
                        )}

                        <form onSubmit={handlePaymentUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Transaction ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                    placeholder="Enter your transaction ID"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Proof Screenshot <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setPaymentProof(e.target.files[0])}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Upload a clear screenshot of your payment confirmation</p>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPaymentModal(false);
                                        setTransactionId('');
                                        setPaymentProof(null);
                                        setSelectedBooking(null);
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90"
                                >
                                    Submit Payment Proof
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerDashboard;
