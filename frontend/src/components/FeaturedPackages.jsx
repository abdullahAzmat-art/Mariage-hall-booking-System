import React from 'react';
import { Link } from 'react-router-dom';
import { FaCheck, FaCrown, FaGem, FaLeaf, FaArrowRight, FaStar } from 'react-icons/fa';

const packages = [
    {
        id: 'silver',
        name: 'Silver Elegance',
        subtitle: 'Intimate Celebrations & Dinners',
        price: 'Rs 1,800',
        priceUnit: 'per guest',
        icon: FaLeaf,
        iconBg: 'bg-emerald-50 text-emerald-600',
        badge: null,
        features: [
            'Standard Hall Decor & Setup',
            '3-Course Traditional Buffet Menu',
            'Standard Ambient Lighting',
            'Dedicated Hall Supervisor',
            'Basic Sound System & Microphone',
            'Complimentary Valet Parking (50 cars)'
        ],
        highlight: false
    },
    {
        id: 'gold',
        name: 'Gold Luxe Gala',
        subtitle: 'Our Most Popular Wedding Package',
        price: 'Rs 2,800',
        priceUnit: 'per guest',
        icon: FaGem,
        iconBg: 'bg-terracotta/10 text-terracotta',
        badge: 'Most Popular',
        features: [
            'Premium Stage & Floral Entrance Decor',
            '5-Course Gourmet Buffet + Live Counters',
            'Intelligent Moving Stage Lights & Hazers',
            'Private VIP Bridal Suite Access',
            'Dedicated Senior Event Manager',
            'Full HD Sound & Projector System',
            'Unlimited Valet Parking & Guest Escorts'
        ],
        highlight: true
    },
    {
        id: 'platinum',
        name: 'Royal Imperial',
        subtitle: 'Ultra-Luxury Grand Celebrations',
        price: 'Rs 4,200',
        priceUnit: 'per guest',
        icon: FaCrown,
        iconBg: 'bg-amber-50 text-amber-600',
        badge: 'Exclusive',
        features: [
            'Bespoke Couture Theme & Stage Styling',
            '7-Course Royal Feast with Master Chef Live Stations',
            'Grand Chandelier & Concert-Grade Lighting',
            '2 Luxury Bridal Suites + Makeup Lounge',
            'Red Carpet Reception & Welcome Mocktails',
            'Complete Event Coordination & Concierge Team',
            'Drone-Ready Indoor/Outdoor Setup'
        ],
        highlight: false
    }
];

const FeaturedPackages = () => {
    return (
        <section id="packages" className="py-24 bg-white relative overflow-hidden">
            {/* Subtle decorative background */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-terracotta/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="text-terracotta uppercase tracking-[0.2em] text-xs font-bold bg-terracotta/10 px-4 py-1.5 rounded-full inline-block mb-3">
                        Curated Tiers
                    </span>
                    <h2 className="text-4xl md:text-5xl font-playfair font-bold text-navy leading-tight">
                        Signature Event Packages
                    </h2>
                    <p className="text-body mt-4 text-lg">
                        Tailored options designed to make your special day seamless, exquisite, and unforgettable. All packages can be customized.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                    {packages.map((pkg) => {
                        const IconComponent = pkg.icon;
                        return (
                            <div
                                key={pkg.id}
                                className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative ${
                                    pkg.highlight
                                        ? 'bg-gradient-to-b from-navy to-navy-dark text-white shadow-2xl ring-2 ring-terracotta lg:-translate-y-3'
                                        : 'bg-ivory-warm text-navy border border-gray-100 shadow-md hover:shadow-xl hover:-translate-y-1'
                                }`}
                            >
                                {pkg.badge && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-terracotta to-cta text-white text-xs uppercase tracking-widest font-bold py-1.5 px-4 rounded-full shadow-md flex items-center gap-1.5">
                                        <FaStar className="text-[10px]" />
                                        {pkg.badge}
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${pkg.iconBg}`}>
                                            <IconComponent />
                                        </div>
                                        <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${
                                            pkg.highlight ? 'bg-white/10 text-terracotta-light' : 'bg-white text-gray-500 border border-gray-100'
                                        }`}>
                                            Full Service
                                        </span>
                                    </div>

                                    <h3 className={`text-2xl font-bold font-playfair mb-1 ${pkg.highlight ? 'text-white' : 'text-navy'}`}>
                                        {pkg.name}
                                    </h3>
                                    <p className={`text-sm mb-6 ${pkg.highlight ? 'text-gray-300' : 'text-gray-500'}`}>
                                        {pkg.subtitle}
                                    </p>

                                    <div className="mb-8 pb-6 border-b border-gray-200/20">
                                        <div className="flex items-baseline gap-2">
                                            <span className={`text-4xl font-extrabold font-playfair ${pkg.highlight ? 'text-terracotta-light' : 'text-terracotta'}`}>
                                                {pkg.price}
                                            </span>
                                            <span className={`text-xs uppercase font-medium tracking-wider ${pkg.highlight ? 'text-gray-400' : 'text-gray-500'}`}>
                                                / {pkg.priceUnit}
                                            </span>
                                        </div>
                                    </div>

                                    <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${pkg.highlight ? 'text-gray-300' : 'text-navy'}`}>
                                        What's Included:
                                    </p>
                                    <ul className="space-y-3.5 mb-8">
                                        {pkg.features.map((feat, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                                    pkg.highlight ? 'bg-terracotta/30 text-terracotta-light' : 'bg-emerald-100 text-emerald-600'
                                                }`}>
                                                    <FaCheck className="text-[10px]" />
                                                </div>
                                                <span className={pkg.highlight ? 'text-gray-200' : 'text-gray-600'}>
                                                    {feat}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="pt-4">
                                    <Link
                                        to="/packages"
                                        className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                                            pkg.highlight
                                                ? 'bg-terracotta hover:bg-terracotta-light hover:text-navy text-white shadow-lg'
                                                : 'bg-white hover:bg-navy hover:text-white text-navy border border-gray-200 shadow-sm'
                                        }`}
                                    >
                                        <span>Customize & Book</span>
                                        <FaArrowRight className="text-xs" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-14 text-center">
                    <p className="text-gray-500 text-sm">
                        Need a custom tailored package for your corporate gala or destination event?{' '}
                        <Link to="/contact" className="text-terracotta font-bold hover:underline inline-flex items-center gap-1">
                            Speak with our Event Specialist <FaArrowRight className="text-xs" />
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    );
};

export default FeaturedPackages;
