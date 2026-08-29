import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import hallService from '../services/hallService';
import VenueCard from './VenueCard';

gsap.registerPlugin(ScrollTrigger);

const FeaturedVenues = () => {
    const [halls, setHalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const sectionRef = useRef(null);

    useEffect(() => {
        const fetchHalls = async () => {
            try {
                const allHalls = await hallService.getAllHalls();
                const topHalls = allHalls
                    .sort((a, b) => (b.price || 0) - (a.price || 0))
                    .slice(0, 4);
                setHalls(topHalls);
            } catch (error) {
                console.error('Failed to fetch halls', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHalls();
    }, []);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.venue-card', {
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 80%',
                },
                y: 60,
                opacity: 0,
                duration: 1,
                stagger: 0.15,
                ease: 'power3.out'
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="py-24 bg-ivory-warm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16">
                    <div className="text-center md:text-left mb-8 md:mb-0">
                        <span className="text-terracotta uppercase tracking-[0.2em] text-sm font-bold">Curated Collection</span>
                        <h2 className="text-4xl md:text-5xl font-playfair font-bold text-navy mt-3 leading-tight">
                            Exceptional venues,<br />thoughtfully selected.
                        </h2>
                        <p className="text-body mt-4 max-w-lg text-lg">
                            Discover handpicked venues that redefine elegance and comfort for your most cherished moments.
                        </p>
                    </div>
                    <Link to="/halls" className="hidden md:inline-flex items-center gap-2 text-terracotta font-bold hover:text-cta transition-colors group">
                        Explore All <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100">
                                <div className="h-72 bg-gray-200 animate-pulse" />
                                <div className="p-6 space-y-4">
                                    <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
                                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : halls.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {halls.map((hall) => (
                            <div key={hall._id} className="venue-card">
                                <VenueCard hall={hall} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-body text-lg">No venues available at the moment.</p>
                    </div>
                )}

                <div className="text-center mt-12 md:hidden">
                    <Link to="/halls" className="inline-flex items-center gap-2 border-2 border-terracotta text-terracotta px-8 py-3 rounded-full font-bold hover:bg-terracotta hover:text-white transition-colors duration-300">
                        Explore All Venues
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default FeaturedVenues;
