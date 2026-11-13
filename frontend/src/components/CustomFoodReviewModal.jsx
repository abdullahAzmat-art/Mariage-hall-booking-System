import React, { useState } from 'react';
import { FaTimes, FaCheck, FaTimesCircle, FaUtensils } from 'react-icons/fa';
import bookingService from '../services/bookingService';

const CustomFoodReviewModal = ({ booking, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);

    const handleAction = async (status) => {
        if (status === 'rejected' && !window.confirm('Are you sure you want to reject this custom food request?')) {
            return;
        }

        setLoading(true);
        try {
            await bookingService.updateCustomFoodStatus(booking._id, status);
            alert(`Custom food request ${status} successfully!`);
            onSuccess();
        } catch (error) {
            console.error("Failed to update status", error);
            alert('Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    const requestedFoodPerHead = booking.customFood.reduce((total, item) => total + (item.price * item.quantity), 0);
    const baseSeatPrice = Number(booking.hallPrice ?? booking.hallId?.price) || 0;
    const packagePrice = Number(booking.packagePrice) || 0;
    const totalIfApproved = Math.round((baseSeatPrice + requestedFoodPerHead) * booking.guestsCount + packagePrice);
    const totalIfRejected = Math.round(baseSeatPrice * booking.guestsCount + packagePrice);
    const rejectedReduction = Math.max(0, totalIfApproved - totalIfRejected);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <FaUtensils className="text-secondary" /> Review Custom Food
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors">
                        <FaTimes size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                        <h3 className="font-bold text-blue-900 mb-2">Booking Details</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                            <p><strong>Customer:</strong> {booking.customerId?.name}</p>
                            <p><strong>Event Date:</strong> {new Date(booking.eventDate).toLocaleDateString()}</p>
                            <p><strong>Guests:</strong> {booking.guestsCount}</p>
                            <p><strong>Current Total:</strong> Rs {booking.totalAmount.toLocaleString()}</p>
                        </div>
                    </div>

                    <h3 className="font-bold text-lg mb-4">Requested Items</h3>
                    <div className="space-y-3 mb-6">
                        {booking.customFood.map((item, index) => (
                            <div key={index} className="flex justify-between items-center border p-3 rounded bg-white">
                                <div>
                                    <p className="font-bold">{item.itemName}</p>
                                    <p className="text-sm text-gray-600">Rs {item.price} x {item.quantity}</p>
                                </div>
                                <p className="font-bold text-primary">Rs {item.price * item.quantity}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <div className="flex justify-between mb-2">
                            <span>Current Booking Total:</span>
                            <span className="font-bold">Rs {Number(booking.totalAmount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span>Food Cost per Seat:</span>
                            <span className="font-bold">Rs {requestedFoodPerHead.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between mb-2 pt-2 border-t">
                            <span>Total if approved:</span>
                            <span className="font-bold text-emerald-700">Rs {totalIfApproved.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Total if rejected:</span>
                            <span className="font-bold text-red-600">
                                Rs {totalIfRejected.toLocaleString()} (-Rs {rejectedReduction.toLocaleString()})
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-right">
                            Requested items are already included in the current total until rejected.
                        </p>
                    </div>
                </div>

                <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
                    <button
                        onClick={() => handleAction('rejected')}
                        disabled={loading}
                        className="px-4 py-2 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200 disabled:opacity-50 flex items-center gap-2"
                    >
                        <FaTimesCircle /> Reject
                    </button>
                    <button
                        onClick={() => handleAction('approved')}
                        disabled={loading}
                        className="px-6 py-2 bg-green-500 text-white font-bold rounded-lg shadow hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'Processing...' : <><FaCheck /> Approve Request</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomFoodReviewModal;
