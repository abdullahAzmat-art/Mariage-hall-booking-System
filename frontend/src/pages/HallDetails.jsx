import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaStar, FaUserFriends, FaCheck } from 'react-icons/fa';
import hallService from '../services/hallService';
import authService from '../services/authService';
import bookingService from '../services/bookingService';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import toast from 'react-hot-toast';

const HallDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [hall, setHall] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingData, setBookingData] = useState({
        eventDate: '',
        eventType: 'Wedding',
        guestCount: '',
        functionTime: 'Morning'
    });
    const [bookingLoading, setBookingLoading] = useState(false);
    const [selectedFood, setSelectedFood] = useState([]);

    const handleFoodSelection = (item) => {
        setSelectedFood(prev => {
            const exists = prev.find(f => f.name === item.name);
            if (exists) {
                return prev.filter(f => f.name !== item.name);
            } else {
                return [...prev, { ...item, quantity: 1 }]; // Default quantity 1
            }
        });
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchData = async () => {
            try {
                const hallData = await hallService.getHallById(id);
                setHall(hallData);
            } catch (error) {
                console.error("Failed to fetch data", error);
                // Optional: Set an error state to display to the user
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!hall) {
        return <div className="min-h-screen flex items-center justify-center">Hall not found</div>;
    }

    return (
        <div className="bg-white min-h-screen pb-20">
            {/* Image Gallery */}
            <div className="h-[50vh] w-full relative">
                <img
                    src={(() => {
                        if (!hall.image && (!hall.images || hall.images.length === 0)) {
                            return 'https://via.placeholder.com/1920x1080';
                        }
                        const imagePath = hall.image || hall.images[0];
                        if (imagePath.startsWith('http')) return imagePath;
                        return `https://mariage-hall-booking-system.vercel.app/${imagePath.replace(/\\/g, '/')}`;
                    })()}
                    alt={hall.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/1920x1080';
                    }}
                />
                <div className="absolute inset-0 bg-black/30"></div>
            </div>

            <div className="container mx-auto px-4 -mt-20 relative z-10">
                <div className="bg-white rounded-xl shadow-card p-8 grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Left Column - Details */}
                    <div className="lg:col-span-2">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-text mb-2">{hall.name}</h1>
                                <div className="flex items-center text-gray-500">
                                    <FaMapMarkerAlt className="mr-2 text-primary" />
                                    {hall.location}
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="flex items-center bg-primary/10 px-3 py-1 rounded-full text-primary font-bold mb-2">
                                    <FaStar className="mr-1" /> {hall.rating}
                                </div>
                                <span className="text-sm text-gray-400">{hall.reviews} reviews</span>
                            </div>
                        </div>

                        <div className="border-t border-b border-gray-100 py-6 mb-8 flex flex-wrap gap-6">
                            <div className="flex items-center text-gray-600">
                                <FaUserFriends className="mr-2 text-primary text-xl" />
                                <span className="font-medium">{hall.capacity}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <span className="text-primary font-bold text-xl mr-2">Rs {hall.price}</span>
                                <span>/ seat</span>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-text mb-4">About this Venue</h2>
                            <p className="text-gray-600 leading-relaxed">{hall.description}</p>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-text mb-4">Amenities</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {(hall.amenities || []).map((item, index) => (
                                    <div key={index} className="flex items-center text-gray-600">
                                        <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center text-primary mr-3">
                                            <FaCheck size={12} />
                                        </div>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {hall.menu && hall.menu.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-text mb-4">Food Menu</h2>
                                <p className="text-gray-600 mb-4">Select items to add to your booking (optional):</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {hall.menu.map((item, index) => {
                                        const isSelected = selectedFood.some(f => f.name === item.name);
                                        return (
                                            <div
                                                key={index}
                                                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-100 hover:shadow-sm'}`}
                                                onClick={() => handleFoodSelection(item)}
                                            >
                                                <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                                                    {isSelected && <FaCheck className="text-white text-xs" />}
                                                </div>
                                                {item.image && (
                                                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md mr-4" />
                                                )}
                                                <div>
                                                    <h3 className="font-bold text-gray-800">{item.name}</h3>
                                                    <p className="text-primary font-semibold">Rs {item.price} <span className="text-xs text-gray-500 font-normal">/ head</span></p>
                                                    {item.category && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mt-1 inline-block">{item.category}</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {selectedFood.length > 0 && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <p className="font-bold text-primary">
                                            {selectedFood.length} items selected (+ Rs {selectedFood.reduce((acc, item) => acc + item.price, 0)}/head)
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column - Booking Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-gray-100 rounded-xl shadow-soft p-6 sticky top-24">
                            {authService.getCurrentUser() ? (
                                <>
                                    <h3 className="text-xl font-bold text-text mb-6">Book This Hall</h3>

                                    <form className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                                            <input
                                                type="date"
                                                value={bookingData.eventDate}
                                                onChange={(e) => setBookingData({ ...bookingData, eventDate: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                                            <select
                                                value={bookingData.eventType}
                                                onChange={(e) => setBookingData({ ...bookingData, eventType: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                            >
                                                <option>Wedding</option>
                                                <option>Reception</option>
                                                <option>Engagement</option>
                                                <option>Birthday</option>
                                                <option>Corporate Event</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Function Time</label>
                                            <select
                                                value={bookingData.functionTime}
                                                onChange={(e) => setBookingData({ ...bookingData, functionTime: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                            >
                                                <option>Morning</option>
                                                <option>Afternoon</option>
                                                <option>Evening</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
                                            <input
                                                type="number"
                                                placeholder={`Max ${hall.capacity}`}
                                                value={bookingData.guestCount}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === '' || parseInt(val) <= hall.capacity) {
                                                        setBookingData({ ...bookingData, guestCount: val });
                                                    } else {
                                                        toast.error(`Maximum capacity for this hall is ${hall.capacity} guests`);
                                                    }
                                                }}
                                                max={hall.capacity}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Maximum capacity: {hall.capacity} guests</p>
                                        </div>

                                        {bookingData.guestCount && (
                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                <div className="flex justify-between font-bold text-primary border-t border-gray-200 pt-2 mt-1">
                                                    <span>Total:</span>
                                                    <span>Rs {((hall.price + selectedFood.reduce((acc, item) => acc + item.price, 0)) * bookingData.guestCount).toLocaleString()}</span>
                                                </div>
                                                {selectedFood.length > 0 && (
                                                    <p className="text-xs text-gray-500 mt-1 text-right">
                                                        (Includes {selectedFood.length} food items)
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="pt-4">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!bookingData.eventDate || !bookingData.guestCount) {
                                                        toast.error("Please fill in all fields");
                                                        return;
                                                    }

                                                    if (parseInt(bookingData.guestCount) > hall.capacity) {
                                                        toast.error(`Guest count cannot exceed hall capacity of ${hall.capacity}`);
                                                        return;
                                                    }

                                                    // Check if date is booked by manager
                                                    if (hall.bookedDates && hall.bookedDates.includes(bookingData.eventDate)) {
                                                        toast.error("This date is unavailable. Please select another date.");
                                                        return;
                                                    }

                                                    navigate('/booking', {
                                                        state: {
                                                            hall,
                                                            initialData: {
                                                                ...bookingData,
                                                                selectedFood // Pass selected food
                                                            }
                                                        }
                                                    });
                                                }}
                                                className="w-full btn-primary py-3 font-bold text-lg shadow-lg"
                                            >
                                                Proceed to Booking
                                            </button>
                                            <p className="text-center text-xs text-gray-400 mt-3">You won't be charged yet</p>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <h3 className="text-xl font-bold text-text mb-4">Ready to Book?</h3>
                                    <p className="text-gray-600 mb-6">Please sign in to check availability and book this venue.</p>
                                    <Link to="/login" className="block w-full btn-primary py-3 font-bold text-lg shadow-lg rounded-lg">
                                        Sign In to Book
                                    </Link>
                                    <p className="mt-4 text-sm text-gray-500">
                                        Don't have an account? <Link to="/register" className="text-primary font-medium hover:underline">Register</Link>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Availability Calendar */}
                        <div className="bg-white border border-gray-100 rounded-xl shadow-soft p-6 mt-8">
                            <h3 className="text-xl font-bold text-text mb-6">Availability</h3>
                            <div className="flex justify-center">
                                <Calendar
                                    tileClassName={({ date, view }) => {
                                        if (view === 'month') {
                                            const dateString = date.toISOString().split('T')[0];
                                            const isBooked = hall.bookedDates && hall.bookedDates.includes(dateString);
                                            return isBooked ? 'bg-red-100 text-red-600 rounded-full font-bold' : 'text-green-600 font-bold';
                                        }
                                    }}
                                    tileDisabled={({ date, view }) => {
                                        if (view === 'month') {
                                            const dateString = date.toISOString().split('T')[0];
                                            return hall.bookedDates && hall.bookedDates.includes(dateString);
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex justify-center gap-4 mt-4 text-sm">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                    <span>Available</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                                    <span>Booked</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default HallDetails;
