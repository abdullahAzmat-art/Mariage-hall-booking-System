import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <Link to="/" className="text-2xl font-bold text-primary font-poppins mb-4 block">
                            Marriage<span className="text-text">Hall</span>
                        </Link>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Making your special day unforgettable with our premium selection of marriage halls and event spaces.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-text mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><Link to="/halls" className="hover:text-primary transition-colors">Browse Halls</Link></li>
                            <li><Link to="/packages" className="hover:text-primary transition-colors">Packages</Link></li>
                            <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                            <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-text mb-4">Support</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
                            <li><Link to="/policy" className="hover:text-primary transition-colors">Our Policies</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-text mb-4">Connect</h4>
                        <div className="flex space-x-4 text-gray-400">
                            <a href="#" className="hover:text-primary transition-colors text-xl"><FaFacebook /></a>
                            <a href="#" className="hover:text-primary transition-colors text-xl"><FaInstagram /></a>
                            <a href="#" className="hover:text-primary transition-colors text-xl"><FaTwitter /></a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-8 text-center text-sm text-gray-400">
                    <p>&copy; {new Date().getFullYear()} Marriage Hall Booking System. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
