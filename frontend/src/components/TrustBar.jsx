import React from 'react';

const TrustBar = () => {
    const stats = [
        { number: "10,000+", label: "Events Booked" },
        { number: "500+", label: "Verified Venues" },
        { number: "12+", label: "Cities" },
        { number: "4.9/5", label: "Average Rating" }
    ];

    return (
        <section className="py-10 bg-ivory-warm border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="text-center">
                            <p className="text-3xl md:text-4xl font-bold text-navy font-playfair">{stat.number}</p>
                            <p className="text-xs uppercase tracking-[0.2em] text-body mt-2 font-semibold">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrustBar;
