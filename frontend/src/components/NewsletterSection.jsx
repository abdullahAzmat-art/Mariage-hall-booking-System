import React, { useState } from 'react';
import { FaPaperPlane, FaCheckCircle, FaEnvelope, FaGift } from 'react-icons/fa';

const NewsletterSection = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !email.includes('@')) return;
        
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setSubmitted(true);
            setEmail('');
        }, 800);
    };

    return (
        <section className="py-20 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="bg-gradient-to-r from-navy via-navy to-navy-dark rounded-3xl p-8 md:p-14 text-white shadow-2xl relative overflow-hidden">
                    {/* Background glows */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-terracotta/20 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-gold/15 rounded-full blur-[90px] pointer-events-none" />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                        <div className="lg:col-span-7">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-terracotta-light text-xs font-semibold uppercase tracking-wider mb-4">
                                <FaGift className="text-sm" />
                                <span>Complimentary Planning Guide</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-white leading-tight mb-4">
                                Download the 2026 Luxury Wedding & Event Checklist
                            </h2>
                            <p className="text-gray-300 text-base md:text-lg max-w-xl leading-relaxed">
                                Join 15,000+ planners and couples receiving exclusive venue promotions, seasonal decor trends, and our 12-month milestone timeline.
                            </p>
                        </div>

                        <div className="lg:col-span-5">
                            {submitted ? (
                                <div className="bg-white/10 backdrop-blur-md border border-emerald-500/30 p-6 rounded-2xl text-center">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 text-2xl">
                                        <FaCheckCircle />
                                    </div>
                                    <h4 className="font-playfair font-bold text-xl text-white">Check Your Inbox!</h4>
                                    <p className="text-gray-300 text-sm mt-1">
                                        We've sent the complete 2026 Event Planning Guide & VIP venue pass to your email.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                                    <div className="relative">
                                        <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email address..."
                                            required
                                            className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-terracotta-light focus:bg-white/15 transition-all"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-terracotta hover:bg-terracotta-light hover:text-navy text-white font-bold py-4 rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm uppercase tracking-wider disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <span>Sending Guide...</span>
                                        ) : (
                                            <>
                                                <span>Get Free VIP Guide</span>
                                                <FaPaperPlane className="text-xs" />
                                            </>
                                        )}
                                    </button>
                                    <p className="text-xs text-gray-400 text-center mt-1">
                                        🔒 Zero spam. Unsubscribe anytime with 1-click.
                                    </p>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default NewsletterSection;
