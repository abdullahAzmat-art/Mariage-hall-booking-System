import React from 'react';
import { Link } from 'react-router-dom';

const categories = [
    {
        title: "Weddings",
        image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80",
        link: "/halls?category=weddings"
    },
    {
        title: "Corporate",
        image: "https://images.unsplash.com/photo-1540575467068-1e5db6a66e4d?w=800&q=80",
        link: "/halls?category=corporate"
    },
    {
        title: "Private Parties",
        image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
        link: "/halls?category=private"
    }
];

const Categories = () => {
    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="text-terracotta uppercase tracking-[0.2em] text-sm font-bold">Categories</span>
                    <h2 className="text-4xl md:text-5xl font-playfair font-bold text-navy mt-3">Find by occasion</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {categories.map((category, idx) => (
                        <Link
                            key={idx}
                            to={category.link}
                            className="group relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden"
                        >
                            <img
                                src={category.image}
                                alt={category.title}
                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/40 to-transparent" />
                            <div className="absolute inset-0 flex items-end p-8">
                                <div>
                                    <h3 className="text-3xl md:text-4xl font-bold text-white font-playfair group-hover:text-terracotta-light transition-colors duration-300">
                                        {category.title}
                                    </h3>
                                    <div className="mt-4 flex items-center gap-2 text-white/80 text-sm font-medium group-hover:text-white transition-colors">
                                        <span>Explore</span>
                                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Categories;
