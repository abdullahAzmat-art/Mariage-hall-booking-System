import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import authService from '../services/authService';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

    const handleNavLinkClick = (e, link) => {
        setIsOpen(false);
        if (link.path.includes('#')) {
            const [basePath, hash] = link.path.split('#');
            if (location.pathname === (basePath || '/')) {
                e.preventDefault();
                const target = document.getElementById(hash);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }
    };

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Venues', path: '/halls' },
        { name: 'How It Works', path: '/#how-it-works' },
        { name: 'About', path: '/about' },
    ];

    return (
        <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm py-3' : 'bg-transparent py-5'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-2 group">
                    <span className={`text-2xl font-bold tracking-widest uppercase transition-colors duration-300 ${scrolled ? 'text-navy' : 'text-navy'}`}>
                        VENUORA
                    </span>
                </Link>

                <div className="hidden md:flex items-center space-x-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            onClick={(e) => handleNavLinkClick(e, link)}
                            className={`text-sm font-medium tracking-wide transition-colors duration-300 hover:text-terracotta ${scrolled ? 'text-navy' : 'text-navy'}`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <Link to="/dashboard" className="text-sm font-medium text-navy hover:text-terracotta transition-colors flex items-center gap-2">
                                <FaUserCircle className="text-lg text-terracotta" />
                                Dashboard
                            </Link>
                            <button onClick={handleLogout} className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors flex items-center gap-2 ml-4" title="Logout">
                                <FaSignOutAlt />
                                <span>Logout</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-sm font-medium text-navy hover:text-terracotta transition-colors">Login</Link>
                            <Link to="/register" className="btn-cta">Get Started</Link>
                        </div>
                    )}
                </div>

                <button className={`md:hidden text-2xl focus:outline-none transition-colors ${scrolled ? 'text-navy' : 'text-navy'}`} onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <FaTimes /> : <FaBars />}
                </button>
            </div>

            <div className={`md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-lg transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-screen py-4' : 'max-h-0 py-0'}`}>
                <div className="flex flex-col items-center gap-4 px-4">
                    {navLinks.map((link) => (
                        <Link 
                            key={link.name} 
                            to={link.path} 
                            onClick={(e) => handleNavLinkClick(e, link)}
                            className="w-full text-center py-2 text-navy text-sm font-medium hover:text-terracotta transition-colors"
                        >
                            {link.name}
                        </Link>
                    ))}
                    <div className="w-full h-px bg-gray-100 my-2" />
                    {user ? (
                        <div className="w-full flex flex-col gap-3">
                            <Link to="/dashboard" className="w-full py-2.5 text-center btn-secondary flex items-center justify-center gap-2">
                                <FaUserCircle /> Dashboard
                            </Link>
                            <button onClick={handleLogout} className="w-full py-2.5 text-center text-red-500 border border-red-100 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                                <FaSignOutAlt /> Logout
                            </button>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col gap-3">
                            <Link to="/login" className="w-full py-2.5 text-center btn-secondary">Login</Link>
                            <Link to="/register" className="w-full py-2.5 text-center btn-cta">Get Started</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
