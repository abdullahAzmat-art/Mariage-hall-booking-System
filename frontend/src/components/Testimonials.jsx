import React from 'react';
import { FaStar, FaQuoteLeft } from 'react-icons/fa';

const testimonials = [
    {
        name: "Ali & Fatima",
        eventType: "Wedding",
        quote: "The Grand Royal Palace was absolutely stunning. The staff was incredibly helpful and made our day perfect.",
        rating: 5,
        image: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&q=80"
    },
    {
        name: "Bilal & Ayesha",
        eventType: "Wedding",
        quote: "Booking through Venuora was so easy. We found the perfect venue within our budget and the process was seamless.",
        rating: 5,
        image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&q=80"
    },
    {
        name: "Usman & Zainab",
        eventType: "Corporate Dinner",
        quote: "A dream come true! The venue was breathtaking and the service was top-notch. Highly recommended!",
        rating: 5,
        image: "https://images.unsplash.com/photo-1623168276632-47c182283a04?w=400&q=80"
    }
];

const Testimonials = () => {
    return (
        <section className="py-24 bg-ivory-warm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="text-terracotta uppercase tracking-[0.2em] text-sm font-bold">Testimonials</span>
                    <h2 className="text-4xl md:text-5xl font-playfair font-bold text-navy mt-3">What our clients say</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, idx) => (
                        <div key={idx} className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
                            <FaQuoteLeft className="text-terracotta/20 text-4xl mb-6" />
                            
                            <div className="flex gap-1 mb-4">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <FaStar key={i} className="text-terracotta text-sm" />
                                ))}
                            </div>

                            <p className="text-body italic text-lg leading-relaxed mb-6 flex-grow">
                                "{testimonial.quote}"
                            </p>

                            <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                                <img
                                    src={testimonial.image}
                                    alt={testimonial.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                                <div>
                                    <h4 className="font-bold text-navy font-playfair">{testimonial.name}</h4>
                                    <p className="text-sm text-terracotta font-medium">{testimonial.eventType}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
