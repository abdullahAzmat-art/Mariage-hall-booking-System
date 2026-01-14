import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FaFileContract, FaUserShield, FaUndoAlt, FaCheckCircle } from 'react-icons/fa';

gsap.registerPlugin(ScrollTrigger);

const Policy = () => {
    const headerRef = useRef(null);
    const sectionsRef = useRef([]);

    useEffect(() => {
        window.scrollTo(0, 0);

        // Header Animation
        gsap.fromTo(headerRef.current,
            { opacity: 0, y: 50 },
            { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }
        );

        // Sections Animation
        sectionsRef.current.forEach((el, index) => {
            gsap.fromTo(el,
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    delay: 0.1 * index,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: el,
                        start: "top 85%",
                    }
                }
            );
        });
    }, []);

    const addToRefs = (el) => {
        if (el && !sectionsRef.current.includes(el)) {
            sectionsRef.current.push(el);
        }
    };

    return (
        <div className="bg-white min-h-screen pb-20">
            {/* Hero Section */}
            <div className="relative h-[50vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1519225448526-0a09d8716a0e?q=80&w=2070&auto=format&fit=crop"
                        alt="Elegant Hall Background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
                </div>

                <div ref={headerRef} className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                    <div className="inline-block mb-6 px-6 py-2 border border-gold/40 rounded-full bg-black/40 backdrop-blur-md">
                        <span className="text-gold uppercase tracking-[0.3em] text-xs font-bold">Transparency & Trust</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-playfair font-bold text-white mb-6 leading-tight">
                        Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-200 to-gold">Policies</span>
                    </h1>
                    <p className="text-gray-200 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed">
                        We believe in clear communication and fair practices to ensure your event planning is seamless and stress-free.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-24 relative z-20 max-w-6xl">
                <div className="grid gap-8">

                    {/* Terms and Conditions */}
                    <div ref={addToRefs} className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 group hover:border-gold/30 transition-all duration-500">
                        <div className="flex flex-col md:flex-row">
                            <div className="md:w-1/3 bg-gray-50 p-10 flex flex-col justify-center items-center text-center border-r border-gray-100">
                                <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center text-gold text-3xl mb-6 group-hover:scale-110 transition-transform duration-500">
                                    <FaFileContract />
                                </div>
                                <h2 className="text-2xl font-playfair font-bold text-gray-900 mb-2">Terms & Conditions</h2>
                                <p className="text-sm text-gray-500">Essential guidelines for your booking</p>
                            </div>
                            <div className="md:w-2/3 p-10">
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    Welcome to RoyalVenue. By accessing our website and booking our services, you agree to be bound by these terms and conditions.
                                </p>
                                <ul className="space-y-4">
                                    {[
                                        { title: "Booking Confirmation", desc: "A booking is only confirmed once the initial payment has been processed and you receive a confirmation email/message." },
                                        { title: "User Responsibility", desc: "Users are responsible for providing accurate information during the booking process." },
                                        { title: "Venue Usage", desc: "The venue must be used responsibly. Any damage caused to the property during the event will be charged to the client." },
                                        { title: "Code of Conduct", desc: "We expect all guests to behave respectfully. The management reserves the right to intervene if necessary." }
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-4">
                                            <FaCheckCircle className="text-gold mt-1 flex-shrink-0" />
                                            <div>
                                                <strong className="text-gray-900 block mb-1">{item.title}</strong>
                                                <span className="text-gray-600 text-sm">{item.desc}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Privacy Policy */}
                    <div ref={addToRefs} className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 group hover:border-primary/30 transition-all duration-500">
                        <div className="flex flex-col md:flex-row-reverse">
                            <div className="md:w-1/3 bg-gray-50 p-10 flex flex-col justify-center items-center text-center border-l border-gray-100">
                                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl mb-6 group-hover:scale-110 transition-transform duration-500">
                                    <FaUserShield />
                                </div>
                                <h2 className="text-2xl font-playfair font-bold text-gray-900 mb-2">Privacy Policy</h2>
                                <p className="text-sm text-gray-500">How we protect your data</p>
                            </div>
                            <div className="md:w-2/3 p-10">
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    Your privacy is important to us. This policy outlines how we collect, use, and protect your personal information.
                                </p>
                                <ul className="space-y-4">
                                    {[
                                        { title: "Data Collection", desc: "We collect personal details such as name, contact information, and CNIC for booking and verification purposes." },
                                        { title: "Data Usage", desc: "Your data is used solely for processing bookings, communicating with you, and improving our services. We do not sell your data." },
                                        { title: "Security", desc: "We implement robust security measures to protect your personal information from unauthorized access." }
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-4">
                                            <FaCheckCircle className="text-primary mt-1 flex-shrink-0" />
                                            <div>
                                                <strong className="text-gray-900 block mb-1">{item.title}</strong>
                                                <span className="text-gray-600 text-sm">{item.desc}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Refund and Cancellation Policy */}
                    <div ref={addToRefs} className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 group hover:border-red-200 transition-all duration-500">
                        <div className="flex flex-col md:flex-row">
                            <div className="md:w-1/3 bg-gray-50 p-10 flex flex-col justify-center items-center text-center border-r border-gray-100">
                                <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center text-red-500 text-3xl mb-6 group-hover:scale-110 transition-transform duration-500">
                                    <FaUndoAlt />
                                </div>
                                <h2 className="text-2xl font-playfair font-bold text-gray-900 mb-2">Refund Policy</h2>
                                <p className="text-sm text-gray-500">Cancellations and refunds</p>
                            </div>
                            <div className="md:w-2/3 p-10">
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    We understand that plans can change. Here is our transparent policy regarding cancellations and refunds:
                                </p>
                                <div className="space-y-6">
                                    <div className="bg-red-50/50 p-6 rounded-lg border border-red-100">
                                        <h4 className="font-bold text-gray-900 mb-3">Cancellation by Client</h4>
                                        <ul className="space-y-2">
                                            <li className="flex justify-between text-sm">
                                                <span className="text-gray-600">30+ days before event</span>
                                                <span className="font-bold text-green-600">100% Refund</span>
                                            </li>
                                            <li className="flex justify-between text-sm">
                                                <span className="text-gray-600">15-30 days before event</span>
                                                <span className="font-bold text-yellow-600">50% Refund</span>
                                            </li>
                                            <li className="flex justify-between text-sm">
                                                <span className="text-gray-600">Less than 15 days</span>
                                                <span className="font-bold text-red-600">No Refund</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-4">
                                            <FaCheckCircle className="text-red-500 mt-1 flex-shrink-0" />
                                            <div>
                                                <strong className="text-gray-900 block mb-1">Cancellation by Venue</strong>
                                                <span className="text-gray-600 text-sm">In the unlikely event that we must cancel your booking due to unforeseen circumstances, you will receive a full refund immediately.</span>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-4">
                                            <FaCheckCircle className="text-red-500 mt-1 flex-shrink-0" />
                                            <div>
                                                <strong className="text-gray-900 block mb-1">Processing Time</strong>
                                                <span className="text-gray-600 text-sm">Approved refunds will be processed within 7-10 business days via the original payment method.</span>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Policy;
