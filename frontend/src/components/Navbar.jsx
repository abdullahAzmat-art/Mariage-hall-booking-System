import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import logo from '../assets/logo.png';
import authService from '../services/authService';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Check auth status and close mobile menu on route change
    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        setIsOpen(false);
    }, [location]);

    const handleLogout = () => {
        authService.logout();
        setUser(null);
        navigate('/login');
    };

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
        { name: 'Halls', path: '/halls' },
        { name: 'Policy', path: '/policy' },
        { name: 'Contact', path: '/contact' },
    ];

    return (
        <nav className={`fixed w-full z-50 transition-all duration-300  ${scrolled ? 'glass py-3 ' : 'bg-transparent text-black py-4'}`}>
            <div className=" mx-auto px-8 flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="text-2xl font-playfair font-bold  flex items-center gap-2 group">
                    <img src={logo} alt="RoyalVenue Logo" className="w-12 h-12 
                    object-contain rounded-full border-2 border-gold shadow-glow" />
                    <div className="flex flex-col">
                        <span className="text-gradient-gold text-3xl tracking-wide group-hover:scale-105 transition-transform duration-300">Royal</span>
                        <span className="text-xs text-gold-light tracking-[0.3em] uppercase transition-colors duration-300">Venue</span>
                    </div>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-7">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={`text-sm font-medium tracking-wide hover:text-gold-light transition-colors duration-300 relative after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-[2px] after:bg-gold-light after:transition-all after:duration-300 hover:after:w-full ${scrolled ? 'text-text' : ''}`}
                        >
                            {link.name}
                        </Link>
                    ))}

                    {user ? (
                        <div className="flex items-center gap-3">
                            <Link
                                to="/dashboard"
                                className="btn-gold text-sm shadow-lg flex items-center gap-2"
                            >
                                <FaUserCircle className="text-lg" />
                                Dashboard
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 rounded-full transition-all duration-300 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105"
                                title="Logout"
                            >
                                <FaSignOutAlt className="text-base" />
                                <span>Logout</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            <Link to="/login" className={`px-6 py-2 border rounded-full transition-all duration-300 text-sm font-medium hover:shadow-glow hover:scale-105 ${scrolled ? 'border-gold text-gold hover:bg-gold hover:text-white' : 'border-white/50  hover:bg-white hover:text-gold'}`}>
                                Login
                            </Link>
                            <Link to="/register" className="btn-gold text-sm shadow-lg">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-2xl text-gold-light focus:outline-none"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <FaTimes /> : <FaBars />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <div className={`md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-md shadow-lg transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-screen py-6' : 'max-h-0 py-0'}`}>
                <div className="flex flex-col items-center gap-6">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className="text-text text-lg font-medium hover:text-gold transition-colors"
                        >
                            {link.name}
                        </Link>
                    ))}
                    <div className="flex flex-col gap-4 w-full px-8 mt-4">
                        {user ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="w-full py-3 text-center btn-gold shadow-md flex items-center justify-center gap-2"
                                >
                                    <FaUserCircle /> Dashboard
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full py-3 text-center bg-red-500 hover:bg-red-600 rounded-full transition-all duration-300 font-semibold text-white shadow-lg flex items-center justify-center gap-2"
                                >
                                    <FaSignOutAlt /> Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="w-full py-3 text-center border border-gold text-gold rounded-full hover:bg-gold hover:text-white transition-all font-medium">
                                    Login
                                </Link>
                                <Link to="/register" className="w-full py-3 text-center btn-gold shadow-md">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav >
    );
};

export default Navbar;
