import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="bg-navy text-white pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    <div className="lg:col-span-1">
                        <Link to="/" className="text-3xl font-bold tracking-widest uppercase text-white block mb-6">
                            VENUORA
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-sm">
                            A premium multi-venue event booking platform. Discover, compare and book extraordinary spaces for your most cherished moments.
                        </p>
                        <div className="flex space-x-5 text-gray-400">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-terracotta hover:text-white transition-all duration-300"><FaFacebookF /></a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-terracotta hover:text-white transition-all duration-300"><FaInstagram /></a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-terracotta hover:text-white transition-all duration-300"><FaTwitter /></a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-terracotta hover:text-white transition-all duration-300"><FaLinkedinIn /></a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-6 uppercase tracking-wider text-sm">Explore</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><Link to="/halls" className="hover:text-terracotta-light transition-colors">Venues</Link></li>
                            <li><Link to="/halls" className="hover:text-terracotta-light transition-colors">Categories</Link></li>
                            <li><Link to="/#how-it-works" className="hover:text-terracotta-light transition-colors">How It Works</Link></li>
                            <li><Link to="/#faq" className="hover:text-terracotta-light transition-colors">FAQs</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-6 uppercase tracking-wider text-sm">Company</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><Link to="/about" className="hover:text-terracotta-light transition-colors">About</Link></li>
                            <li><Link to="/contact" className="hover:text-terracotta-light transition-colors">Contact</Link></li>
                            <li><Link to="/careers" className="hover:text-terracotta-light transition-colors">Careers</Link></li>
                            <li><Link to="/policy" className="hover:text-terracotta-light transition-colors">Privacy Policy</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-6 uppercase tracking-wider text-sm">Support</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><Link to="/contact" className="hover:text-terracotta-light transition-colors">Help Center</Link></li>
                            <li><Link to="/policy" className="hover:text-terracotta-light transition-colors">FAQs</Link></li>
                            <li><Link to="/policy" className="hover:text-terracotta-light transition-colors">Terms of Service</Link></li>
                            <li><Link to="/policy" className="hover:text-terracotta-light transition-colors">Privacy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-400">
                        &copy; {new Date().getFullYear()} Venuora. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm text-gray-400">
                        <Link to="/policy" className="hover:text-terracotta-light transition-colors">Privacy</Link>
                        <Link to="/policy" className="hover:text-terracotta-light transition-colors">Terms</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
