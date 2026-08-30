import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import HallCard from '../components/HallCard';
import { 
    FaSearch, 
    FaMapMarkerAlt, 
    FaMoneyBillWave, 
    FaFilter, 
    FaSortAmountDown, 
    FaUsers, 
    FaTimes,
    FaArrowRight
} from 'react-icons/fa';
import hallService from '../services/hallService';

const Halls = () => {
    const containerRef = useRef(null);
    const [searchParams, setSearchParams] = useSearchParams();
    
    const urlSearch = searchParams.get('search') || searchParams.get('location') || '';
    const urlCategory = searchParams.get('category') || '';
    const urlGuests = searchParams.get('guests') || '';

    const [searchTerm, setSearchTerm] = useState(urlSearch);
    const [selectedLocation, setSelectedLocation] = useState('all');
    const [selectedCapacity, setSelectedCapacity] = useState(urlGuests ? 'custom' : 'all');
    const [selectedCategory, setSelectedCategory] = useState(urlCategory || 'all');
    const [sortBy, setSortBy] = useState('featured');
    const [priceRange, setPriceRange] = useState({ min: 0, max: 200000 });
    const [maxPossiblePrice, setMaxPossiblePrice] = useState(200000);
    const [halls, setHalls] = useState([]);
    const [loading, setLoading] = useState(true);

    // Sync state with URL params
    useEffect(() => {
        const query = searchParams.get('search') || searchParams.get('location') || '';
        const cat = searchParams.get('category') || '';
        if (query) setSearchTerm(query);
        if (cat) setSelectedCategory(cat);
    }, [searchParams]);

    // Fetch halls data
    useEffect(() => {
        const fetchHalls = async () => {
            try {
                const data = await hallService.getAllHalls();
                setHalls(data);
                if (data.length > 0) {
                    const prices = data.map(h => typeof h.price === 'number' ? h.price : parseInt(h.price) || 0);
                    const calculatedMax = Math.max(...prices, 100000);
                    setMaxPossiblePrice(calculatedMax);
                    setPriceRange({ min: 0, max: calculatedMax });
                }
            } catch (error) {
                console.error("Failed to fetch halls", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHalls();
    }, []);

    // Extract unique locations
    const uniqueLocations = ['all', ...new Set(halls.map(hall => hall.location).filter(Boolean))];

    // Filter logic
    const filteredHalls = halls.filter(hall => {
        const name = (hall.name || '').toLowerCase();
        const location = (hall.location || '').toLowerCase();
        const description = (hall.description || '').toLowerCase();
        const search = searchTerm.toLowerCase().trim();

        const matchesSearch = !search || name.includes(search) || location.includes(search) || description.includes(search);
        const matchesLocation = selectedLocation === 'all' || hall.location === selectedLocation;
        
        const price = typeof hall.price === 'number' ? hall.price : parseInt(hall.price) || 0;
        const matchesPrice = price >= priceRange.min && price <= priceRange.max;

        // Capacity match
        let matchesCapacity = true;
        const capacityNum = parseInt(hall.capacity) || 500;
        if (selectedCapacity === 'small') matchesCapacity = capacityNum <= 300;
        else if (selectedCapacity === 'medium') matchesCapacity = capacityNum > 300 && capacityNum <= 700;
        else if (selectedCapacity === 'large') matchesCapacity = capacityNum > 700 && capacityNum <= 1200;
        else if (selectedCapacity === 'grand') matchesCapacity = capacityNum > 1200;
        else if (selectedCapacity === 'custom' && urlGuests) {
            matchesCapacity = capacityNum >= parseInt(urlGuests);
        }

        // Category match
        let matchesCategory = true;
        if (selectedCategory !== 'all') {
            matchesCategory = name.includes(selectedCategory.toLowerCase()) || description.includes(selectedCategory.toLowerCase());
        }

        return matchesSearch && matchesLocation && matchesPrice && matchesCapacity && matchesCategory;
    });

    // Sort logic
    const sortedHalls = [...filteredHalls].sort((a, b) => {
        const priceA = typeof a.price === 'number' ? a.price : parseInt(a.price) || 0;
        const priceB = typeof b.price === 'number' ? b.price : parseInt(b.price) || 0;
        const ratingA = parseFloat(a.rating) || 4.8;
        const ratingB = parseFloat(b.rating) || 4.8;

        if (sortBy === 'price-low') return priceA - priceB;
        if (sortBy === 'price-high') return priceB - priceA;
        if (sortBy === 'rating') return ratingB - ratingA;
        if (sortBy === 'capacity') return (parseInt(b.capacity) || 0) - (parseInt(a.capacity) || 0);
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); // default 'featured'
    });

    // GSAP Animate Cards
    useEffect(() => {
        if (!loading) {
            const ctx = gsap.context(() => {
                gsap.from(".hall-card-wrap", {
                    y: 30,
                    opacity: 0,
                    duration: 0.5,
                    stagger: 0.08,
                    ease: "power2.out"
                });
            }, containerRef);
            return () => ctx.revert();
        }
    }, [searchTerm, selectedLocation, selectedCapacity, selectedCategory, sortBy, priceRange, loading]);

    const clearAllFilters = () => {
        setSearchTerm('');
        setSelectedLocation('all');
        setSelectedCapacity('all');
        setSelectedCategory('all');
        setSortBy('featured');
        setPriceRange({ min: 0, max: maxPossiblePrice });
        setSearchParams({});
    };

    const hasActiveFilters = Boolean(
        searchTerm || 
        selectedLocation !== 'all' || 
        selectedCapacity !== 'all' || 
        selectedCategory !== 'all' || 
        priceRange.max !== maxPossiblePrice
    );

    const categories = [
        { id: 'all', label: 'All Venues' },
        { id: 'weddings', label: 'Weddings' },
        { id: 'corporate', label: 'Corporate' },
        { id: 'lawn', label: 'Open Lawns' },
        { id: 'grand', label: 'Grand Ballrooms' },
    ];

    return (
        <div className="bg-ivory-warm min-h-screen pt-28 pb-20 font-body text-navy" ref={containerRef}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header Banner */}
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <span className="text-terracotta uppercase tracking-[0.2em] text-xs font-bold bg-terracotta/10 px-4 py-1.5 rounded-full inline-block mb-3">
                        Curated Directory
                    </span>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-playfair font-bold text-navy leading-tight">
                        Discover Extraordinary <span className="text-gradient-gold">Venues</span>
                    </h1>
                    <p className="text-body text-base sm:text-lg mt-3 leading-relaxed">
                        Explore handpicked marriage halls, executive banquet spaces, and luxury open-air lawns across Pakistan.
                    </p>
                </div>

                {/* Filter & Search Suite */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 mb-12 relative z-10">
                    
                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none border-b border-gray-100">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 ${
                                    selectedCategory === cat.id
                                        ? 'bg-terracotta text-white shadow-md'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-navy'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Filter Inputs Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                        
                        {/* Search Input */}
                        <div className="relative group">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-terracotta text-sm transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by name or keyword..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-12 pl-11 pr-9 rounded-2xl border border-gray-200 bg-gray-50/50 text-navy text-xs font-medium focus:bg-white focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 transition-all placeholder-gray-400"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                                >
                                    <FaTimes />
                                </button>
                            )}
                        </div>

                        {/* Location Dropdown */}
                        <div className="relative group">
                            <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-terracotta text-sm transition-colors z-10 pointer-events-none" />
                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                className="w-full h-12 pl-11 pr-8 rounded-2xl border border-gray-200 bg-gray-50/50 text-navy text-xs font-medium focus:bg-white focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">All Locations / Cities</option>
                                {uniqueLocations.filter(loc => loc !== 'all').map((loc) => (
                                    <option key={loc} value={loc}>
                                        {loc}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* Capacity Dropdown */}
                        <div className="relative group">
                            <FaUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-terracotta text-sm transition-colors z-10 pointer-events-none" />
                            <select
                                value={selectedCapacity}
                                onChange={(e) => setSelectedCapacity(e.target.value)}
                                className="w-full h-12 pl-11 pr-8 rounded-2xl border border-gray-200 bg-gray-50/50 text-navy text-xs font-medium focus:bg-white focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">Any Guest Capacity</option>
                                <option value="small">Intimate (Up to 300 guests)</option>
                                <option value="medium">Medium (300 - 700 guests)</option>
                                <option value="large">Grand (700 - 1,200 guests)</option>
                                <option value="grand">Mega Gala (1,200+ guests)</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* Sort By Dropdown */}
                        <div className="relative group">
                            <FaSortAmountDown className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-terracotta text-sm transition-colors z-10 pointer-events-none" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full h-12 pl-11 pr-8 rounded-2xl border border-gray-200 bg-gray-50/50 text-navy text-xs font-medium focus:bg-white focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 transition-all appearance-none cursor-pointer"
                            >
                                <option value="featured">Sort by: Featured First</option>
                                <option value="rating">Sort by: Highest Rated</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="capacity">Capacity: Largest First</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Price Range Slider & Clear Filters */}
                    <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="w-full md:w-1/2 flex items-center gap-4">
                            <span className="text-xs font-bold text-gray-600 whitespace-nowrap uppercase tracking-wider">
                                Max Price:
                            </span>
                            <input
                                type="range"
                                min="0"
                                max={maxPossiblePrice}
                                step="5000"
                                value={priceRange.max}
                                onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-terracotta"
                            />
                            <span className="text-xs font-bold text-terracotta whitespace-nowrap bg-terracotta/10 px-3 py-1 rounded-full border border-terracotta/20">
                                Rs {priceRange.max.toLocaleString()}
                            </span>
                        </div>

                        {/* Filter Status / Reset */}
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 font-medium">
                                Showing <strong className="text-navy">{sortedHalls.length}</strong> of {halls.length} venues
                            </span>

                            {hasActiveFilters && (
                                <button
                                    onClick={clearAllFilters}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs bg-gray-100 hover:bg-terracotta hover:text-white text-gray-700 font-bold rounded-xl transition-all duration-300"
                                >
                                    <FaTimes className="text-[10px]" />
                                    <span>Reset Filters</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Halls Grid Display */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
                                <div className="h-72 bg-gray-200" />
                                <div className="p-6 space-y-4">
                                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                                    <div className="h-10 bg-gray-100 rounded-xl mt-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : sortedHalls.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {sortedHalls.map((hall) => (
                            <div key={hall._id} className="hall-card-wrap">
                                <HallCard hall={hall} />
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="bg-white rounded-3xl p-16 text-center shadow-md border border-gray-100 max-w-2xl mx-auto my-12">
                        <div className="w-20 h-20 bg-terracotta/10 text-terracotta rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl">
                            <FaSearch />
                        </div>
                        <h3 className="text-2xl font-bold font-playfair text-navy mb-2">
                            No matching venues found
                        </h3>
                        <p className="text-body text-sm mb-8 leading-relaxed max-w-md mx-auto">
                            We couldn't find any halls matching your search and filter criteria. Try adjusting the price range or clearing filters.
                        </p>
                        <button
                            onClick={clearAllFilters}
                            className="btn-cta px-8 py-3.5 rounded-xl font-bold text-sm shadow-md inline-flex items-center gap-2"
                        >
                            <span>Clear All Filters</span>
                            <FaArrowRight className="text-xs" />
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Halls;
