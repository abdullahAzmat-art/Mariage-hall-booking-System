import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';

const CTABanner = () => {
    return (
        <section className="py-24 bg-navy relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[70%] rounded-full bg-terracotta blur-[120px]" />
                <div className="absolute bottom-[10%] -left-[10%] w-[40%] h-[50%] rounded-full bg-terracotta-light blur-[100px]" />
            </div>
            
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-white mb-6 leading-tight">
                    Your perfect venue is closer than you think.
                </h2>
                <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Discover, customize and book your next event with Venuora.
                </p>
                <Link
                    to="/halls"
                    className="btn-cta px-10 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                    Explore Venues <FaArrowRight />
                </Link>
            </div>
        </section>
    );
};

export default CTABanner;
