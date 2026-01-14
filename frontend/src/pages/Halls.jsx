import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import HallCard from '../components/HallCard';
import { FaSearch, FaMapMarkerAlt, FaMoneyBillWave } from 'react-icons/fa';
import hallService from '../services/hallService';

const Halls = () => {
    const containerRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('all');
    const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
    const [halls, setHalls] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHalls = async () => {
            try {
                const data = await hallService.getAllHalls();
                setHalls(data);
                if (data.length > 0) {
                    const prices = data.map(h => h.price);
                    setPriceRange({ min: 0, max: Math.max(...prices) + 10000 });
                }
            } catch (error) {
                console.error("Failed to fetch halls", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHalls();
    }, []);

    const uniqueLocations = ['all', ...new Set(halls.map(hall => hall.location))];
    const maxPrice = Math.max(...halls.map(h => h.price), 100000);

    const filteredHalls = halls.filter(hall => {
        const matchesSearch = hall.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            hall.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLocation = selectedLocation === 'all' || hall.location === selectedLocation;
        const matchesPrice = hall.price >= priceRange.min && hall.price <= priceRange.max;
        return matchesSearch && matchesLocation && matchesPrice;
    });

    useEffect(() => {
        if (!loading) {
            const ctx = gsap.context(() => {
                gsap.from(".hall-item", {
                    y: 30,
                    opacity: 0,
                    duration: 0.5,
                    stagger: 0.1,
                    ease: "power2.out"
                });
            }, containerRef);
            return () => ctx.revert();
        }
    }, [searchTerm, loading]);

    const clearAllFilters = () => {
        setSearchTerm('');
        setSelectedLocation('all');
        setPriceRange({ min: 0, max: maxPrice });
    };

    const hasActiveFilters = searchTerm || selectedLocation !== 'all' || priceRange.max !== maxPrice;

    return (
        <div className="bg-gray-50 min-h-screen pt-24 pb-12" ref={containerRef}>
            <div className="container mx-auto px-4">
                <div className="mb-10 text-center">
                    <span className="text-gold tracking-[0.2em] uppercase text-xs font-medium mb-2 block">Discover</span>
                    <h1 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-6">
                        Find Your Perfect <span className="bg-gradient-to-r from-gold via-gold-dark to-gold bg-clip-text text-transparent">Venue</span>
                    </h1>

                    <div className="max-w-4xl mx-auto bg-gradient-to-br from-white to-gray-50 p-4 rounded-2xl shadow-xl border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Search Input */}
                            <div className="relative group">
                                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gold text-sm transition-all duration-300 group-hover:scale-110" />
                                <input
                                    type="text"
                                    placeholder="Search halls..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full h-11 pl-11 pr-4 text-sm rounded-xl border-2 border-gray-200 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-300 bg-white hover:shadow-md font-medium text-gray-700 placeholder-gray-400"
                                />
                            </div>

                            {/* Location Dropdown */}
                            <div className="relative group">
                                <FaMapMarkerAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gold text-sm z-10 transition-all duration-300 group-hover:scale-110" />
                                <select
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                    className="w-full h-11 pl-11 pr-9 text-sm rounded-xl border-2 border-gray-200 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-300 bg-white hover:shadow-md appearance-none cursor-pointer font-medium text-gray-700"
                                >
                                    {uniqueLocations.map((location) => (
                                        <option key={location} value={location}>
                                            {location === 'all' ? 'All Locations' : location}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <svg className="w-3 h-3 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>

                            {/* Price Range */}
                            <div className="relative group">
                                <FaMoneyBillWave className="absolute left-4 top-4 text-gold text-sm z-10 transition-all duration-300 group-hover:scale-110" />
                                <div className="h-11 pl-11 pr-4 py-2 rounded-xl border-2 border-gray-200 bg-white hover:shadow-md transition-all duration-300 flex flex-col justify-center">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-xs font-semibold text-gray-600">Max Price</span>
                                        <span className="text-xs font-bold bg-gradient-to-r from-gold to-gold-dark bg-clip-text text-transparent">
                                            Rs {priceRange.max.toLocaleString()}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max={maxPrice}
                                        value={priceRange.max}
                                        onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gold hover:accent-gold-dark transition-all"
                                        style={{
                                            background: `linear-gradient(to right, #C9A961 0%, #C9A961 ${(priceRange.max / maxPrice) * 100}%, #e5e7eb ${(priceRange.max / maxPrice) * 100}%, #e5e7eb 100%)`
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Clear Filters Button */}
                        {hasActiveFilters && (
                            <div className="mt-3 text-center">
                                <button
                                    onClick={clearAllFilters}
                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs bg-gradient-to-r from-gold/10 to-gold-dark/10 hover:from-gold/20 hover:to-gold-dark/20 text-gold font-semibold rounded-full transition-all duration-300 hover:shadow-md border border-gold/20"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Clear filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredHalls.map((hall) => (
                        <div key={hall._id} className="hall-item">
                            <HallCard hall={hall} />
                        </div>
                    ))}
                </div>

                {filteredHalls.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaSearch className="text-gray-400 text-3xl" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No venues found</h3>
                        <p className="text-gray-500 mb-6">We couldn't find any venues matching your search.</p>
                        <button
                            onClick={clearAllFilters}
                            className="text-gold font-bold hover:text-gold-dark transition-colors underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Halls;
