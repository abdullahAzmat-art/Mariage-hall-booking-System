import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
    FaPlus, FaBuilding, FaMoneyBillWave, FaTrash, FaUpload, 
    FaCheckCircle, FaClock, FaCalendarAlt, FaUtensils, FaTimesCircle, FaCommentAlt
} from 'react-icons/fa';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import hallService from '../services/hallService';
import bookingService from '../services/bookingService';
import commissionService from '../services/commissionService';
import MenuManagementModal from './MenuManagementModal';
import CustomFoodReviewModal from './CustomFoodReviewModal';
import { Link } from 'react-router-dom';

const ManagerDashboard = () => {
    const [activeTab, setActiveTab] = useState('bookings');
    const [halls, setHalls] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [payments, setPayments] = useState([]);
    const [showAddHallForm, setShowAddHallForm] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
    const [selectedHallForAvailability, setSelectedHallForAvailability] = useState(null);
    const [availabilityDates, setAvailabilityDates] = useState([]);
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [selectedHallForMenu, setSelectedHallForMenu] = useState(null);
    const [showFoodReviewModal, setShowFoodReviewModal] = useState(false);
    const [selectedBookingForFood, setSelectedBookingForFood] = useState(null);
    const [hallForm, setHallForm] = useState({
        name: '', location: '', capacity: '', price: '',
        amenities: '', description: '', image: null
    });

    useEffect(() => {
        if (activeTab === 'halls') {
            fetchHalls();
        } else if (activeTab === 'bookings' || activeTab === 'payments') {
            fetchBookings();
            fetchPayments();
        } else if (activeTab === 'commissions') {
            fetchPayments();
        }
    }, [activeTab]);

    const fetchHalls = async () => {
        try {
            const data = await hallService.getManagerHalls();
            setHalls(data);
        } catch (error) {
            console.error('Failed to fetch halls', error);
        }
    };

    const fetchBookings = async () => {
        try {
            const data = await bookingService.getManagerBookings();
            setBookings(data);
        } catch (error) {
            console.error('Failed to fetch bookings', error);
        }
    };

    const fetchPayments = async () => {
        try {
            const data = await commissionService.getManagerPayments();
            setPayments(data);
        } catch (error) {
            console.error('Failed to fetch payments', error);
        }
    };

    const handleUploadProof = async (paymentId, file) => {
        try {
            const formData = new FormData();
            formData.append('paymentProof', file);
            await commissionService.uploadPaymentProof(paymentId, formData);
            toast.success('Payment proof uploaded successfully');
            fetchPayments();
        } catch (error) {
            toast.error('Failed to upload payment proof');
        }
    };

    const handleApprove = async (bookingId) => {
        try {
            await bookingService.updateBookingStatus(bookingId, 'awaiting_payment');
            toast.success('Booking approved. Waiting for customer payment.');
            fetchBookings();
        } catch (error) {
            console.error('Approve error:', error);
            toast.error(error.response?.data?.message || 'Failed to approve booking');
        }
    };

    const handleReject = async (bookingId) => {
        if (window.confirm('Are you sure you want to reject and delete this booking?')) {
            try {
                await bookingService.deleteBooking(bookingId);
                toast.success('Booking rejected and deleted successfully');
                fetchBookings();
            } catch (error) {
                console.error('Reject error:', error);
                toast.error(error.response?.data?.message || 'Failed to reject booking');
            }
        }
    };

    const handleComplete = async (bookingId) => {
        if (window.confirm('Mark this booking as completed?')) {
            try {
                await bookingService.updateBookingStatus(bookingId, 'completed');
                toast.success('Booking marked as completed');
                fetchBookings();
                fetchPayments();
            } catch (error) {
                console.error('Complete error:', error);
                toast.error(error.response?.data?.message || 'Failed to mark as complete');
            }
        }
    };

    const handleDeleteBooking = async (bookingId) => {
        if (window.confirm('Are you sure you want to delete this booking?')) {
            try {
                await bookingService.deleteBooking(bookingId);
                toast.success('Booking deleted successfully');
                fetchBookings();
            } catch (error) {
                console.error('Delete error:', error);
                toast.error(error.response?.data?.message || 'Failed to delete booking');
            }
        }
    };

    const handleDeleteHall = async (hallId) => {
        if (window.confirm('Are you sure you want to delete this hall?')) {
            try {
                await hallService.deleteHall(hallId);
                setHalls(halls.filter(hall => hall._id !== hallId));
                toast.success('Hall deleted successfully');
            } catch (error) {
                toast.error('Failed to delete hall');
            }
        }
    };

    const handleCreateHall = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', hallForm.name);
            formData.append('location', hallForm.location);
            formData.append('capacity', hallForm.capacity);
            formData.append('price', hallForm.price);
            formData.append('description', hallForm.description);
            formData.append('image', hallForm.image);

            const amenitiesArray = hallForm.amenities.split(',').map(item => item.trim());
            amenitiesArray.forEach((amenity) => {
                formData.append('amenities', amenity);
            });

            const user = JSON.parse(sessionStorage.getItem('user'));
            if (user && user._id) {
                formData.append('manager', user._id);
            }

            await hallService.createHall(formData);
            toast.success('Hall created successfully!');
            fetchHalls();
            setShowAddHallForm(false);
            setHallForm({
                name: '', location: '', capacity: '', price: '',
                amenities: '', description: '', image: null
            });
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to create hall';
            toast.error(message);
            console.error(error);
        }
    };

    const handleVerifyPayment = async (bookingId) => {
        try {
            await bookingService.verifyPayment(bookingId);
            toast.success('Payment verified successfully!');
            fetchBookings();
        } catch (error) {
            console.error('Verify payment error:', error);
            toast.error(error.response?.data?.message || 'Failed to verify payment');
        }
    };

    const handleRejectPayment = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }
        try {
            await bookingService.rejectPayment(selectedBooking._id, rejectionReason);
            toast.success('Payment rejected successfully');
            setShowRejectModal(false);
            setRejectionReason('');
            setSelectedBooking(null);
            fetchBookings();
        } catch (error) {
            console.error('Reject payment error:', error);
            toast.error(error.response?.data?.message || 'Failed to reject payment');
        }
    };

    const handleAvailabilityClick = (hall) => {
        setSelectedHallForAvailability(hall);
        setAvailabilityDates(hall.bookedDates || []);
        setShowAvailabilityModal(true);
    };

    const handleDateChange = (date) => {
        const dateString = date.toISOString().split('T')[0];
        if (availabilityDates.includes(dateString)) {
            setAvailabilityDates(availabilityDates.filter(d => d !== dateString));
        } else {
            setAvailabilityDates([...availabilityDates, dateString]);
        }
    };

    const handleSaveAvailability = async () => {
        try {
            await hallService.updateHall(selectedHallForAvailability._id, { bookedDates: availabilityDates });
            toast.success('Availability updated successfully');
            setShowAvailabilityModal(false);
            fetchHalls();
        } catch (error) {
            console.error('Update availability error:', error);
            toast.error('Failed to update availability');
        }
    };

    const totalRevenue = bookings.reduce((total, booking) => total + (booking.totalAmount || 0), 0);

    const tabs = [
        { id: 'bookings', label: 'Manage Bookings', icon: FaCalendarAlt },
        { id: 'halls', label: 'Manage Halls', icon: FaBuilding },
        { id: 'commissions', label: 'Commission Payments', icon: FaMoneyBillWave },
        { id: 'payments', label: 'Payment Verification', icon: FaCheckCircle },
    ];

    const thCls = "px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 text-left";
    const tdCls = "px-4 py-4 text-sm text-gray-700";
    const inputCls = "w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-navy text-sm font-medium focus:bg-white focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 transition-all placeholder-gray-400";

    return (
        <div className="space-y-6">
            {/* ── Stats Row ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 border-l-4 border-l-navy flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-navy/10 text-navy flex items-center justify-center shrink-0">
                        <FaBuilding className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-0.5">Total Bookings</p>
                        <p className="text-3xl font-playfair font-bold text-navy">{bookings.length}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 border-l-4 border-l-blue-500 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FaBuilding className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-0.5">Active Halls</p>
                        <p className="text-3xl font-playfair font-bold text-navy">{halls.length}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 border-l-4 border-l-emerald-500 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <FaMoneyBillWave className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-0.5">Total Revenue</p>
                        <p className="text-2xl font-playfair font-bold text-navy">Rs {totalRevenue.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* ── Tab Navigation ── */}
            <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex gap-1 overflow-x-auto scrollbar-none items-center">
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
                <Link
                    to="/message"
                    className="ml-auto mr-1 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap text-terracotta bg-terracotta/10 hover:bg-terracotta/20 transition-all duration-200"
                >
                    <FaCommentAlt className="text-xs" />
                    Messages
                </Link>
            </div>

            {/* ── Content Panel ── */}
            <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 sm:p-8 min-h-[500px]">
                
                {/* BOOKINGS */}
                {activeTab === 'bookings' && (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1 h-7 bg-terracotta rounded-full" />
                            <h2 className="text-xl font-playfair font-bold text-navy">Manage Bookings</h2>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-gray-100">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className={thCls}>ID</th>
                                        <th className={thCls}>Customer</th>
                                        <th className={thCls}>Hall</th>
                                        <th className={thCls}>Date</th>
                                        <th className={thCls}>Total Amount</th>
                                        <th className={thCls}>Commission (5%)</th>
                                        <th className={thCls}>Status</th>
                                        <th className={thCls}>Com. Status</th>
                                        <th className={thCls}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {bookings.length > 0 ? bookings.map((booking) => {
                                        const commissionAmount = booking.totalAmount * 0.05;
                                        const commissionPayment = payments.find(p => p.bookingId?._id === booking._id);

                                        return (
                                            <tr key={booking._id} className="hover:bg-ivory-warm transition-colors">
                                                <td className={tdCls + " font-medium"}>#{booking._id.slice(-6)}</td>
                                                <td className={tdCls}>{booking.customerId?.name || 'N/A'}</td>
                                                <td className={tdCls}>{booking.hallId?.name || 'N/A'}</td>
                                                <td className={tdCls}>{new Date(booking.eventDate).toLocaleDateString()}</td>
                                                <td className={tdCls + " font-bold text-emerald-600"}>Rs {(booking.totalAmount || 0).toLocaleString()}</td>
                                                <td className={tdCls}>
                                                    {booking.status !== 'rejected' && booking.status !== 'payment_rejected' ? (
                                                        <span className="font-bold text-terracotta">Rs {commissionAmount.toLocaleString()}</span>
                                                    ) : <span className="text-gray-400">-</span>}
                                                </td>
                                                <td className={tdCls}>
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${
                                                        booking.status === 'completed' ? 'text-blue-700 bg-blue-100' :
                                                        booking.status === 'approved' ? 'text-emerald-700 bg-emerald-100' :
                                                        booking.status === 'rejected' ? 'text-red-700 bg-red-100' :
                                                        'text-amber-700 bg-amber-100'
                                                    }`}>
                                                        {booking.status.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className={tdCls}>
                                                    {booking.status === 'completed' ? (
                                                        commissionPayment ? (
                                                            commissionPayment.status === 'verified' ? (
                                                                <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-emerald-100 text-emerald-700 whitespace-nowrap">✓ Verified</span>
                                                            ) : commissionPayment.status === 'rejected' ? (
                                                                <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-red-100 text-red-700 whitespace-nowrap">✗ Rejected</span>
                                                            ) : commissionPayment.paymentProof ? (
                                                                <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-blue-100 text-blue-700 whitespace-nowrap">⏳ Pending Review</span>
                                                            ) : (
                                                                <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-orange-100 text-orange-700 whitespace-nowrap">⚠️ Payment Due</span>
                                                            )
                                                        ) : (
                                                            <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-red-100 text-red-700 whitespace-nowrap">✗ Not Created</span>
                                                        )
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className={tdCls}>
                                                    <div className="flex flex-wrap gap-2">
                                                        {booking.status === 'pending' && (
                                                            <>
                                                                <button onClick={() => handleApprove(booking._id)} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors">Accept</button>
                                                                <button onClick={() => handleReject(booking._id)} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors">Reject</button>
                                                            </>
                                                        )}
                                                        {booking.customFoodStatus === 'pending' && (
                                                            <button onClick={() => { setSelectedBookingForFood(booking); setShowFoodReviewModal(true); }} className="px-3 py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg text-xs font-bold transition-colors">Review Food</button>
                                                        )}
                                                        {booking.status === 'approved' && (
                                                            <button onClick={() => handleComplete(booking._id)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors">Complete</button>
                                                        )}
                                                        {booking.status === 'rejected' && (
                                                            <button onClick={() => handleDeleteBooking(booking._id)} className="px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-xs font-bold transition-colors">Delete</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr><td colSpan="9" className="p-8 text-center text-gray-400">No bookings found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* HALLS */}
                {activeTab === 'halls' && (
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-7 bg-terracotta rounded-full" />
                                <h2 className="text-xl font-playfair font-bold text-navy">Manage Halls</h2>
                            </div>
                            <button
                                onClick={() => setShowAddHallForm(!showAddHallForm)}
                                className="btn-cta px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                            >
                                <FaPlus className={showAddHallForm ? 'rotate-45 transition-transform' : 'transition-transform'} />
                                {showAddHallForm ? 'Cancel' : 'Add New Hall'}
                            </button>
                        </div>

                        {showAddHallForm && (
                            <form onSubmit={handleCreateHall} className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6 mb-8">
                                <h3 className="font-bold text-navy mb-4">Create New Hall</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Hall Name</label>
                                        <input type="text" required className={inputCls} value={hallForm.name} onChange={(e) => setHallForm({ ...hallForm, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Location</label>
                                        <input type="text" required className={inputCls} value={hallForm.location} onChange={(e) => setHallForm({ ...hallForm, location: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Capacity</label>
                                        <input type="number" required className={inputCls} value={hallForm.capacity} onChange={(e) => setHallForm({ ...hallForm, capacity: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Price per Seat</label>
                                        <input type="number" required className={inputCls} value={hallForm.price} onChange={(e) => setHallForm({ ...hallForm, price: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Amenities (comma separated)</label>
                                        <input type="text" className={inputCls} placeholder="AC, Parking, WiFi" value={hallForm.amenities} onChange={(e) => setHallForm({ ...hallForm, amenities: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Hall Image</label>
                                        <input type="file" required className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-terracotta/10 file:text-terracotta hover:file:bg-terracotta/20 cursor-pointer" onChange={(e) => setHallForm({ ...hallForm, image: e.target.files[0] })} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Description</label>
                                        <textarea rows="4" className={`${inputCls} py-3 h-auto resize-none`} value={hallForm.description} onChange={(e) => setHallForm({ ...hallForm, description: e.target.value })}></textarea>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button type="submit" className="btn-cta px-8 py-3 rounded-xl font-bold text-sm">Create Hall</button>
                                </div>
                            </form>
                        )}

                        <div className="overflow-x-auto rounded-2xl border border-gray-100">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className={thCls}>Name</th>
                                        <th className={thCls}>Location</th>
                                        <th className={thCls}>Capacity</th>
                                        <th className={thCls}>Price</th>
                                        <th className={thCls}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {halls.map(hall => (
                                        <tr key={hall._id} className="hover:bg-ivory-warm transition-colors">
                                            <td className={tdCls + " font-semibold text-navy"}>{hall.name}</td>
                                            <td className={tdCls}>{hall.location}</td>
                                            <td className={tdCls}>
                                                <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-full">{hall.capacity}</span>
                                            </td>
                                            <td className={tdCls + " font-bold text-terracotta"}>Rs {hall.price}</td>
                                            <td className={tdCls}>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleDeleteHall(hall._id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Delete Hall"><FaTrash /></button>
                                                    <button onClick={() => handleAvailabilityClick(hall)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors" title="Manage Availability"><FaCalendarAlt /></button>
                                                    <button onClick={() => { setSelectedHallForMenu(hall); setShowMenuModal(true); }} className="text-purple-500 hover:text-purple-700 hover:bg-purple-50 p-2 rounded-lg transition-colors" title="Manage Menu"><FaUtensils /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {halls.length === 0 && !showAddHallForm && (
                                        <tr><td colSpan="5" className="p-8 text-center text-gray-400">No halls found. Click "Add New Hall" to create one.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* COMMISSIONS */}
                {activeTab === 'commissions' && (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1 h-7 bg-terracotta rounded-full" />
                            <h2 className="text-xl font-playfair font-bold text-navy">Commission Payments</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {payments.length > 0 ? payments.map((payment) => (
                                <div key={payment._id} className="border border-gray-100 rounded-2xl p-6 bg-white shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-navy text-lg">Booking #{payment.bookingId?._id?.slice(-6)}</h3>
                                                <p className="text-xs text-gray-400 mt-1">Due Date: {new Date(payment.dueDate).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {payment.status === 'pending' && <FaClock className="text-amber-500" />}
                                                {payment.status === 'verified' && <FaCheckCircle className="text-emerald-500" />}
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                                                    payment.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                                                    payment.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {payment.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                                            <p className="text-sm text-gray-500 mb-1">Commission Amount</p>
                                            <p className="text-2xl font-playfair font-bold text-terracotta">Rs {payment.amount.toLocaleString()}</p>
                                        </div>

                                        {payment.status === 'pending' && (
                                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-4">
                                                <h4 className="font-bold text-amber-800 text-sm mb-2">⚠️ Transfer Details</h4>
                                                <div className="space-y-1 text-xs text-amber-900 mb-3">
                                                    <p><span className="font-semibold">Bank:</span> HBL Bank</p>
                                                    <p><span className="font-semibold">Title:</span> Venuora Admin</p>
                                                    <p><span className="font-semibold">Account:</span> 1234-5678-9012-3456</p>
                                                </div>
                                                <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider">
                                                    Note: Pay within 2 days to avoid account suspension.
                                                </p>
                                            </div>
                                        )}

                                        {payment.status === 'pending' && !payment.paymentProof && (
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Upload Transfer Proof</label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-terracotta/10 file:text-terracotta hover:file:bg-terracotta/20 cursor-pointer"
                                                    onChange={(e) => {
                                                        if (e.target.files[0]) handleUploadProof(payment._id, e.target.files[0]);
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {payment.paymentProof && payment.status === 'pending' && (
                                            <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex items-center gap-2">
                                                <FaClock className="text-blue-500 text-sm" />
                                                <p className="text-xs font-medium text-blue-800">Proof uploaded. Awaiting admin review.</p>
                                            </div>
                                        )}
                                        {payment.status === 'rejected' && payment.rejectionReason && (
                                            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                                <p className="text-xs font-bold uppercase tracking-wider text-red-800 mb-1">Rejection Reason</p>
                                                <p className="text-sm text-red-700">{payment.rejectionReason}</p>
                                            </div>
                                        )}
                                        {payment.status === 'verified' && (
                                            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-2">
                                                <FaCheckCircle className="text-emerald-500 text-sm" />
                                                <p className="text-xs font-medium text-emerald-800">Payment verified successfully.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-1 md:col-span-2 text-center py-16">
                                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400 text-2xl"><FaMoneyBillWave /></div>
                                    <p className="text-gray-500 font-medium">No commission payments yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* PAYMENTS VERIFICATION */}
                {activeTab === 'payments' && (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1 h-7 bg-terracotta rounded-full" />
                            <h2 className="text-xl font-playfair font-bold text-navy">Customer Payment Verification</h2>
                        </div>
                        <div className="space-y-5">
                            {bookings.filter(b => b.status === 'payment_submitted').length > 0 ? (
                                bookings.filter(b => b.status === 'payment_submitted').map((booking) => (
                                    <div key={booking._id} className="border border-gray-100 rounded-2xl p-6 bg-white shadow-sm">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h3 className="font-bold text-navy text-lg mb-4">Booking Details</h3>
                                                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm border border-gray-100">
                                                    <div className="flex justify-between"><span className="text-gray-500">ID</span><span className="font-medium text-navy">#{booking._id.slice(-6)}</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-medium text-navy">{booking.customerId?.name || 'N/A'}</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-500">Event Date</span><span className="font-medium text-navy">{new Date(booking.eventDate).toLocaleDateString()}</span></div>
                                                    <div className="border-t border-gray-200 my-2 pt-2 flex justify-between"><span className="text-gray-500 font-bold">Total Amount</span><span className="font-bold text-emerald-600">Rs {(booking.totalAmount || 0).toLocaleString()}</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-500 font-bold">Prebooking (10%)</span><span className="font-bold text-terracotta">Rs {(booking.prebookingAmount || 0).toLocaleString()}</span></div>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-navy text-lg mb-4">Payment Proof</h3>
                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm">
                                                    <p className="mb-2"><span className="text-gray-500">Transaction ID:</span> <span className="font-mono font-medium text-navy bg-white px-2 py-0.5 rounded border border-gray-200">{booking.transactionId}</span></p>
                                                    <img src={`https://mariage-hall-booking-system.vercel.app/${booking.paymentProof}`} alt="Proof" className="w-full max-w-sm rounded-lg border border-gray-200 mt-3" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-100">
                                            <button onClick={() => { setSelectedBooking(booking); setShowRejectModal(true); }} className="px-6 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors">Reject Payment</button>
                                            <button onClick={() => handleVerifyPayment(booking._id)} className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors">Verify Payment</button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-16">
                                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400 text-2xl"><FaCheckCircle /></div>
                                    <p className="text-gray-500 font-medium">No payments awaiting verification</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-playfair font-bold text-navy mb-3">Reject Payment</h3>
                        <p className="text-sm text-gray-600 mb-5">Please provide a reason for rejecting this payment. The customer will see this message.</p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className={`${inputCls} py-3 h-auto resize-none mb-5`}
                            rows="4"
                            placeholder="e.g., Transaction ID does not match, amount incorrect..."
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => { setShowRejectModal(false); setRejectionReason(''); setSelectedBooking(null); }} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold text-sm">Cancel</button>
                            <button onClick={handleRejectPayment} className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600">Confirm Rejection</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Availability Modal */}
            {showAvailabilityModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-playfair font-bold text-navy mb-3">Manage Availability</h3>
                        <p className="text-sm text-gray-600 mb-5">Select dates to mark as booked (Red). Unselected dates are available.</p>
                        <div className="flex justify-center mb-6 overflow-hidden rounded-2xl border border-gray-200">
                            <Calendar
                                onClickDay={handleDateChange}
                                className="border-none w-full !font-body"
                                tileClassName={({ date, view }) => {
                                    if (view === 'month') {
                                        const dateString = date.toISOString().split('T')[0];
                                        return availabilityDates.includes(dateString) 
                                            ? 'bg-red-100 !text-red-600 rounded-full font-bold' 
                                            : '!text-emerald-600 font-bold';
                                    }
                                }}
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowAvailabilityModal(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold text-sm">Cancel</button>
                            <button onClick={handleSaveAvailability} className="btn-cta px-5 py-2.5 rounded-xl font-bold text-sm">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {showMenuModal && selectedHallForMenu && (
                <MenuManagementModal
                    hall={selectedHallForMenu}
                    onClose={() => { setShowMenuModal(false); setSelectedHallForMenu(null); }}
                    onSuccess={() => { setShowMenuModal(false); setSelectedHallForMenu(null); fetchHalls(); }}
                />
            )}

            {showFoodReviewModal && selectedBookingForFood && (
                <CustomFoodReviewModal
                    booking={selectedBookingForFood}
                    onClose={() => { setShowFoodReviewModal(false); setSelectedBookingForFood(null); }}
                    onSuccess={() => { setShowFoodReviewModal(false); setSelectedBookingForFood(null); fetchBookings(); }}
                />
            )}
        </div>
    );
};

export default ManagerDashboard;
