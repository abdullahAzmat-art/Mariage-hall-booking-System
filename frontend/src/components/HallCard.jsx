import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUserFriends, FaMapMarkerAlt, FaArrowRight, FaStar, FaHeart, FaCheckCircle, FaCar, FaUtensils } from 'react-icons/fa';

const HallCard = ({ hall }) => {
    const [isFavorite, setIsFavorite] = useState(false);

    const imageUrl = (() => {
        if (!hall.image && (!hall.images || hall.images.length === 0)) {
            return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80';
        }
        const imagePath = hall.image || hall.images[0];
        if (typeof imagePath === 'string' && imagePath.startsWith('http')) return imagePath;
        return `https://mariage-hall-booking-system.vercel.app/${(imagePath || '').replace(/\\/g, '/')}`;
    })();

    const formattedPrice = typeof hall.price === 'number' 
        ? hall.price.toLocaleString() 
        : (hall.price || 'Contact for Price');

    return (
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group h-full flex flex-col border border-gray-100/80 relative">
            
            {/* Image Container */}
            <div className="relative h-72 overflow-hidden bg-gray-100">
                <img
                    src={imageUrl}
                    alt={hall.name}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80';
                    }}
                />
                
                {/* Gradient Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/70 via-transparent to-black/20" />

                {/* Top Badges */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                        <span className="bg-navy/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                            <FaCheckCircle className="text-terracotta-light text-[10px]" />
                            <span>Verified</span>
                        </span>
                        {hall.featured && (
                            <span className="bg-gradient-to-r from-terracotta to-cta text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                                Featured
                            </span>
                        )}
                    </div>

                    {/* Bookmark Favorite Button */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setIsFavorite(!isFavorite);
                        }}
                        className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all text-sm"
                        aria-label="Save venue to favorites"
                    >
                        <FaHeart className={`transition-colors ${isFavorite ? 'text-terracotta fill-terracotta' : 'text-gray-400'}`} />
                    </button>
                </div>

                {/* Floating Price Tag at Bottom of Image */}
                <div className="absolute bottom-4 left-4 z-10">
                    <span className="text-[11px] text-gray-200 uppercase tracking-wider block font-semibold">
                        Starting from
                    </span>
                    <span className="text-xl font-extrabold font-playfair text-white drop-shadow-md">
                        Rs {formattedPrice}
                    </span>
                </div>
            </div>

            {/* Content Container */}
            <div className="p-6 flex-grow flex flex-col justify-between">
                <div>
                    {/* Header: Title & Rating */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-xl font-bold font-playfair text-navy group-hover:text-terracotta transition-colors line-clamp-1">
                            {hall.name}
                        </h3>
                        <div className="flex items-center gap-1 bg-terracotta/10 px-2.5 py-1 rounded-lg shrink-0">
                            <FaStar className="text-terracotta text-xs" />
                            <span className="text-xs font-bold text-terracotta">
                                {hall.rating || '4.9'}
                            </span>
                            {hall.reviews && (
                                <span className="text-[10px] text-gray-400 font-normal">
                                    ({hall.reviews})
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center text-body text-xs font-medium mb-3">
                        <FaMapMarkerAlt className="mr-2 text-terracotta shrink-0 text-sm" />
                        <span className="truncate">{hall.location || 'Prime Location'}</span>
                    </div>

                    {/* Capacity */}
                    <div className="flex items-center text-body text-xs font-medium mb-4">
                        <FaUserFriends className="mr-2 text-terracotta shrink-0 text-sm" />
                        <span>Up to {hall.capacity || '500+'} Guests</span>
                    </div>

                    {/* Feature Chips */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 text-[11px] font-medium border border-gray-100">
                            <FaCar className="text-[10px] text-terracotta" /> Valet Parking
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 text-[11px] font-medium border border-gray-100">
                            <FaUtensils className="text-[10px] text-terracotta" /> Catering Ready
                        </span>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">
                        Instant Booking
                    </span>
                    <Link
                        to={`/halls/${hall._id}`}
                        className="inline-flex items-center gap-2 text-terracotta font-bold text-xs uppercase tracking-wider hover:text-cta transition-colors group/link"
                    >
                        <span>View Details</span>
                        <FaArrowRight className="text-[10px] transform group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default HallCard;
