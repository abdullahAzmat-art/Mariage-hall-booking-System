import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FaAward, FaUsers, FaGlassCheers, FaHeart } from 'react-icons/fa';
import aboutHeroBg from '../assets/about-hero.png';
import ourStoryImg from '../assets/our-story.png';

gsap.registerPlugin(ScrollTrigger);

const About = () => {
    const heroRef = useRef(null);
    const storyRef = useRef(null);
    const statsRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Hero Animation
            gsap.from(".hero-text", {
                y: 50,
                opacity: 0,
                duration: 1,
                delay: 0.2,
                ease: "power3.out"
            });

            // Story Section Animation
            gsap.from(".story-content", {
                scrollTrigger: {
                    trigger: storyRef.current,
                    start: "top 80%",
                },
                y: 30,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2
            });

            // Stats Animation
            gsap.from(".stat-item", {
                scrollTrigger: {
                    trigger: statsRef.current,
                    start: "top 80%",
                },
                scale: 0.8,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "back.out(1.7)"
            });
        });

        return () => ctx.revert();
    }, []);

    const stats = [
        { icon: <FaAward />, value: "15+", label: "Years of Excellence" },
        { icon: <FaUsers />, value: "5000+", label: "Happy Guests" },
        { icon: <FaHeart />, value: "800+", label: "Weddings Hosted" },
        { icon: <FaGlassCheers />, value: "100%", label: "Satisfaction" },
    ];

    return (
        <div className="overflow-hidden pt-20">
            {/* Hero Section */}
            <section ref={heroRef} className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src={aboutHeroBg}
                        alt="About Us Background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60"></div>
                </div>
                <div className="relative z-10 text-center text-white hero-text px-4">
                    <h1 className="text-5xl md:text-7xl font-playfair font-bold mb-4 text-gradient-gold">Our Legacy</h1>
                    <p className="text-xl md:text-2xl font-light max-w-2xl mx-auto text-gray-200">Crafting unforgettable moments since 2008.</p>
                </div>
            </section>

            {/* Our Story Section */}
            <section ref={storyRef} className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="md:w-1/2 story-content">
                            <div className="relative">
                                <div className="absolute -top-4 -left-4 w-24 h-24 border-t-4 border-l-4 border-gold rounded-tl-3xl"></div>
                                <img
                                    src={ourStoryImg}
                                    alt="Our Story"
                                    className="rounded-xl shadow-card w-full object-cover h-[500px]"
                                />
                                <div className="absolute -bottom-4 -right-4 w-24 h-24 border-b-4 border-r-4 border-gold rounded-br-3xl"></div>
                            </div>
                        </div>
                        <div className="md:w-1/2 story-content">
                            <h2 className="text-4xl font-playfair font-bold text-primary mb-6">Where Elegance Meets Tradition</h2>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                At LuxeHalls, we believe that every love story deserves a perfect setting. Founded with a vision to bring luxury and sophistication to wedding celebrations, we have established ourselves as the premier choice for couples seeking an extraordinary experience.
                            </p>
                            <p className="text-gray-600 mb-8 leading-relaxed">
                                Our venues are designed to inspire, with attention to every detail—from the grand architecture to the exquisite lighting. We take pride in our ability to transform your dreams into reality, ensuring that your special day is nothing short of magical.
                            </p>
                            <div className="flex gap-4">
                                <div className="w-16 h-1 bg-gold rounded-full"></div>
                                <div className="w-8 h-1 bg-gold/50 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section ref={statsRef} className="py-16 bg-primary text-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="stat-item text-center p-6 glass rounded-xl hover:bg-white/20 transition-colors">
                                <div className="text-4xl text-gold mb-4 flex justify-center">{stat.icon}</div>
                                <h3 className="text-4xl font-bold mb-2">{stat.value}</h3>
                                <p className="text-white/80 font-medium">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
