import React, { useState, useEffect, useRef } from 'react';
import { FaStar, FaChevronLeft, FaChevronRight, FaQuoteLeft } from 'react-icons/fa';
import { gsap } from 'gsap';

const couplesData = [
    {
        id: 1,
        names: "Ali & Fatima",
        date: "Married in 2023",
        image: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?q=80&w=2070&auto=format&fit=crop", // South Asian couple
        testimonial: "The Grand Royal Palace was absolutely stunning. The staff was incredibly helpful and made our day perfect. Every detail was taken care of, allowing us to truly enjoy our moment. Highly recommended!",
        rating: 5
    },
    {
        id: 2,
        names: "Bilal & Ayesha",
        date: "Married in 2024",
        image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1974&auto=format&fit=crop", // Wedding hands/couple
        testimonial: "Booking through RoyalVenue was so easy. We found the perfect venue within our budget in Lahore and the process was seamless. The ambiance was magical and our guests are still talking about it!",
        rating: 5
    },
    {
        id: 3,
        names: "Usman & Zainab",
        date: "Married in 2023",
        image: "https://images.unsplash.com/photo-1623168276632-47c182283a04?q=80&w=2071&auto=format&fit=crop", // Traditional wear
        testimonial: "A dream come true! The venue was breathtaking and the service was top-notch. We couldn't have asked for a better place to start our forever. Best hall in Karachi!",
        rating: 5
    },
    {
        id: 4,
        names: "Ahmed & Sara",
        date: "Married in 2022",
        image: "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?q=80&w=2070&auto=format&fit=crop", // Elegant wedding
        testimonial: "From the lighting to the decor, everything was perfect. The team went above and beyond to accommodate our requests. Thank you for making our day so special.",
        rating: 5
    }
];

const CoupleTestimonials = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const slideRef = useRef(null);
    const timeoutRef = useRef(null);

    const resetTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };

    useEffect(() => {
        resetTimeout();
        timeoutRef.current = setTimeout(() => {
            nextSlide();
        }, 5000); // Auto-slide every 5 seconds

        return () => {
            resetTimeout();
        };
    }, [currentIndex]);

    const nextSlide = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === couplesData.length - 1 ? 0 : prevIndex + 1
        );
    };

    const prevSlide = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? couplesData.length - 1 : prevIndex - 1
        );
    };

    useEffect(() => {
        // Slower GSAP animation for slide transition
        gsap.fromTo(slideRef.current,
            { opacity: 0, x: 50 },
            { opacity: 1, x: 0, duration: 1.5, ease: "power2.out" }
        );
    }, [currentIndex]);

    return (
        <section className="py-24 relative overflow-hidden bg-white">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
            <div className="absolute top-1/4 left-10 w-64 h-64 bg-gold/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-10 w-64 h-64 bg-gold/10 rounded-full blur-3xl"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <span className="text-gold tracking-[0.2em] uppercase text-sm font-medium mb-2 block">Testimonials</span>
                    <h2 className="text-4xl md:text-6xl font-playfair font-bold text-gray-900 mb-6">Happy <span className="text-gradient-gold">Couples</span></h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto rounded-full"></div>
                </div>

                <div className="max-w-4xl mx-auto relative">
                    {/* Slider Content */}
                    <div ref={slideRef} className="bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-gray-100 relative">
                        <div className="absolute -top-6 -left-6 text-6xl text-gold/20 font-serif">
                            <FaQuoteLeft />
                        </div>

                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            {/* Image */}
                            <div className="w-32 h-32 md:w-48 md:h-48 flex-shrink-0 rounded-full p-1 bg-gradient-to-br from-gold to-primary overflow-hidden shadow-lg">
                                <img
                                    src={couplesData[currentIndex].image}
                                    alt={couplesData[currentIndex].names}
                                    className="w-full h-full object-cover rounded-full border-4 border-white"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2070&auto=format&fit=crop"; // Fallback image
                                    }}
                                />
                            </div>

                            {/* Text Content */}
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex justify-center md:justify-start gap-1 mb-4">
                                    {[...Array(couplesData[currentIndex].rating)].map((_, i) => (
                                        <FaStar key={i} className="text-gold text-lg" />
                                    ))}
                                </div>
                                <p className="text-gray-600 italic mb-6 text-lg md:text-xl leading-relaxed font-light">
                                    "{couplesData[currentIndex].testimonial}"
                                </p>
                                <div>
                                    <h4 className="font-playfair font-bold text-gray-900 text-2xl mb-1">{couplesData[currentIndex].names}</h4>
                                    <p className="text-sm text-gold font-medium tracking-wide">{couplesData[currentIndex].date}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <button
                        onClick={prevSlide}
                        className="absolute top-1/2 -left-4 md:-left-12 transform -translate-y-1/2 bg-white text-gray-800 p-3 rounded-full shadow-lg hover:bg-gold hover:text-white transition-all duration-300 z-20 focus:outline-none"
                        aria-label="Previous Slide"
                    >
                        <FaChevronLeft />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute top-1/2 -right-4 md:-right-12 transform -translate-y-1/2 bg-white text-gray-800 p-3 rounded-full shadow-lg hover:bg-gold hover:text-white transition-all duration-300 z-20 focus:outline-none"
                        aria-label="Next Slide"
                    >
                        <FaChevronRight />
                    </button>

                    {/* Dots Indicator */}
                    <div className="flex justify-center gap-2 mt-8">
                        {couplesData.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${currentIndex === idx ? 'bg-gold w-8' : 'bg-gray-300 hover:bg-gold/50'
                                    }`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CoupleTestimonials;
