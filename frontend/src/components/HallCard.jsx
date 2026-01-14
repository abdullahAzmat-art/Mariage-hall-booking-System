import React from 'react';
import { Link } from 'react-router-dom';
import { FaUserFriends, FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa';

const HallCard = ({ hall }) => {
    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group h-full flex flex-col border border-gray-100">
            <div className="relative h-64 overflow-hidden">
                <img
                    src={(() => {
                        if (!hall.image && (!hall.images || hall.images.length === 0)) {
                            return 'https://via.placeholder.com/800x600';
                        }
                        const imagePath = hall.image || hall.images[0];
                        if (imagePath.startsWith('http')) return imagePath;
                        return `https://mariage-hall-booking-system.vercel.app/${imagePath.replace(/\\/g, '/')}`;
                    })()}
                    alt={hall.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/800x600';
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold text-gold-dark shadow-sm border border-gold/20">
                    Rs {hall.price}
                </div>
                {hall.featured && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-gold to-gold-dark text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg tracking-wide uppercase">
                        Featured
                    </div>
                )}
            </div>

            <div className="p-6 flex-grow flex flex-col relative">
                <h3 className="text-2xl font-playfair font-bold text-gray-900 mb-3 group-hover:text-gold transition-colors">
                    {hall.name}
                </h3>

                <div className="flex items-center text-gray-500 mb-2 text-sm font-medium">
                    <FaMapMarkerAlt className="mr-2 text-gold flex-shrink-0" />
                    <span className="truncate">{hall.location}</span>
                </div>

                <div className="flex items-center text-gray-500 mb-6 text-sm font-medium">
                    <FaUserFriends className="mr-2 text-gold flex-shrink-0" />
                    <span>{hall.capacity}</span>
                </div>

                <div className="mt-auto pt-5 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                        <span className="text-gold text-lg">★</span>
                        {hall.rating}
                        <span className="text-gray-400 font-normal ml-1">({hall.reviews} reviews)</span>
                    </div>
                    <Link
                        to={`/halls/${hall._id}`}
                        className="flex items-center text-gold font-bold text-sm hover:text-gold-dark transition-colors group/link"
                    >
                        View Details <FaArrowRight className="ml-2 transform group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default HallCard;
