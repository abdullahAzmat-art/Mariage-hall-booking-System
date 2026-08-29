import React from 'react';
import { FaSearch, FaSlidersH, FaCalendarCheck } from 'react-icons/fa';

const steps = [
    {
        number: "01",
        title: "Discover",
        description: "Find venues based on your location, event type, guest count and budget.",
        icon: FaSearch
    },
    {
        number: "02",
        title: "Customize",
        description: "Choose packages, menus and additional services tailored to your taste.",
        icon: FaSlidersH
    },
    {
        number: "03",
        title: "Book",
        description: "Review everything and securely book your event with confidence.",
        icon: FaCalendarCheck
    }
];

const HowItWorks = () => {
    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20">
                    <span className="text-terracotta uppercase tracking-[0.2em] text-sm font-bold">Process</span>
                    <h2 className="text-4xl md:text-5xl font-playfair font-bold text-navy mt-3">How It Works</h2>
                </div>

                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px bg-gray-200" />

                    {steps.map((step, idx) => (
                        <div key={idx} className="relative flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-terracotta text-white flex items-center justify-center text-xl font-bold shadow-lg mb-6 relative z-10">
                                {step.number}
                            </div>
                            <div className="w-12 h-12 rounded-full bg-ivory-warm border border-gray-100 flex items-center justify-center mb-6 text-terracotta text-xl">
                                <step.icon />
                            </div>
                            <h3 className="text-2xl font-bold text-navy font-playfair mb-3">{step.title}</h3>
                            <p className="text-body max-w-xs mx-auto leading-relaxed">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
