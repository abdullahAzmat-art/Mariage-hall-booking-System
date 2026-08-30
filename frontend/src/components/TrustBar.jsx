import React from 'react';
import { FaCalendarCheck, FaBuilding, FaMapMarkedAlt, FaStar } from 'react-icons/fa';

const TrustBar = () => {
    const stats = [
        { icon: FaCalendarCheck, number: "10,000+", label: "Events Hosted" },
        { icon: FaBuilding, number: "500+", label: "Verified Venues" },
        { icon: FaMapMarkedAlt, number: "12+", label: "Major Cities" },
        { icon: FaStar, number: "4.9 / 5.0", label: "Average Rating" }
    ];

    return (
        <section className="py-12 bg-white border-y border-gray-100 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, idx) => {
                        const Icon = stat.icon;
                        return (
                            <div key={idx} className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left group">
                                <div className="w-12 h-12 rounded-2xl bg-terracotta/10 text-terracotta flex items-center justify-center text-xl shrink-0 group-hover:bg-terracotta group-hover:text-white transition-all duration-300">
                                    <Icon />
                                </div>
                                <div>
                                    <p className="text-2xl sm:text-3xl font-bold text-navy font-playfair">{stat.number}</p>
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-body mt-0.5 font-bold">{stat.label}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default TrustBar;
