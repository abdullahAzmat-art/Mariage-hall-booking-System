import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { gsap } from 'gsap';
import HallCard from '../components/HallCard';
import { 
    FaSearch, 
    FaMapMarkerAlt, 
    FaUsers, 
    FaSlidersH,
    FaTimes,
    FaArrowRight,
    FaCheck,
    FaChevronDown
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
    const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
    const [halls, setHalls] = useState([]);
    const [loading, setLoading] = useState(true);

    const priceDropdownRef = useRef(null);

    // Sync state with URL params
    useEffect(() => {
        const query = searchParams.get('search') || searchParams.get('location') || '';
        const cat = searchParams.get('category') || '';
        if (query) setSearchTerm(query);
        if (cat) setSelectedCategory(cat);
    }, [searchParams]);

    // Close price dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (priceDropdownRef.current && !priceDropdownRef.current.contains(event.target)) {
                setIsPriceDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });

    // GSAP Animate Cards
    useEffect(() => {
        if (!loading) {
            const ctx = gsap.context(() => {
                gsap.from(".hall-card-wrap", {
                    y: 25,
                    opacity: 0,
                    duration: 0.45,
                    stagger: 0.07,
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
                <div className="text-center max-w-3xl mx-auto mb-10">
                    <span className="text-terracotta uppercase tracking-[0.2em] text-xs font-bold bg-terracotta/10 px-4 py-1.5 rounded-full inline-block mb-3">
                        Curated Directory
                    </span>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-playfair font-bold text-navy leading-tight">
                        Discover Extraordinary <span className="text-gradient-gold">Venues</span>
                    </h1>
                    <p className="text-body text-base sm:text-lg mt-3 leading-relaxed">
                        Handpicked marriage halls, executive banquet spaces, and luxury open-air lawns.
                    </p>
                </div>

                {/* LUXURY SEARCH CAPSULE (Airbnb Style) */}
                <div className="max-w-4xl mx-auto mb-10">
                    <div className="bg-white rounded-2xl md:rounded-full p-2.5 sm:p-3 shadow-xl border border-gray-200/80 flex flex-col md:flex-row items-center gap-2 md:gap-0 md:divide-x divide-gray-100 transition-all focus-within:ring-2 focus-within:ring-terracotta/20 focus-within:border-terracotta/40">
                        
                        {/* Search Name / Keyword */}
                        <div className="flex-1 w-full px-4 py-2 flex items-center gap-3">
                            <FaSearch className="text-terracotta text-sm shrink-0" />
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    Search
                                </label>
                                <input
                                    type="text"
                                    placeholder="Hall name or keyword..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-transparent text-navy font-semibold text-sm outline-none placeholder-gray-400"
                                />
                            </div>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="text-gray-400 hover:text-navy p-1 text-xs"
                                    aria-label="Clear search"
                                >
                                    <FaTimes />
                                </button>
                            )}
                        </div>

                        {/* Location Dropdown */}
                        <div className="flex-1 w-full px-4 py-2 flex items-center gap-3">
                            <FaMapMarkerAlt className="text-terracotta text-sm shrink-0" />
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    Location
                                </label>
                                <select
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                    className="w-full bg-transparent text-navy font-semibold text-sm outline-none cursor-pointer appearance-none"
                                >
                                    <option value="all">All Cities / Areas</option>
                                    {uniqueLocations.filter(loc => loc !== 'all').map((loc) => (
                                        <option key={loc} value={loc}>
                                            {loc}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Guest Capacity */}
                        <div className="flex-1 w-full px-4 py-2 flex items-center gap-3">
                            <FaUsers className="text-terracotta text-sm shrink-0" />
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    Capacity
                                </label>
                                <select
                                    value={selectedCapacity}
                                    onChange={(e) => setSelectedCapacity(e.target.value)}
                                    className="w-full bg-transparent text-navy font-semibold text-sm outline-none cursor-pointer appearance-none"
                                >
                                    <option value="all">Any Capacity</option>
                                    <option value="small">Intimate (≤ 300)</option>
                                    <option value="medium">Medium (300 - 700)</option>
                                    <option value="large">Grand (700 - 1200)</option>
                                    <option value="grand">Mega (1200+)</option>
                                </select>
                            </div>
                        </div>

                        {/* Action CTA Button */}
                        <div className="w-full md:w-auto p-1">
                            <button
                                onClick={() => {}}
                                className="w-full md:w-auto h-12 px-6 rounded-xl md:rounded-full btn-cta font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                            >
                                <FaSearch className="text-xs" />
                                <span>Explore</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* FILTER RIBBON & CONTROLS */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-gray-200/60">
                    
                    {/* Occasion Category Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-none">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide whitespace-nowrap transition-all duration-300 ${
                                    selectedCategory === cat.id
                                        ? 'bg-navy text-white shadow-sm'
                                        : 'bg-white border border-gray-200 text-gray-600 hover:border-navy hover:text-navy'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Right Tools: Price Slider Popover & Sort Dropdown */}
                    <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
                        
                        {/* Price Dropdown Button */}
                        <div className="relative" ref={priceDropdownRef}>
                            <button
                                onClick={() => setIsPriceDropdownOpen(!isPriceDropdownOpen)}
                                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${
                                    priceRange.max !== maxPossiblePrice
                                        ? 'bg-terracotta/10 border-terracotta text-terracotta'
                                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <FaSlidersH className="text-[11px]" />
                                <span>
                                    {priceRange.max !== maxPossiblePrice
                                        ? `Max: Rs ${(priceRange.max / 1000).toFixed(0)}k`
                                        : 'Budget'}
                                </span>
                                <FaChevronDown className={`text-[9px] transition-transform ${isPriceDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Card */}
                            {isPriceDropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl p-5 shadow-2xl border border-gray-100 z-50 animate-fadeIn">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold uppercase tracking-wider text-navy">
                                            Max Venue Price
                                        </span>
                                        <span className="text-xs font-bold text-terracotta bg-terracotta/10 px-2 py-0.5 rounded-full">
                                            Rs {priceRange.max.toLocaleString()}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max={maxPossiblePrice}
                                        step="5000"
                                        value={priceRange.max}
                                        onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-terracotta mb-4"
                                    />
                                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                                        <span>Rs 0</span>
                                        <span>Rs {maxPossiblePrice.toLocaleString()}</span>
                                    </div>
                                    <button
                                        onClick={() => setIsPriceDropdownOpen(false)}
                                        className="w-full mt-4 py-2 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy-dark transition-colors"
                                    >
                                        Apply Budget
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-2 rounded-full text-xs font-bold bg-white border border-gray-200 text-gray-700 hover:border-gray-300 outline-none cursor-pointer appearance-none pr-7 transition-all"
                            >
                                <option value="featured">Sort: Featured</option>
                                <option value="rating">Sort: Highest Rated</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="capacity">Capacity: Largest First</option>
                            </select>
                            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 pointer-events-none" />
                        </div>

                        {/* Reset Filters */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className="text-xs text-terracotta font-bold hover:underline whitespace-nowrap pl-1"
                            >
                                Clear all
                            </button>
                        )}
                    </div>
                </div>

                {/* Venue Count Indicator */}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-sm font-semibold text-gray-500">
                        Showing <span className="text-navy font-bold">{sortedHalls.length}</span> verified {sortedHalls.length === 1 ? 'venue' : 'venues'}
                    </p>
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
                            We couldn't find any halls matching your search and filter criteria. Try adjusting the budget or clearing filters.
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
