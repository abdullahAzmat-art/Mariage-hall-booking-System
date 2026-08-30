import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import { 
    FaAward, 
    FaShieldAlt, 
    FaUtensils, 
    FaHeart, 
    FaArrowRight, 
    FaCheckCircle, 
    FaBuilding, 
    FaUsers, 
    FaStar,
    FaGem
} from 'react-icons/fa';

gsap.registerPlugin(ScrollTrigger);

const About = () => {
    const heroRef = useRef(null);
    const storyRef = useRef(null);
    const pillarsRef = useRef(null);
    const statsRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".about-hero-content > *", {
                y: 40,
                opacity: 0,
                duration: 1,
                stagger: 0.15,
                ease: "power3.out"
            });

            gsap.from(".story-reveal", {
                scrollTrigger: {
                    trigger: storyRef.current,
                    start: "top 80%",
                },
                y: 40,
                opacity: 0,
                duration: 0.9,
                stagger: 0.2,
                ease: "power2.out"
            });

            gsap.from(".pillar-card", {
                scrollTrigger: {
                    trigger: pillarsRef.current,
                    start: "top 80%",
                },
                y: 40,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: "power3.out"
            });

            gsap.from(".stat-box", {
                scrollTrigger: {
                    trigger: statsRef.current,
                    start: "top 85%",
                },
                scale: 0.9,
                opacity: 0,
                duration: 0.7,
                stagger: 0.1,
                ease: "back.out(1.5)"
            });
        });

        return () => ctx.revert();
    }, []);

    const values = [
        {
            icon: FaGem,
            title: "Rigorous Venue Curation",
            description: "We personally inspect every venue for architectural elegance, acoustic quality, climate control, and pristine hygiene standards before listing.",
            tag: "Strict Benchmarks"
        },
        {
            icon: FaShieldAlt,
            title: "Radical Transparency",
            description: "Direct venue rates, clear per-plate catering breakdowns, and guaranteed dates with zero hidden markups or surprise fees.",
            tag: "100% Transparent"
        },
        {
            icon: FaUtensils,
            title: "Master Culinary Excellence",
            description: "Collaborations with certified master chefs offering private pre-booking tastings and tailored dietary customization.",
            tag: "Haute Cuisine"
        },
        {
            icon: FaHeart,
            title: "Dedicated Event Concierge",
            description: "From initial walkthroughs to day-of coordination, our certified team is by your side to ensure every moment is executed flawlessly.",
            tag: "VIP Hospitality"
        }
    ];

    const milestones = [
        { number: "10,000+", label: "Celebrations Hosted", sub: "Weddings, Galas & Dinners" },
        { number: "500+", label: "Verified Venues", sub: "Handpicked Luxury Spaces" },
        { number: "12+", label: "Metropolitan Cities", sub: "Nationwide Presence" },
        { number: "4.9 / 5.0", label: "Average Client Rating", sub: "From 15,000+ Reviews" }
    ];

    return (
        <div className="overflow-hidden bg-ivory-warm font-body text-navy">
            
            {/* HERO SECTION */}
            <section ref={heroRef} className="relative min-h-[65vh] flex items-center justify-center pt-28 pb-16 overflow-hidden bg-navy text-white">
                {/* Background Image & Ambient Lighting */}
                <img
                    src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1800&q=85"
                    alt="Venuora Luxury Banquet"
                    className="absolute inset-0 w-full h-full object-cover opacity-25"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy-dark/90" />
                <div className="absolute -top-20 right-0 w-[500px] h-[500px] bg-terracotta/20 rounded-full blur-[140px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold/15 rounded-full blur-[140px] pointer-events-none" />

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-4xl about-hero-content">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-[0.2em] text-terracotta-light mb-6">
                        <span className="w-2 h-2 rounded-full bg-terracotta-light animate-pulse" />
                        <span>Our Heritage & Philosophy</span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold font-playfair leading-tight text-white mb-6">
                        Crafting Exceptional Spaces for <br />
                        <span className="text-gradient-gold italic">Lifelong Memories</span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
                        Venuora was born from a simple belief: booking a grand venue for your life's biggest milestones should be as joyous and seamless as the celebration itself.
                    </p>
                </div>
            </section>

            {/* OUR STORY / ESSENCE SECTION */}
            <section ref={storyRef} className="py-24 bg-white relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                        
                        {/* Left Visual Composition */}
                        <div className="lg:col-span-6 story-reveal relative">
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white z-10">
                                <img
                                    src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1000&q=80"
                                    alt="Grand Wedding Celebration"
                                    className="w-full h-[480px] object-cover hover:scale-105 transition-transform duration-700"
                                />
                            </div>

                            {/* Floating Accent Card */}
                            <div className="absolute -bottom-8 -right-4 sm:-right-8 bg-ivory-warm p-6 rounded-2xl shadow-xl border border-gray-100 z-20 max-w-xs hidden sm:block">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-terracotta text-white flex items-center justify-center text-lg">
                                        <FaAward />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Premium Standard</p>
                                        <p className="text-navy font-playfair font-bold text-lg">Top Rated 2026</p>
                                    </div>
                                </div>
                                <p className="text-xs text-body">
                                    Recognized as Pakistan's leading luxury event booking network.
                                </p>
                            </div>
                        </div>

                        {/* Right Content */}
                        <div className="lg:col-span-6 story-reveal">
                            <span className="text-terracotta uppercase tracking-[0.2em] text-xs font-bold bg-terracotta/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
                                The Venuora Journey
                            </span>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-bold text-navy leading-tight mb-6">
                                Where Architectural Grandeur Meets Flawless Coordination
                            </h2>
                            
                            <p className="text-body text-base leading-relaxed mb-4">
                                Traditional event planning is often clouded by fragmented pricing, unverified venue specs, and endless phone calls. Venuora changes that completely.
                            </p>

                            <p className="text-body text-base leading-relaxed mb-8">
                                We unite the most prestigious marriage halls, open-air lawns, and modern convention centers onto a unified digital platform. With accurate 360° visual galleries, real-time date availability, and certified hospitality managers, we make orchestrating your dream wedding or corporate gala effortless.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                                <div className="flex items-start gap-3">
                                    <FaCheckCircle className="text-terracotta text-base shrink-0 mt-1" />
                                    <div>
                                        <h4 className="font-bold text-navy text-sm font-playfair">Hand-Inspected Venues</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">Zero compromise on acoustics & cleanliness</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <FaCheckCircle className="text-terracotta text-base shrink-0 mt-1" />
                                    <div>
                                        <h4 className="font-bold text-navy text-sm font-playfair">AI Assisted Matchmaking</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">Instant budget and guest size curation</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* OUR PILLARS / VALUES */}
            <section ref={pillarsRef} className="py-24 bg-ivory-warm relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-terracotta uppercase tracking-[0.2em] text-xs font-bold bg-terracotta/10 px-4 py-1.5 rounded-full inline-block mb-3">
                            What Drives Us
                        </span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-bold text-navy leading-tight">
                            Our Core Commitments
                        </h2>
                        <p className="text-body mt-4 text-base sm:text-lg">
                            Four foundational promises we uphold with every host, couple, and planner.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((val, idx) => {
                            const IconComponent = val.icon;
                            return (
                                <div
                                    key={idx}
                                    className="pillar-card bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="w-14 h-14 rounded-2xl bg-terracotta/10 text-terracotta group-hover:bg-terracotta group-hover:text-white flex items-center justify-center text-2xl transition-all duration-300 shadow-sm">
                                                <IconComponent />
                                            </div>
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                                                {val.tag}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-bold font-playfair text-navy mb-3 group-hover:text-terracotta transition-colors">
                                            {val.title}
                                        </h3>

                                        <p className="text-body text-sm leading-relaxed">
                                            {val.description}
                                        </p>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-gray-50 flex items-center text-xs font-bold text-terracotta opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span>Guaranteed standard &rarr;</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* IMPACT NUMBERS BANNER */}
            <section ref={statsRef} className="py-20 bg-navy text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-terracotta blur-[140px]" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-gold blur-[140px]" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                        {milestones.map((item, idx) => (
                            <div key={idx} className="stat-box text-center">
                                <p className="text-3xl sm:text-4xl md:text-5xl font-bold font-playfair text-terracotta-light">
                                    {item.number}
                                </p>
                                <p className="text-sm sm:text-base font-bold text-white mt-2 font-playfair">
                                    {item.label}
                                </p>
                                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                                    {item.sub}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION */}
            <section className="py-24 bg-white relative text-center">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <span className="text-terracotta uppercase tracking-[0.2em] text-xs font-bold bg-terracotta/10 px-4 py-1.5 rounded-full inline-block mb-4">
                        Start Your Journey
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-bold text-navy leading-tight mb-6">
                        Ready to Discover the Perfect Venue for Your Celebration?
                    </h2>
                    <p className="text-body text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
                        Explore handpicked banquets and grand halls with transparent pricing, instant booking, and dedicated event support.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/halls"
                            className="w-full sm:w-auto btn-cta px-8 py-4 text-sm font-bold uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl transition-all"
                        >
                            Explore All Venues
                        </Link>
                        <Link
                            to="/contact"
                            className="w-full sm:w-auto btn-secondary px-8 py-4 text-sm font-bold uppercase tracking-wider rounded-xl transition-all"
                        >
                            Speak to an Event Specialist
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default About;
