import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaUsers, FaCheckCircle, FaArrowRight } from 'react-icons/fa';
import hallService from '../services/hallService';
import CoupleTestimonials from '../components/CoupleTestimonials';

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
    const heroRef = useRef(null);

    const hallsRef = useRef(null);
    const statsRef = useRef(null);
    const [premiumHalls, setPremiumHalls] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch top 3 most expensive halls
    useEffect(() => {
        const fetchPremiumHalls = async () => {
            try {
                const allHalls = await hallService.getAllHalls();
                // Sort by price descending and get top 3
                const topHalls = allHalls
                    .sort((a, b) => b.price - a.price)
                    .slice(0, 3);
                setPremiumHalls(topHalls);
            } catch (error) {
                console.error('Failed to fetch premium halls', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPremiumHalls();
    }, []);

    useEffect(() => {
        // Hero Animation
        const heroCtx = gsap.context(() => {
            gsap.from(".hero-content > *", {
                y: 100,
                opacity: 0,
                duration: 1.2,
                stagger: 0.2,
                ease: "power4.out",
                delay: 0.5
            });

            gsap.to(".hero-bg-img", {
                yPercent: 30,
                ease: "none",
                scrollTrigger: {
                    trigger: heroRef.current,
                    start: "top top",
                    end: "bottom top",
                    scrub: true
                }
            });
        }, heroRef);



        // Halls Animation
        const hallsCtx = gsap.context(() => {
            gsap.from(".hall-card", {
                scrollTrigger: {
                    trigger: hallsRef.current,
                    start: "top 75%",
                },
                y: 60,
                opacity: 0,
                duration: 1,
                stagger: 0.2,
                ease: "power3.out"
            });
        }, hallsRef);

        // Stats Animation
        const statsCtx = gsap.context(() => {
            gsap.from(".stat-item", {
                scrollTrigger: {
                    trigger: statsRef.current,
                    start: "top 80%",
                },
                scale: 0.5,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2,
                ease: "back.out(1.7)"
            });
        }, statsRef);

        return () => {
            heroCtx.revert();

            hallsCtx.revert();
            statsCtx.revert();
        };
    }, []);



    return (
        <div className="overflow-hidden bg-white">
            {/* Hero Section */}
            <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
                {/* Background Image with Parallax Effect */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                        alt="Luxury Wedding Venue"
                        className="w-full h-full object-cover scale-110 hero-bg-img"
                    />
                    <div className="absolute inset-0 bg-black/50"></div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-4 relative z-10 text-center hero-content">
                    <div className="inline-block mb-4 px-6 py-2 border border-gold-light rounded-full glass">
                        <span className="text-gradient-gold uppercase tracking-[0.2em] text-sm font-bold">The Ultimate Venue</span>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-playfair font-bold text-white mb-6 leading-tight drop-shadow-lg">
                        Celebrate Love <br />
                        <span className="text-gradient-gold">In Luxury</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-100 mb-10 max-w-3xl mx-auto font-light drop-shadow-md">
                        Experience the perfect blend of elegance and sophistication for your special day.
                    </p>
                    <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                        <Link to="/halls" className="group relative px-10 py-4 btn-gold text-white rounded-full overflow-hidden shadow-lg hover:shadow-glow transition-all duration-300">
                            <div className="absolute inset-0 w-full h-full bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -translate-x-full skew-x-12"></div>
                            <span className="relative font-medium tracking-wide text-lg">Book Your Date</span>
                        </Link>
                        <button className="px-10 py-4 border border-white/50 text-white rounded-full hover:bg-white/10 transition-all duration-300 backdrop-blur-sm font-medium tracking-wide hover:border-white">
                            Explore Venues
                        </button>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-white/50">
                    <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
                        <div className="w-1 h-2 bg-gold-light rounded-full"></div>
                    </div>
                </div>
            </section>



            {/* Featured Halls Section */}
            <section ref={hallsRef} className="py-24 bg-white relative">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gray-50 skew-x-12 opacity-50 z-0"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16">
                        <div className="text-center md:text-left mb-8 md:mb-0">
                            <span className="text-gold uppercase tracking-widest text-sm font-bold">Exclusive Venues</span>
                            <h2 className="text-4xl md:text-5xl font-playfair font-bold text-gray-900 mt-2">Premium Collections</h2>
                        </div>
                        <Link to="/halls" className="hidden md:flex items-center gap-2 text-gray-900 font-bold hover:text-gold transition-colors group">
                            View All Halls <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {loading ? (
                            <div className="col-span-3 text-center py-20">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
                                <p className="mt-4 text-gray-500">Loading premium halls...</p>
                            </div>
                        ) : premiumHalls.length > 0 ? (
                            premiumHalls.map((hall) => (
                                <div key={hall._id} className="hall-card group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col h-full">
                                    <div className="relative h-64 overflow-hidden">
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300 z-10"></div>
                                        <img
                                            src={(() => {
                                                if (!hall.image && (!hall.images || hall.images.length === 0)) {
                                                    return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1498&q=80';
                                                }
                                                const imagePath = hall.image || hall.images[0];
                                                if (imagePath.startsWith('http')) return imagePath;
                                                return `http://localhost:5000/${imagePath.replace(/\\/g, '/')}`;
                                            })()}
                                            alt={hall.name}
                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1498&q=80';
                                            }}
                                        />
                                        <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold shadow-sm text-gold-dark border border-gold/20">
                                            Rs {hall.price.toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="p-6 flex flex-col flex-grow">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-2xl font-bold text-gray-900 font-playfair group-hover:text-gold transition-colors duration-300 line-clamp-1">{hall.name}</h3>
                                            <div className="flex items-center text-gold text-sm bg-gold/5 px-2 py-1 rounded">
                                                <FaStar className="mr-1" /> 4.8
                                            </div>
                                        </div>

                                        <div className="flex items-center text-gray-500 text-sm mb-4">
                                            <FaMapMarkerAlt className="mr-2 text-gold" />
                                            <span className="line-clamp-1">{hall.location}</span>
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center text-gray-600 text-sm">
                                                <FaUsers className="mr-2 text-gray-400" />
                                                <span className="font-medium">{hall.capacity || '500+'} Guests</span>
                                            </div>

                                            <Link
                                                to={`/halls/${hall._id}`}
                                                className="text-gold font-bold text-sm uppercase tracking-wide hover:text-gold-dark transition-colors flex items-center gap-2 group/link"
                                            >
                                                View Details <FaArrowRight className="group-hover/link:translate-x-1 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-3 text-center py-20">
                                <p className="text-gray-500">No halls available at the moment.</p>
                            </div>
                        )}
                    </div>

                    <div className="text-center mt-12 md:hidden">
                        <Link to="/halls" className="inline-block border-2 border-primary text-primary px-8 py-3 rounded-full font-bold hover:bg-primary hover:text-white transition-colors duration-300">
                            View All Halls
                        </Link>
                    </div>
                </div>
            </section>

            {/* Why Choose Us Section */}
            <section ref={statsRef} className="py-24 relative bg-gray-900 text-white overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <img src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80" alt="Background" className="w-full h-full object-cover" />
                </div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="text-gold uppercase tracking-widest text-sm font-bold">Why Choose RoyalVenue</span>
                            <h2 className="text-4xl md:text-5xl font-playfair font-bold mt-4 mb-6">We Make Your Special Day Unforgettable</h2>
                            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                                With years of experience and a passion for perfection, we ensure that every detail of your event is handled with care and precision.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "Verified Premium Venues",
                                    "Transparent Pricing & No Hidden Fees",
                                    "Dedicated Support Team",
                                    "Secure Booking Process"
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-3">
                                        <FaCheckCircle className="text-gold text-xl" />
                                        <span className="text-lg">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            {[
                                { number: "500+", label: "Weddings Hosted" },
                                { number: "98%", label: "Satisfaction Rate" },
                                { number: "50+", label: "Premium Venues" },
                                { number: "24/7", label: "Support Available" }
                            ].map((stat, idx) => (
                                <div key={idx} className="stat-item bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/10 text-center hover:bg-white/20 transition-colors duration-300">
                                    <div className="text-4xl md:text-5xl font-bold text-gold mb-2">{stat.number}</div>
                                    <div className="text-gray-300 font-medium">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <CoupleTestimonials />
        </div>
    );
};

export default Home;
