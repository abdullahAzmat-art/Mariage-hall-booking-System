import React, { useState, useEffect } from 'react';
import { 
    FaCalendarAlt, FaHistory, FaUserTie, FaStore, FaEnvelope, 
    FaTrash, FaCheckCircle, FaTimesCircle, FaClock, FaUpload,
    FaShieldAlt, FaMapMarkerAlt, FaUsers, FaRocket
} from 'react-icons/fa';
import { FaRocketchat } from "react-icons/fa6";
import authService from '../services/authService';
import userService from '../services/userService';
import bookingService from '../services/bookingService';
import { useNavigate } from 'react-router-dom';

const statusConfig = {
    completed:         { label: 'Completed',         cls: 'bg-blue-100 text-blue-700' },
    approved:          { label: 'Approved',           cls: 'bg-emerald-100 text-emerald-700' },
    payment_submitted: { label: 'Payment Submitted',  cls: 'bg-purple-100 text-purple-700' },
    awaiting_payment:  { label: 'Awaiting Payment',   cls: 'bg-orange-100 text-orange-700' },
    payment_rejected:  { label: 'Payment Rejected',   cls: 'bg-red-100 text-red-700' },
    rejected:          { label: 'Rejected',           cls: 'bg-red-100 text-red-700' },
    pending:           { label: 'Pending',            cls: 'bg-amber-100 text-amber-700' },
};

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

    const navigate = useNavigate();
    const sendtochat = async (managerId) => {
        sessionStorage.setItem("chatWith", managerId);
        navigate("/message");
    };

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

    const totalSpent = bookings.reduce((total, b) => total + (b.totalAmount || 0), 0);
    const approvedCount = bookings.filter(b => b.status === 'approved' || b.status === 'completed').length;

    const tabs = [
        { id: 'bookings', label: 'My Bookings', icon: FaCalendarAlt },
        { id: 'manager', label: 'Become a Partner', icon: FaStore },
        { id: 'complaints', label: 'My Complaints', icon: FaEnvelope },
    ];

    const inputCls = "w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-navy text-sm font-medium focus:bg-white focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 transition-all placeholder-gray-400";

    return (
        <div className="space-y-6">
            {/* ── Stats Row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Bookings */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 border-l-4 border-l-terracotta flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-terracotta/10 text-terracotta flex items-center justify-center shrink-0">
                        <FaCalendarAlt className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-0.5">Total Bookings</p>
                        <p className="text-3xl font-playfair font-bold text-navy">{bookings.length}</p>
                    </div>
                </div>
                {/* Total Spent */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 border-l-4 border-l-emerald-500 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <FaHistory className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-0.5">Total Spent</p>
                        <p className="text-2xl font-playfair font-bold text-navy">Rs {totalSpent.toLocaleString()}</p>
                    </div>
                </div>
                {/* Role */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 border-l-4 border-l-blue-500 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FaUserTie className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-0.5">Account Role</p>
                        <p className="text-lg font-bold text-navy capitalize">{user?.role || 'Customer'}</p>
                    </div>
                </div>
            </div>

            {/* ── Tab Navigation ── */}
            <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex gap-1 overflow-x-auto scrollbar-none">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                            activeTab === id
                                ? 'bg-navy text-white shadow-sm'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-navy'
                        }`}
                    >
                        <Icon className="text-xs" />
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Content Panel ── */}
            <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 sm:p-8 min-h-[400px]">

                {/* BOOKINGS TAB */}
                {activeTab === 'bookings' && (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1 h-7 bg-terracotta rounded-full" />
                            <h2 className="text-xl font-playfair font-bold text-navy">My Bookings</h2>
                            <span className="ml-auto text-xs font-bold bg-terracotta/10 text-terracotta px-3 py-1 rounded-full">
                                {bookings.length} total
                            </span>
                        </div>

                        {bookings.length > 0 ? (
                            <div className="overflow-x-auto rounded-2xl border border-gray-100">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-navy text-white text-xs uppercase tracking-wider">
                                            <th className="px-4 py-3 rounded-tl-2xl">Hall</th>
                                            <th className="px-4 py-3">Event Date</th>
                                            <th className="px-4 py-3">Guests</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Payment</th>
                                            <th className="px-4 py-3">Total</th>
                                            <th className="px-4 py-3">Prebooking</th>
                                            <th className="px-4 py-3">Action</th>
                                            <th className="px-4 py-3 rounded-tr-2xl">Chat</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {bookings.map((booking) => {
                                            const sc = statusConfig[booking.status] || statusConfig.pending;
                                            return (
                                                <tr key={booking._id} className="hover:bg-ivory-warm transition-colors">
                                                    <td className="px-4 py-4 font-semibold text-navy text-sm">
                                                        {booking.hallId?.name || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-600">
                                                        {new Date(booking.eventDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-600">{booking.guestsCount}</td>
                                                    <td className="px-4 py-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${sc.cls}`}>
                                                            {sc.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-xs font-semibold">
                                                        {booking.status === 'awaiting_payment' && (
                                                            <span className="text-orange-600 flex items-center gap-1"><FaClock className="text-[10px]" /> Pending</span>
                                                        )}
                                                        {booking.status === 'payment_submitted' && (
                                                            <span className="text-purple-600">🔍 Under Review</span>
                                                        )}
                                                        {booking.status === 'payment_rejected' && (
                                                            <div>
                                                                <span className="text-red-600 block">❌ Rejected</span>
                                                                {booking.paymentRejectionReason && (
                                                                    <span className="text-red-400 italic text-[11px]">{booking.paymentRejectionReason}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {booking.paymentVerified && (
                                                            <span className="text-emerald-600 flex items-center gap-1"><FaCheckCircle className="text-[10px]" /> Verified</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 font-bold text-navy text-sm">
                                                        Rs {(booking.totalAmount || 0).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-4 font-bold text-terracotta text-sm">
                                                        Rs {(booking.prebookingAmount || 0).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {booking.status === 'pending' && (
                                                            <span className="text-xs text-gray-400 italic">Awaiting Approval</span>
                                                        )}
                                                        {(booking.status === 'awaiting_payment' || booking.status === 'payment_rejected') && (
                                                            <button
                                                                onClick={() => { setSelectedBooking(booking); setShowPaymentModal(true); }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-terracotta text-white rounded-full text-xs font-bold hover:bg-terracotta/90 transition-colors"
                                                            >
                                                                <FaUpload className="text-[10px]" /> Upload
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <button
                                                            onClick={() => sendtochat(booking.hallId?.manager)}
                                                            className="text-terracotta hover:scale-110 transition-transform text-xl"
                                                            title="Chat with Manager"
                                                        >
                                                            <FaRocketchat />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400 text-2xl">
                                    <FaCalendarAlt />
                                </div>
                                <p className="text-gray-500 font-medium">No bookings yet</p>
                                <p className="text-gray-400 text-sm mt-1">Explore our venues and make your first booking!</p>
                            </div>
                        )}
                    </div>
                )}

                {/* BECOME A PARTNER TAB */}
                {activeTab === 'manager' && (
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1 h-7 bg-terracotta rounded-full" />
                            <h2 className="text-xl font-playfair font-bold text-navy">Partner with Venuora</h2>
                        </div>

                        {appStatus === 'none' && (
                            <div>
                                <div className="bg-terracotta/5 border border-terracotta/20 rounded-2xl p-5 mb-6">
                                    <p className="text-sm text-navy/80 leading-relaxed">
                                        List your marriage hall on Venuora and connect with thousands of customers planning their dream events. Fill the form below to apply for a Manager account.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        {['Reach thousands of customers', 'Easy booking management', 'Secure payment handling', 'Dedicated support team'].map((benefit) => (
                                            <div key={benefit} className="flex items-center gap-2 text-xs text-navy font-medium">
                                                <FaCheckCircle className="text-emerald-500 shrink-0" />
                                                {benefit}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <form onSubmit={handleApply} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Business Name</label>
                                        <input type="text" required className={inputCls} placeholder="Your hall or business name"
                                            value={applicationForm.businessName}
                                            onChange={(e) => setApplicationForm({ ...applicationForm, businessName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Business Address</label>
                                        <input type="text" required className={inputCls} placeholder="Full address of your venue"
                                            value={applicationForm.businessAddress}
                                            onChange={(e) => setApplicationForm({ ...applicationForm, businessAddress: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Description</label>
                                        <textarea required rows="4"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-navy text-sm font-medium focus:bg-white focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 transition-all placeholder-gray-400 resize-none"
                                            placeholder="Tell us about your venue, capacity, amenities..."
                                            value={applicationForm.description}
                                            onChange={(e) => setApplicationForm({ ...applicationForm, description: e.target.value })}
                                        />
                                    </div>
                                    <button type="submit" className="btn-cta px-8 py-3 rounded-xl font-bold text-sm w-full sm:w-auto flex items-center gap-2 justify-center">
                                        <FaRocket className="text-xs" />
                                        Submit Application
                                    </button>
                                </form>
                            </div>
                        )}

                        {appStatus === 'pending' && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
                                <FaClock className="text-amber-500 text-3xl mx-auto mb-3" />
                                <h3 className="text-lg font-playfair font-bold text-amber-800 mb-2">Application Under Review</h3>
                                <p className="text-amber-700 text-sm leading-relaxed max-w-md mx-auto">
                                    Your application to become a Hall Manager is currently under review by our admin team. We'll notify you once a decision has been made.
                                </p>
                            </div>
                        )}

                        {appStatus === 'approved' && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
                                <FaCheckCircle className="text-emerald-500 text-3xl mx-auto mb-3" />
                                <h3 className="text-lg font-playfair font-bold text-emerald-800 mb-2">Application Approved!</h3>
                                <p className="text-emerald-700 text-sm mb-4 leading-relaxed">
                                    Congratulations! You are now a Venuora Hall Manager. You can list your halls and manage bookings from the Manager Dashboard.
                                </p>
                                <button className="btn-cta px-6 py-2.5 rounded-xl font-bold text-sm">Go to Manager Dashboard</button>
                            </div>
                        )}

                        {appStatus === 'rejected' && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                                <FaTimesCircle className="text-red-500 text-3xl mx-auto mb-3" />
                                <h3 className="text-lg font-playfair font-bold text-red-800 mb-2">Application Not Approved</h3>
                                <p className="text-red-700 text-sm leading-relaxed">
                                    Unfortunately, your application was not approved at this time. Please contact our support team for more information.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* COMPLAINTS TAB */}
                {activeTab === 'complaints' && (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1 h-7 bg-terracotta rounded-full" />
                            <h2 className="text-xl font-playfair font-bold text-navy">My Complaints</h2>
                            <span className="ml-auto text-xs font-bold bg-terracotta/10 text-terracotta px-3 py-1 rounded-full">
                                {complaints.length} total
                            </span>
                        </div>
                        {complaints.length > 0 ? (
                            <div className="space-y-4">
                                {complaints.map((complaint) => (
                                    <div key={complaint._id} className="bg-white rounded-2xl border-l-4 border-terracotta border border-gray-100 shadow-sm p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-bold text-navy">{complaint.subject}</h3>
                                                <p className="text-xs text-gray-400 mt-0.5">{new Date(complaint.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${complaint.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteComplaint(complaint._id)}
                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                    title="Delete Complaint"
                                                >
                                                    <FaTrash className="text-xs" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-gray-600 text-sm leading-relaxed">{complaint.message}</p>
                                        {complaint.adminReply && (
                                            <div className="mt-4 bg-navy/5 rounded-xl p-4 border-l-2 border-navy">
                                                <p className="text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Admin Reply</p>
                                                <p className="text-gray-700 text-sm">{complaint.adminReply}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400 text-2xl">
                                    <FaEnvelope />
                                </div>
                                <p className="text-gray-500 font-medium">No complaints yet</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Payment Upload Modal ── */}
            {showPaymentModal && selectedBooking && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fadeIn">
                        <h3 className="text-xl font-playfair font-bold text-navy mb-5">Upload Payment Proof</h3>

                        <div className="bg-terracotta/5 border border-terracotta/20 rounded-2xl p-4 mb-5">
                            <p className="text-xs font-bold uppercase tracking-wider text-terracotta mb-2">Booking Details</p>
                            <p className="text-sm text-navy font-medium">Hall: {selectedBooking.hallId?.name}</p>
                            <p className="text-sm text-gray-600">Total: Rs {(selectedBooking.totalAmount || 0).toLocaleString()}</p>
                            <p className="text-sm font-bold text-terracotta">Prebooking (10%): Rs {(selectedBooking.prebookingAmount || 0).toLocaleString()}</p>
                        </div>

                        {selectedBooking.status === 'payment_rejected' && selectedBooking.paymentRejectionReason && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
                                <p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-1">Previous Rejection Reason</p>
                                <p className="text-red-700 text-sm">{selectedBooking.paymentRejectionReason}</p>
                            </div>
                        )}

                        <form onSubmit={handlePaymentUpload} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                                    Transaction ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                    className={inputCls}
                                    placeholder="Enter your transaction ID"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                                    Payment Screenshot <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setPaymentProof(e.target.files[0])}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-terracotta/10 file:text-terracotta hover:file:bg-terracotta/20 cursor-pointer"
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">Upload a clear screenshot of your payment</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowPaymentModal(false); setTransactionId(''); setPaymentProof(null); setSelectedBooking(null); }}
                                    className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-cta px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2"
                                >
                                    <FaUpload className="text-xs" />
                                    Submit Proof
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
