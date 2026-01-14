import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaUser, FaBoxOpen, FaMoneyBillWave, FaUtensils, FaPlus, FaMinus } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import bookingService from '../services/bookingService';
import packageService from '../services/packageService';
import hallService from '../services/hallService';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const Booking = () => {
    const [step, setStep] = useState(1);
    const navigate = useNavigate();
    const location = useLocation();
    const hall = location.state?.hall;
    const [packages, setPackages] = useState([]);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [createdBooking, setCreatedBooking] = useState(null);
    const [paymentProof, setPaymentProof] = useState(null);
    const [transactionId, setTransactionId] = useState('');

    // Food Customization State
    const [menu, setMenu] = useState([]);
    const [customFood, setCustomFood] = useState(
        location.state?.initialData?.selectedFood?.map(item => ({
            itemName: item.name,
            price: item.price,
            quantity: 1 // Default quantity
        })) || []
    );
    const [loadingMenu, setLoadingMenu] = useState(true);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        cnic: '',
        eventDate: location.state?.initialData?.eventDate || '',
        eventType: location.state?.initialData?.eventType || 'Wedding',
        guestCount: location.state?.initialData?.guestCount || '',
        packageId: '',
    });

    useEffect(() => {
        if (!hall) {
            navigate('/halls');
            return;
        }

        const fetchPackages = async () => {
            try {
                const data = await packageService.getPackagesByHallId(hall._id);
                setPackages(data);
                if (data.length > 0) {
                    setSelectedPackage(data[0]);
                    setFormData(prev => ({ ...prev, packageId: data[0]._id }));
                }
            } catch (error) {
                console.error("Failed to fetch packages", error);
            }
        };

        const user = authService.getCurrentUser();
        if (user) {
            setFormData(prev => ({
                ...prev,
                fullName: user.name,
                email: user.email
            }));
        }

        const fetchMenu = () => {
            if (hall && hall.menu) {
                setMenu(hall.menu);
            }
            setLoadingMenu(false);
        };

        fetchPackages();
        fetchMenu();
    }, [hall, navigate]);

    if (!hall) {
        return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
    }

    const handleQuantityChange = (item, change) => {
        setCustomFood(prev => {
            const existing = prev.find(i => i.itemName === item.name);
            if (existing) {
                const newQuantity = existing.quantity + change;
                if (newQuantity <= 0) {
                    return prev.filter(i => i.itemName !== item.name);
                }
                return prev.map(i => i.itemName === item.name ? { ...i, quantity: newQuantity } : i);
            } else if (change > 0) {
                return [...prev, { itemName: item.name, price: item.price, quantity: 1 }];
            }
            return prev;
        });
    };

    const foodTotal = customFood.reduce((total, item) => total + (item.price * item.quantity), 0);
    const totalPrice = (hall ? (hall.price + foodTotal) * (formData.guestCount || 0) : 0) + (selectedPackage ? selectedPackage.price : 0);
    const prebookingAmount = totalPrice * 0.1;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');



    const handleChange = (e) => {
        if (e.target.name === 'guestCount') {
            const val = e.target.value;
            if (val !== '' && parseInt(val) > hall.capacity) {
                toast.error(`Guest count cannot exceed hall capacity of ${hall.capacity}`);
                return;
            }
            setError('');
        }
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePackageSelect = (pkg) => {
        setSelectedPackage(pkg);
        setFormData({ ...formData, packageId: pkg._id });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const bookingPayload = {
                hallId: hall._id,
                eventDate: formData.eventDate,
                guestsCount: formData.guestCount,
                totalAmount: totalPrice,
                customFood: customFood
            };
            const booking = await bookingService.createBooking(bookingPayload);
            setCreatedBooking(booking);
            toast.success("Booking created! Please proceed to payment.");
            setStep(5); // Move to payment step
            setLoading(false);
        } catch (err) {
            const msg = err.response?.data?.message || 'Booking failed';
            setError(msg);
            toast.error(msg);
            setLoading(false);
        }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!transactionId || !paymentProof) {
            toast.error('Please provide transaction ID and payment proof');
            return;
        }

        try {
            await bookingService.submitPaymentProof(createdBooking._id, transactionId, paymentProof);
            toast.success('Payment proof submitted successfully! Please wait for manager verification.');
            navigate('/dashboard');
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to submit payment proof';
            setError(msg);
            toast.error(msg);
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4">
                {/* DEBUG INFO */}
                <div className="bg-red-100 p-2 mb-4 text-xs font-mono">
                    DEBUG: Hall Present: {hall ? 'Yes' : 'No'} | Step: {step} | User: {authService.getCurrentUser() ? 'Yes' : 'No'}
                </div>
                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-card overflow-hidden">
                    <div className="bg-primary p-6 text-white text-center">
                        <h1 className="text-3xl font-bold">Complete Your Booking</h1>
                        <p className="opacity-90 mt-2">You are booking: {hall?.name}</p>
                    </div>

                    <div className="p-8">
                        {/* Progress Steps */}
                        <div className="flex justify-between items-center mb-10 relative">
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
                            {[1, 2, 3, 4, 5].map((s) => (
                                <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {s}
                                </div>
                            ))}
                        </div>

                        {error && <div className="text-red-500 text-center mb-4">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            {step === 1 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-text mb-6 flex items-center">
                                        <FaUser className="mr-3 text-primary" /> Customer Details
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary" placeholder="John Doe" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary" placeholder="john@example.com" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary" placeholder="+1 234 567 890" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">CNIC / ID</label>
                                            <input type="text" name="cnic" value={formData.cnic} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary" placeholder="12345-6789012-3" required />
                                        </div>
                                    </div>
                                    <div className="flex justify-end mt-8">
                                        <button type="button" onClick={() => setStep(2)} className="btn-primary">Next Step</button>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-text mb-6 flex items-center">
                                        <FaCalendarAlt className="mr-3 text-primary" /> Event Details
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                                            <input type="date" name="eventDate" value={formData.eventDate} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                                            <select name="eventType" value={formData.eventType} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary">
                                                <option>Wedding</option>
                                                <option>Reception</option>
                                                <option>Birthday</option>
                                                <option>Corporate</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
                                            <input
                                                type="number"
                                                name="guestCount"
                                                value={formData.guestCount}
                                                onChange={handleChange}
                                                max={hall?.capacity}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
                                                placeholder={`Max ${hall?.capacity}`}
                                                required
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Maximum capacity: {hall?.capacity} guests</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Package</label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                {packages.length > 0 ? (
                                                    packages.map(pkg => (
                                                        <button
                                                            key={pkg._id}
                                                            type="button"
                                                            onClick={() => handlePackageSelect(pkg)}
                                                            className={`border py-2 rounded-lg font-bold ${selectedPackage?._id === pkg._id ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                        >
                                                            {pkg.title} - Rs {pkg.price}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="col-span-3 text-gray-500 text-sm">No packages available for this hall.</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between mt-8">
                                        <button type="button" onClick={() => setStep(1)} className="text-gray-500 font-medium hover:text-text">Back</button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (parseInt(formData.guestCount) > hall.capacity) {
                                                    setError(`Guest count cannot exceed hall capacity of ${hall.capacity}`);
                                                    return;
                                                }
                                                if (!formData.eventDate || !formData.guestCount) {
                                                    setError('Please fill in all required fields');
                                                    return;
                                                }
                                                setError('');
                                                setStep(3);
                                            }}
                                            className="btn-primary"
                                        >
                                            Next Step
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-text mb-6 flex items-center">
                                        <FaUtensils className="mr-3 text-primary" /> Customize Food Menu
                                    </h2>

                                    {loadingMenu ? (
                                        <div className="text-center py-10">Loading menu...</div>
                                    ) : menu.length === 0 ? (
                                        <div className="text-center py-10 text-gray-500">
                                            <p>No menu items available for this hall.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {menu.map((item, index) => {
                                                const selected = customFood.find(i => i.itemName === item.name);
                                                const quantity = selected ? selected.quantity : 0;

                                                return (
                                                    <div key={index} className={`border rounded-lg p-4 flex justify-between items-center transition-all ${quantity > 0 ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 hover:border-primary/50'}`}>
                                                        <div className="flex items-center gap-4">
                                                            {item.image && (
                                                                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
                                                            )}
                                                            <div>
                                                                <h3 className="font-bold text-lg">{item.name}</h3>
                                                                <p className="text-gray-600">Rs {item.price} / head</p>
                                                                {item.category && <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">{item.category}</span>}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleQuantityChange(item, -1)}
                                                                className={`p-2 rounded-full ${quantity > 0 ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                                disabled={quantity === 0}
                                                            >
                                                                <FaMinus size={12} />
                                                            </button>
                                                            <span className="font-bold w-6 text-center">{quantity}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleQuantityChange(item, 1)}
                                                                className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
                                                            >
                                                                <FaPlus size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
                                        <div className="flex justify-between items-center text-lg font-bold">
                                            <span>Extra Food Cost:</span>
                                            <span className="text-primary">+ Rs {foodTotal.toLocaleString()} / head</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">*This amount will be added to the base seat price.</p>
                                    </div>

                                    <div className="flex justify-between mt-8">
                                        <button type="button" onClick={() => setStep(2)} className="text-gray-500 font-medium hover:text-text">Back</button>
                                        <button
                                            type="button"
                                            onClick={() => setStep(4)}
                                            className="btn-primary"
                                        >
                                            Next Step
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-text mb-6 flex items-center">
                                        <FaMoneyBillWave className="mr-3 text-primary" /> Payment & Summary
                                    </h2>

                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6">
                                        <h3 className="font-bold text-lg mb-4">Booking Summary</h3>
                                        <div className="space-y-2 text-sm text-gray-600">
                                            <div className="flex justify-between"><span>Hall:</span> <span className="font-bold text-text">{hall?.name}</span></div>
                                            <div className="flex justify-between"><span>Date:</span> <span className="font-bold text-text">{formData.eventDate}</span></div>
                                            <div className="flex justify-between"><span>Package:</span> <span className="font-bold text-text">{selectedPackage?.title || 'None'}</span></div>
                                            <div className="flex justify-between"><span>Guests:</span> <span className="font-bold text-text">{formData.guestCount}</span></div>
                                            {customFood.length > 0 && (
                                                <div className="flex justify-between">
                                                    <span>Custom Food:</span>
                                                    <span className="font-bold text-text">{customFood.length} items (+Rs {foodTotal}/head)</span>
                                                </div>
                                            )}
                                            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between text-lg font-bold text-primary">
                                                <span>Total:</span> <span>Rs {totalPrice.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
                                        <div className="flex items-center p-4 border border-primary bg-primary/5 rounded-lg">
                                            <input type="radio" checked readOnly className="text-primary focus:ring-primary h-5 w-5" />
                                            <span className="ml-3 font-bold text-text">Cash Payment (Pay at Venue)</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between mt-8">
                                        <button type="button" onClick={() => setStep(3)} className="text-gray-500 font-medium hover:text-text">Back</button>
                                        <button type="submit" disabled={loading} className="btn-primary px-8 py-3 text-lg shadow-lg">
                                            {loading ? 'Processing...' : 'Confirm Booking'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 5 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-text mb-6 flex items-center">
                                        <FaMoneyBillWave className="mr-3 text-primary" /> Payment Information
                                    </h2>

                                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-xl border-2 border-primary/20 mb-6">
                                        <h3 className="font-bold text-xl mb-4 text-primary">Prebooking Payment Required</h3>
                                        <div className="space-y-3 text-gray-700">
                                            <div className="flex justify-between items-center">
                                                <span className="text-lg">Total Booking Amount:</span>
                                                <span className="font-bold text-xl">Rs {totalPrice.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-t-2 border-primary/20 pt-3">
                                                <span className="text-lg font-semibold text-primary">10% Prebooking Amount:</span>
                                                <span className="font-bold text-2xl text-primary">Rs {prebookingAmount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                                        <h4 className="font-bold text-blue-900 mb-2">Payment Instructions:</h4>
                                        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                                            <li>Transfer Rs {prebookingAmount.toLocaleString()} to the hall's bank account</li>
                                            <li>Take a screenshot of the transaction confirmation</li>
                                            <li>Note down your Transaction ID</li>
                                            <li>Upload the screenshot and enter Transaction ID below</li>
                                            <li>Wait for hall manager to verify your payment</li>
                                        </ol>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
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
                                    </div>

                                    <div className="flex justify-between mt-8">
                                        <button type="button" onClick={() => setStep(4)} className="text-gray-500 font-medium hover:text-text">Back</button>
                                        <button
                                            type="button"
                                            onClick={handlePaymentSubmit}
                                            disabled={loading}
                                            className="btn-primary px-8 py-3 text-lg shadow-lg"
                                        >
                                            {loading ? 'Submitting...' : 'Submit Payment Proof'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};



export default Booking;
