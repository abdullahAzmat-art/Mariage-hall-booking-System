import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FaPlus, FaBuilding, FaMoneyBillWave, FaTrash, FaUpload, FaCheckCircle, FaClock, FaCalendarAlt, FaUtensils } from 'react-icons/fa';
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
        name: '',
        location: '',
        capacity: '',
        price: '',
        amenities: '',
        description: '',
        image: null
    });

    useEffect(() => {
        if (activeTab === 'halls') {
            fetchHalls();
        } else if (activeTab === 'bookings' || activeTab === 'payments') {
            fetchBookings();
            fetchPayments(); // Also fetch payments to show commission status
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
                fetchPayments(); // Refresh payments after completing
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
                name: '',
                location: '',
                capacity: '',
                price: '',
                amenities: '',
                description: '',
                image: null
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
            const formData = new FormData();
            // We need to send all existing data + new bookedDates
            // Or better, update the backend to accept partial updates or just bookedDates
            // For now, let's assume updateHall handles partial updates or we send what's needed.
            // Actually, the current updateHall implementation expects a FormData with all fields if we use the same endpoint.
            // However, we can just send the bookedDates if we modify the backend or use a specific endpoint.
            // But to keep it simple and consistent with current backend:
            // We will use a JSON payload if the backend supports it, but the controller uses req.body and req.file.
            // Let's check updateHall in backend... it uses req.body.amenities etc.
            // It does NOT require all fields to be present, it updates what is passed.
            // EXCEPT image, which it checks.

            // So we can just send bookedDates.
            // But wait, the controller expects multipart/form-data because of the image upload middleware usually?
            // If we send JSON, multer might not be involved or might pass it through.
            // Let's try sending JSON first. If it fails, we'll use FormData.

            // Actually, let's use the service.
            // hallService.updateHall takes (id, hallData).
            // We should check hallService.js to see how it sends data.

            await hallService.updateHall(selectedHallForAvailability._id, { bookedDates: availabilityDates });

            toast.success('Availability updated successfully');
            setShowAvailabilityModal(false);
            fetchHalls();
        } catch (error) {
            console.error('Update availability error:', error);
            toast.error('Failed to update availability');
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-500">Total Bookings</h3>
                        <FaBuilding className="text-primary text-xl" />
                    </div>
                    <p className="text-3xl font-bold text-text">{bookings.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-500">Active Halls</h3>
                        <FaBuilding className="text-blue-500 text-xl" />
                    </div>
                    <p className="text-3xl font-bold text-text">{halls.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-500">Revenue</h3>
                        <FaMoneyBillWave className="text-green-500 text-xl" />
                    </div>
                    <p className="text-3xl font-bold text-text">Rs {bookings.reduce((total, booking) => total + (booking.totalAmount || 0), 0).toLocaleString()}</p>
                </div>
            </div>

            <div className="flex space-x-4 overflow-x-auto pb-2">
                <button
                    onClick={() => setActiveTab('bookings')}
                    className={`px-6 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${activeTab === 'bookings' ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                    Manage Bookings
                </button>
                <button
                    onClick={() => setActiveTab('halls')}
                    className={`px-6 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${activeTab === 'halls' ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                    Manage Halls
                </button>
                <button
                    onClick={() => setActiveTab('commissions')}
                    className={`px-6 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${activeTab === 'commissions' ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                    Commission Payments
                </button>
                <button
                    onClick={() => setActiveTab('payments')}
                    className={`px-6 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${activeTab === 'payments' ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                    Payment Verification
                </button>
                <Link
                    to={"/message"}
                    className={`px-6 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${activeTab === 'payments' ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                    Message
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 min-h-[400px]">
                {activeTab === 'bookings' && (
                    <div>
                        <h2 className="text-xl font-bold text-text mb-6">Manage Bookings</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 font-medium">
                                    <tr>
                                        <th className="p-4">ID</th>
                                        <th className="p-4">Customer</th>
                                        <th className="p-4">Hall</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Total Amount</th>
                                        <th className="p-4">Commission (5%)</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Commission Status</th>
                                        <th className="p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {bookings.length > 0 ? (
                                        bookings.map((booking) => {
                                            const commissionAmount = booking.totalAmount * 0.05;
                                            const commissionPayment = payments.find(p => p.bookingId?._id === booking._id);

                                            return (
                                                <tr key={booking._id} className="hover:bg-gray-50">
                                                    <td className="p-4">#{booking._id.slice(-6)}</td>
                                                    <td className="p-4">{booking.customerId?.name || 'N/A'}</td>
                                                    <td className="p-4">{booking.hallId?.name || 'N/A'}</td>
                                                    <td className="p-4">{new Date(booking.eventDate).toLocaleDateString()}</td>
                                                    <td className="p-4 font-bold text-green-600">Rs {(booking.totalAmount || 0).toLocaleString()}</td>
                                                    <td className="p-4">
                                                        {booking.status !== 'rejected' && booking.status !== 'payment_rejected' ? (
                                                            <span className="font-bold text-primary">Rs {commissionAmount.toLocaleString()}</span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${booking.status === 'completed' ? 'text-blue-600 bg-blue-100' :
                                                            booking.status === 'approved' ? 'text-green-600 bg-green-100' :
                                                                booking.status === 'rejected' ? 'text-red-600 bg-red-100' :
                                                                    'text-yellow-600 bg-yellow-100'
                                                            }`}>
                                                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        {booking.status === 'completed' ? (
                                                            commissionPayment ? (
                                                                commissionPayment.status === 'verified' ? (
                                                                    <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700">
                                                                        ✓ Verified
                                                                    </span>
                                                                ) : commissionPayment.status === 'rejected' ? (
                                                                    <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700">
                                                                        ✗ Rejected
                                                                    </span>
                                                                ) : commissionPayment.paymentProof ? (
                                                                    <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">
                                                                        ⏳ Pending Review
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-2 py-1 rounded text-xs font-bold bg-orange-100 text-orange-700">
                                                                        ⚠️ Payment Due
                                                                    </span>
                                                                )
                                                            ) : (
                                                                <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700">
                                                                    ✗ Not Created
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex space-x-2">
                                                            {booking.status === 'pending' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleApprove(booking._id)}
                                                                        className="text-green-600 hover:bg-green-50 px-3 py-1 rounded text-sm font-bold border border-green-200 mr-2"
                                                                        title="Accept Booking Request"
                                                                    >
                                                                        Accept
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleReject(booking._id)}
                                                                        className="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm font-bold border border-red-200"
                                                                        title="Reject Booking Request"
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            )}
                                                            {booking.customFoodStatus === 'pending' && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedBookingForFood(booking);
                                                                        setShowFoodReviewModal(true);
                                                                    }}
                                                                    className="text-purple-600 hover:bg-purple-50 px-3 py-1 rounded text-sm font-bold"
                                                                >
                                                                    Review Food
                                                                </button>
                                                            )}
                                                            {booking.status === 'approved' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleComplete(booking._id)}
                                                                        className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded text-sm"
                                                                    >
                                                                        Complete
                                                                    </button>
                                                                </>
                                                            )}
                                                            {booking.status === 'rejected' && (
                                                                <button
                                                                    onClick={() => handleDeleteBooking(booking._id)}
                                                                    className="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm"
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="p-4 text-center text-gray-500">
                                                No bookings found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'halls' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-text">Manage Halls</h2>
                            <button
                                onClick={() => setShowAddHallForm(!showAddHallForm)}
                                className="btn-primary flex items-center px-4 py-2 text-sm"
                            >
                                <FaPlus className="mr-2" /> {showAddHallForm ? 'Cancel' : 'Add New Hall'}
                            </button>
                        </div>

                        {showAddHallForm ? (
                            <form onSubmit={handleCreateHall} className="max-w-2xl space-y-4 mb-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hall Name</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                            value={hallForm.name}
                                            onChange={(e) => setHallForm({ ...hallForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                            value={hallForm.location}
                                            onChange={(e) => setHallForm({ ...hallForm, location: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                            value={hallForm.capacity}
                                            onChange={(e) => setHallForm({ ...hallForm, capacity: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Price per Seat</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                            value={hallForm.price}
                                            onChange={(e) => setHallForm({ ...hallForm, price: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amenities (comma separated)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                        placeholder="AC, Parking, WiFi"
                                        value={hallForm.amenities}
                                        onChange={(e) => setHallForm({ ...hallForm, amenities: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hall Image</label>
                                    <input
                                        type="file"
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                        onChange={(e) => setHallForm({ ...hallForm, image: e.target.files[0] })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        rows="4"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                        value={hallForm.description}
                                        onChange={(e) => setHallForm({ ...hallForm, description: e.target.value })}
                                    ></textarea>
                                </div>
                                <button type="submit" className="btn-primary px-6 py-2">Create Hall</button>
                            </form>
                        ) : null}

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 font-medium">
                                    <tr>
                                        <th className="p-4">Name</th>
                                        <th className="p-4">Location</th>
                                        <th className="p-4">Capacity</th>
                                        <th className="p-4">Price</th>
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
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleDeleteHall(hall._id)}
                                                    className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                                                    title="Delete Hall"
                                                >
                                                    <FaTrash />
                                                </button>
                                                <button
                                                    onClick={() => handleAvailabilityClick(hall)}
                                                    className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition-colors ml-2"
                                                    title="Manage Availability"
                                                >
                                                    <FaCalendarAlt />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedHallForMenu(hall);
                                                        setShowMenuModal(true);
                                                    }}
                                                    className="text-purple-500 hover:bg-purple-50 p-2 rounded-full transition-colors ml-2"
                                                    title="Manage Menu"
                                                >
                                                    <FaUtensils />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {halls.length === 0 && !showAddHallForm && (
                                <p className="text-center text-gray-500 py-4">No halls found. Click "Add New Hall" to create one.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'commissions' && (
                    <div>
                        <h2 className="text-xl font-bold text-text mb-6">Commission Payments</h2>
                        <div className="space-y-4">
                            {payments.length > 0 ? (
                                payments.map((payment) => (
                                    <div key={payment._id} className="border border-gray-200 rounded-lg p-6 bg-white">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg">Booking #{payment.bookingId?._id?.slice(-6)}</h3>
                                                <p className="text-sm text-gray-600">Commission Amount: <span className="font-bold text-primary">Rs {payment.amount.toLocaleString()}</span></p>
                                                <p className="text-xs text-gray-400">Due Date: {new Date(payment.dueDate).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {payment.status === 'pending' && <FaClock className="text-yellow-500" />}
                                                {payment.status === 'verified' && <FaCheckCircle className="text-green-500" />}
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${payment.status === 'verified' ? 'bg-green-100 text-green-700' :
                                                    payment.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {payment.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>

                                        {payment.status === 'pending' && (
                                            <div className="mt-4 bg-orange-50 border border-orange-200 p-4 rounded-lg">
                                                <h4 className="font-bold text-orange-800 mb-2">⚠️ Payment Required - Transfer Details</h4>
                                                <div className="space-y-1 text-sm text-orange-900">
                                                    <p><span className="font-semibold">Bank Name:</span> HBL Bank</p>
                                                    <p><span className="font-semibold">Account Title:</span> Marriage Hall Admin</p>
                                                    <p><span className="font-semibold">Account Number:</span> 1234-5678-9012-3456</p>
                                                    <p><span className="font-semibold">Amount to Transfer:</span> Rs {payment.amount.toLocaleString()}</p>
                                                </div>
                                                <p className="text-xs text-red-600 font-bold mt-3">
                                                    ⏰ Warning: If payment is not verified within 2 days, your hall and account will be automatically deleted!
                                                </p>
                                            </div>
                                        )}

                                        {payment.status === 'pending' && !payment.paymentProof && (
                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Bank Transfer Proof</label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-200"
                                                    onChange={(e) => {
                                                        if (e.target.files[0]) {
                                                            handleUploadProof(payment._id, e.target.files[0]);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {payment.paymentProof && payment.status === 'pending' && (
                                            <div className="mt-4 bg-blue-50 p-3 rounded">
                                                <p className="text-sm text-blue-800">✓ Payment proof uploaded. Waiting for admin verification.</p>
                                            </div>
                                        )}

                                        {payment.status === 'rejected' && payment.rejectionReason && (
                                            <div className="mt-4 bg-red-50 p-3 rounded">
                                                <p className="text-sm font-bold text-red-800">Rejection Reason:</p>
                                                <p className="text-sm text-red-700">{payment.rejectionReason}</p>
                                            </div>
                                        )}

                                        {payment.status === 'verified' && (
                                            <div className="mt-4 bg-green-50 p-3 rounded">
                                                <p className="text-sm text-green-800">✓ Payment verified by admin</p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-8">No commission payments yet</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'payments' && (
                    <div>
                        <h2 className="text-xl font-bold text-text mb-6">Payment Verification</h2>
                        <div className="space-y-4">
                            {bookings.filter(b => b.status === 'payment_submitted').length > 0 ? (
                                bookings.filter(b => b.status === 'payment_submitted').map((booking) => (
                                    <div key={booking._id} className="border border-gray-200 rounded-lg p-6 bg-white">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h3 className="font-bold text-lg mb-4">Booking Details</h3>
                                                <div className="space-y-2 text-sm">
                                                    <p><span className="font-semibold">Booking ID:</span> #{booking._id.slice(-6)}</p>
                                                    <p><span className="font-semibold">Customer:</span> {booking.customerId?.name || 'N/A'}</p>
                                                    <p><span className="font-semibold">Email:</span> {booking.customerId?.email || 'N/A'}</p>
                                                    <p><span className="font-semibold">Hall:</span> {booking.hallId?.name || 'N/A'}</p>
                                                    <p><span className="font-semibold">Event Date:</span> {new Date(booking.eventDate).toLocaleDateString()}</p>
                                                    <p><span className="font-semibold">Total Amount:</span> <span className="text-green-600 font-bold">Rs {(booking.totalAmount || 0).toLocaleString()}</span></p>
                                                    <p><span className="font-semibold">Prebooking Amount (10%):</span> <span className="text-primary font-bold">Rs {(booking.prebookingAmount || 0).toLocaleString()}</span></p>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="font-bold text-lg mb-4">Payment Information</h3>
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">Transaction ID:</p>
                                                        <p className="text-sm bg-gray-50 p-2 rounded border border-gray-200 font-mono">{booking.transactionId || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                                            <button
                                                onClick={() => {
                                                    setSelectedBooking(booking);
                                                    setShowRejectModal(true);
                                                }}
                                                className="px-6 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors"
                                            >
                                                Reject Payment
                                            </button>
                                            <button
                                                onClick={() => handleVerifyPayment(booking._id)}
                                                className="px-6 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors"
                                            >
                                                Verify Payment
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-8">No payments awaiting verification</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-text mb-4">Reject Payment</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Please provide a reason for rejecting this payment. The customer will see this message.
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary mb-4"
                            rows="4"
                            placeholder="e.g., Transaction ID does not match, Payment amount is incorrect, etc."
                        />
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason('');
                                    setSelectedBooking(null);
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectPayment}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Availability Modal */}
            {showAvailabilityModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-text mb-4">Manage Availability</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Select dates to mark as booked (Red). Unselected dates are available (Green).
                        </p>
                        <div className="flex justify-center mb-4">
                            <Calendar
                                onClickDay={handleDateChange}
                                tileClassName={({ date, view }) => {
                                    if (view === 'month') {
                                        const dateString = date.toISOString().split('T')[0];
                                        return availabilityDates.includes(dateString) ? 'bg-red-100 text-red-600 rounded-full font-bold' : 'text-green-600 font-bold';
                                    }
                                }}
                            />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowAvailabilityModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAvailability}
                                className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Menu Management Modal */}
            {showMenuModal && selectedHallForMenu && (
                <MenuManagementModal
                    hall={selectedHallForMenu}
                    onClose={() => {
                        setShowMenuModal(false);
                        setSelectedHallForMenu(null);
                    }}
                    onSuccess={() => {
                        setShowMenuModal(false);
                        setSelectedHallForMenu(null);
                        fetchHalls();
                    }}
                />
            )}

            {/* Custom Food Review Modal */}
            {showFoodReviewModal && selectedBookingForFood && (
                <CustomFoodReviewModal
                    booking={selectedBookingForFood}
                    onClose={() => {
                        setShowFoodReviewModal(false);
                        setSelectedBookingForFood(null);
                    }}
                    onSuccess={() => {
                        setShowFoodReviewModal(false);
                        setSelectedBookingForFood(null);
                        fetchBookings();
                    }}
                />
            )}
        </div>
    );
};

export default ManagerDashboard;
