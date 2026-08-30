import React from 'react';
import { Link } from 'react-router-dom';
import { 
    FaSearch, 
    FaUtensils, 
    FaShieldAlt, 
    FaGlassCheers, 
    FaArrowRight, 
    FaCheckCircle 
} from 'react-icons/fa';

const steps = [
    {
        number: "01",
        title: "Discover & Filter",
        subtitle: "Find your ideal space",
        description: "Browse 500+ handpicked venues by city, capacity, aesthetic style, and budget with high-resolution photo galleries.",
        icon: FaSearch,
        badge: "Smart AI Search",
        perks: ["Location & capacity filters", "Real-time date availability", "Verified 360° hall photos"]
    },
    {
        number: "02",
        title: "Customize & Taste",
        subtitle: "Tailor every detail",
        description: "Select gourmet catering menus, seating layouts, audio-visual stages, and request private walkthroughs or chef tastings.",
        icon: FaUtensils,
        badge: "Bespoke Curation",
        perks: ["Chef tasting sessions", "Custom stage & lighting decor", "Bridal suite arrangement"]
    },
    {
        number: "03",
        title: "Secure & Reserve",
        subtitle: "Instant confirmation",
        description: "Lock your event date with a transparent 25% deposit. Enjoy flexible installment payments and bank-grade encrypted security.",
        icon: FaShieldAlt,
        badge: "Protected Booking",
        perks: ["Bank-grade 256-bit encryption", "Instant digital contract", "Flexible cancellation terms"]
    },
    {
        number: "04",
        title: "Celebrate Stress-Free",
        subtitle: "Flawless execution",
        description: "Relax while your dedicated on-site venue coordinator and hospitality staff execute your dream celebration effortlessly.",
        icon: FaGlassCheers,
        badge: "Dedicated Concierge",
        perks: ["On-site event manager", "Full valet & security team", "Zero-hassle coordination"]
    }
];

const HowItWorks = () => {
    return (
        <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
            {/* Ambient background decoration */}
            <div className="absolute top-1/2 left-0 w-96 h-96 bg-terracotta/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <span className="text-terracotta uppercase tracking-[0.2em] text-xs font-bold bg-terracotta/10 px-4 py-1.5 rounded-full inline-block mb-3">
                        Seamless Experience
                    </span>
                    <h2 className="text-4xl md:text-5xl font-playfair font-bold text-navy leading-tight">
                        How Venuora Works
                    </h2>
                    <p className="text-body mt-4 text-lg">
                        From your first search to the final toast, we make booking and hosting extraordinary celebrations simple, secure, and transparent.
                    </p>
                </div>

                {/* 4-Step Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                    {steps.map((step, idx) => {
                        const IconComponent = step.icon;
                        return (
                            <div 
                                key={idx} 
                                className="bg-ivory-warm rounded-3xl p-8 border border-gray-100/80 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group relative"
                            >
                                {/* Step Header */}
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-terracotta/10 text-terracotta group-hover:bg-terracotta group-hover:text-white flex items-center justify-center text-xl font-bold transition-all duration-300 shadow-sm">
                                            <IconComponent />
                                        </div>
                                        <span className="text-3xl font-playfair font-extrabold text-navy/20 group-hover:text-terracotta/30 transition-colors">
                                            {step.number}
                                        </span>
                                    </div>

                                    <div className="mb-4">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-terracotta bg-white px-2.5 py-1 rounded-full border border-terracotta/20 inline-block mb-2">
                                            {step.badge}
                                        </span>
                                        <h3 className="text-2xl font-bold font-playfair text-navy group-hover:text-terracotta transition-colors">
                                            {step.title}
                                        </h3>
                                        <p className="text-xs font-semibold text-gray-400 mt-0.5">
                                            {step.subtitle}
                                        </p>
                                    </div>

                                    <p className="text-body text-sm leading-relaxed mb-6">
                                        {step.description}
                                    </p>
                                </div>

                                {/* Micro Perks */}
                                <div className="pt-4 border-t border-gray-200/60">
                                    <ul className="space-y-2">
                                        {step.perks.map((perk, pIdx) => (
                                            <li key={pIdx} className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                                                <FaCheckCircle className="text-emerald-500 text-[11px] shrink-0" />
                                                <span>{perk}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom CTA bar */}
                <div className="mt-16 bg-gradient-to-r from-navy to-navy-dark rounded-2xl p-8 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                    <div>
                        <h4 className="text-2xl font-playfair font-bold text-white mb-2">
                            Ready to find your dream event space?
                        </h4>
                        <p className="text-gray-300 text-sm max-w-xl">
                            Explore hundreds of verified banquet halls, ballrooms, and outdoor gardens in your city.
                        </p>
                    </div>
                    <Link
                        to="/halls"
                        className="btn-accent px-8 py-3.5 rounded-xl font-bold text-sm whitespace-nowrap shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                        <span>Start Exploring Venues</span>
                        <FaArrowRight className="text-xs" />
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
