import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FaStar } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import TrustBar from '../components/TrustBar';
import FeaturedVenues from '../components/FeaturedVenues';
import HowItWorks from '../components/HowItWorks';
import WhyVenuora from '../components/WhyVenuora';
import Categories from '../components/Categories';
import Testimonials from '../components/Testimonials';
import CTABanner from '../components/CTABanner';

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
    const heroRef = useRef(null);

    useEffect(() => {
        const heroCtx = gsap.context(() => {
            gsap.from(".hero-content > *", {
                y: 50,
                opacity: 0,
                duration: 1,
                stagger: 0.15,
                ease: "power3.out",
                delay: 0.2
            });

            gsap.from(".hero-images", {
                x: 50,
                opacity: 0,
                duration: 1.2,
                ease: "power3.out",
                delay: 0.5
            });

            gsap.to(".hero-bg-img", {
                yPercent: 15,
                ease: "none",
                scrollTrigger: {
                    trigger: heroRef.current,
                    start: "top top",
                    end: "bottom top",
                    scrub: true
                }
            });

            gsap.to(".floating-card", {
                y: -20,
                duration: 2.5,
                yoyo: true,
                repeat: -1,
                ease: "sine.inOut",
                delay: 1.5
            });
        }, heroRef);

        return () => heroCtx.revert();
    }, []);

    return (
        <div className="overflow-hidden bg-ivory-warm font-body text-navy">
            {/* Hero Section - LOCKED */}
            <section ref={heroRef} className="relative min-h-[90vh] flex items-center pt-24 pb-12 overflow-hidden bg-ivory-warm">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[70%] rounded-full bg-plum/5 blur-[120px]"></div>
                    <div className="absolute top-[40%] -left-[10%] w-[40%] h-[50%] rounded-full bg-gold/10 blur-[100px]"></div>
                </div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                        
                        {/* Text Content & Search Widget */}
                        <div className="hero-content flex flex-col justify-center max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-100 shadow-sm mb-6 w-max">
                                <span className="flex h-2 w-2 rounded-full bg-gold"></span>
                                <span className="text-xs font-semibold uppercase tracking-widest text-plum">Venuora Premium Collection</span>
                            </div>
                            
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-playfair text-plum mb-6 leading-tight">
                                Curated Spaces for <br/>
                                <span className="relative">
                                    <span className="relative z-10 text-[#D4AF37]">Extraordinary</span>
                                    <span className="absolute bottom-2 left-0 w-full h-3 bg-gold/20 -z-10 transform -rotate-1"></span>
                                </span> <br/>
                                Moments
                            </h1>
                            
                            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-lg">
                                Discover and book the most exclusive venues for weddings, corporate galas, and private celebrations. Seamless, secure, and unforgettable.
                            </p>
                            
                            {/* Quick Search Widget */}
                            <div className="bg-white p-3 rounded-2xl shadow-lg border border-gray-100 flex flex-col md:flex-row gap-3">
                                <div className="flex-1 px-4 py-2 bg-gray-50 rounded-xl border border-transparent focus-within:border-gold/50 focus-within:bg-white transition-all">
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Location</label>
                                    <input type="text" placeholder="Where is your event?" className="w-full bg-transparent outline-none text-plum text-sm font-medium placeholder-gray-400" />
                                </div>
                                <div className="flex-1 px-4 py-2 bg-gray-50 rounded-xl border border-transparent focus-within:border-gold/50 focus-within:bg-white transition-all">
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Guests</label>
                                    <input type="number" placeholder="How many?" className="w-full bg-transparent outline-none text-plum text-sm font-medium placeholder-gray-400" />
                                </div>
                                <Link to="/halls" className="btn-primary py-4 px-8 md:px-10 rounded-xl h-full shadow-md text-center">
                                    Search
                                </Link>
                            </div>
                            
                            {/* Social Proof */}
                            <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-gray-500 font-medium">
                                <div className="flex -space-x-3">
                                    <img src="https://i.pravatar.cc/100?img=1" alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                                    <img src="https://i.pravatar.cc/100?img=5" alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                                    <img src="https://i.pravatar.cc/100?img=9" alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                                    <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center text-xs font-bold text-plum">+2k</div>
                                </div>
                                <p>Trusted by 2,000+ happy couples & planners</p>
                            </div>
                        </div>

                        {/* Image Composition */}
                        <div className="relative h-[500px] md:h-[600px] w-full hidden md:block hero-images">
                            <div className="absolute top-0 right-0 w-[80%] h-[85%] rounded-3xl overflow-hidden shadow-2xl border-4 border-white z-10 transform translate-x-4 -translate-y-4">
                                <img src="https://i.pinimg.com/474x/6d/bb/ac/6dbbac592cadd902ba79d8c6f04e0297.jpg" alt="Elegant Event Space" className="w-full h-full object-cover hero-bg-img" />
                            </div>
                            <div className="absolute bottom-0 left-0 w-[55%] h-[45%] rounded-3xl overflow-hidden shadow-xl border-4 border-white z-20">
                                <img src="https://i.pinimg.com/474x/8d/f9/a3/8df9a34688de3656b8e6e732bd02e702.jpg" alt="Beautiful Setup" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                            </div>
                            
                            {/* Floating UI Card */}
                            <div className="floating-card absolute top-[40%] -left-8 bg-white p-4 rounded-2xl shadow-xl border border-gray-50 z-30 flex items-center gap-4">
                                <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center text-gold">
                                    <FaStar className="text-xl" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Top Rated</p>
                                    <p className="text-plum font-bold text-lg">4.9/5.0</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <TrustBar />
            <FeaturedVenues />
            <HowItWorks />
            <WhyVenuora />
            <Categories />
            <Testimonials />
            <CTABanner />
        </div>
    );
};

export default Home;
