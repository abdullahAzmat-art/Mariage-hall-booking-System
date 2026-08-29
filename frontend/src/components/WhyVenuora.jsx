import React from 'react';
import { FaCheckCircle, FaLock, FaUtensils, FaRobot } from 'react-icons/fa';

const features = [
    {
        number: "01",
        title: "Verified Venues",
        description: "Every venue is personally verified to ensure premium quality, safety, and authenticity."
    },
    {
        number: "02",
        title: "Secure Payments",
        description: "Bank-grade encryption and secure payment processing for complete peace of mind."
    },
    {
        number: "03",
        title: "Custom Menus",
        description: "Work with chefs to design personalized menus that match your vision and dietary needs."
    },
    {
        number: "04",
        title: "AI Booking Assistant",
        description: "Get instant recommendations and smart suggestions powered by advanced AI technology."
    }
];

const icons = [FaCheckCircle, FaLock, FaUtensils, FaRobot];

const WhyVenuora = () => {
    return (
        <section className="py-24 bg-ivory-warm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="text-terracotta uppercase tracking-[0.2em] text-sm font-bold">Why Venuora</span>
                    <h2 className="text-4xl md:text-5xl font-playfair font-bold text-navy mt-3">Built for extraordinary events</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, idx) => {
                        const Icon = icons[idx];
                        return (
                            <div key={idx} className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 text-center group">
                                <div className="mx-auto w-14 h-14 rounded-full bg-terracotta/10 flex items-center justify-center mb-6 group-hover:bg-terracotta/20 transition-colors">
                                    <Icon className="text-2xl text-terracotta" />
                                </div>
                                <span className="text-xs uppercase tracking-[0.2em] text-body font-bold mb-2 block">{feature.number}</span>
                                <h3 className="text-xl font-bold text-navy font-playfair mb-3">{feature.title}</h3>
                                <p className="text-body text-sm leading-relaxed">{feature.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default WhyVenuora;
