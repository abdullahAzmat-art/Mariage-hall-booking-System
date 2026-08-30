import React from 'react';
import { 
    FaHotel, 
    FaUtensils, 
    FaLightbulb, 
    FaGem, 
    FaCar, 
    FaConciergeBell,
    FaShieldAlt,
    FaMusic
} from 'react-icons/fa';

const amenities = [
    {
        icon: FaHotel,
        title: "Grand Pillarless Ballrooms",
        description: "Opulent high-ceiling halls with unobstructed views, luxury crystal chandeliers, and expansive stages.",
        tag: "Capacity up to 2,500"
    },
    {
        icon: FaUtensils,
        title: "Haute Cuisine & Live Stations",
        description: "Award-winning master chefs crafting authentic South Asian, Continental, and bespoke fusion banquets.",
        tag: "Certified Master Chefs"
    },
    {
        icon: FaLightbulb,
        title: "Concert-Grade Stage & Lighting",
        description: "Programmable ambient mood lighting, moving head beams, atmospheric haze, and LED video walls.",
        tag: "Smart Dynamic Lighting"
    },
    {
        icon: FaGem,
        title: "VIP Bridal Suites & Lounges",
        description: "Air-conditioned private suites with makeup mirrors, en-suite restrooms, and dedicated hospitality attendants.",
        tag: "Private Luxury"
    },
    {
        icon: FaCar,
        title: "Chauffeur & Valet Parking",
        description: "Seamless arrival experience with dedicated valet bays, paved secure lots, and 24/7 security monitoring.",
        tag: "500+ Car Parking"
    },
    {
        icon: FaConciergeBell,
        title: "Dedicated Event Concierge",
        description: "A certified event manager on-site from initial rehearsal to final send-off ensuring flawlessness.",
        tag: "Zero-Stress Planning"
    }
];

const ExperienceAmenities = () => {
    return (
        <section className="py-24 bg-ivory-warm relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="text-terracotta uppercase tracking-[0.2em] text-xs font-bold bg-terracotta/10 px-4 py-1.5 rounded-full inline-block mb-3">
                        Signature Standards
                    </span>
                    <h2 className="text-4xl md:text-5xl font-playfair font-bold text-navy leading-tight">
                        Everything for an Unforgettable Celebration
                    </h2>
                    <p className="text-body mt-4 text-lg">
                        Every Venuora partner venue meets rigorous architectural, culinary, and service benchmarks for extraordinary experiences.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {amenities.map((item, idx) => {
                        const IconComponent = item.icon;
                        return (
                            <div
                                key={idx}
                                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-terracotta/10 text-terracotta group-hover:bg-terracotta group-hover:text-white flex items-center justify-center text-2xl transition-all duration-300">
                                            <IconComponent />
                                        </div>
                                        <span className="text-[11px] font-bold tracking-wider uppercase px-3 py-1 bg-gray-50 text-gray-500 rounded-full border border-gray-100 group-hover:border-terracotta/30 transition-colors">
                                            {item.tag}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold font-playfair text-navy mb-3 group-hover:text-terracotta transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-body text-sm leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center text-xs font-semibold text-terracotta opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span>Included with full venue booking &rarr;</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default ExperienceAmenities;
