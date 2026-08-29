import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaUsers, FaArrowRight, FaHeart } from 'react-icons/fa';

const VenueCard = ({ hall }) => {
    const [isFavorite, setIsFavorite] = useState(false);

    return (
        <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col h-full">
            <div className="relative h-72 overflow-hidden">
                <img
                    src={(() => {
                        if (!hall.image && (!hall.images || hall.images.length === 0)) {
                            return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1498&q=80';
                        }
                        const imagePath = hall.image || hall.images[0];
                        if (imagePath.startsWith('http')) return imagePath;
                        return `https://mariage-hall-booking-system.vercel.app/${imagePath.replace(/\\/g, '/')}`;
                    })()}
                    alt={hall.name}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1498&q=80';
                    }}
                />
                <button
                    onClick={(e) => { e.preventDefault(); setIsFavorite(!isFavorite); }}
                    className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-all duration-300"
                    aria-label="Add to favorites"
                >
                    <FaHeart className={`text-lg transition-colors ${isFavorite ? 'text-terracotta fill-terracotta' : 'text-gray-400'}`} />
                </button>
                <div className="absolute top-4 left-4 z-20 bg-navy/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
                    Rs {typeof hall.price === 'number' ? hall.price.toLocaleString() : hall.price}
                </div>
            </div>

            <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-2xl font-bold text-navy font-playfair group-hover:text-terracotta transition-colors duration-300 line-clamp-1">
                        {hall.name}
                    </h3>
                    <div className="flex items-center gap-1 bg-terracotta/10 px-2.5 py-1 rounded-lg flex-shrink-0 ml-2">
                        <FaStar className="text-terracotta text-sm" />
                        <span className="text-sm font-bold text-terracotta">{hall.rating || '4.8'}</span>
                    </div>
                </div>

                <div className="flex items-center text-body text-sm mb-2 font-medium">
                    <FaMapMarkerAlt className="mr-2 text-terracotta" />
                    <span className="truncate">{hall.location}</span>
                </div>

                <div className="flex items-center text-body text-sm mb-6 font-medium">
                    <FaUsers className="mr-2 text-terracotta" />
                    <span>{hall.capacity || '500+'} Guests</span>
                </div>

                <div className="mt-auto pt-5 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-body">
                        Starting at                     <span className="font-bold text-navy">Rs {typeof hall.price === 'number' ? hall.price.toLocaleString() : hall.price}</span>
                    </span>
                    <Link
                        to={`/halls/${hall._id}`}
                        className="flex items-center gap-2 text-terracotta font-bold text-sm uppercase tracking-wide hover:text-cta transition-colors group/link"
                    >
                        View Details <FaArrowRight className="transform group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default VenueCard;
