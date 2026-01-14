import React, { useEffect, useState } from 'react';
import { FaCheck, FaCrown, FaGem, FaLeaf } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import packageService from '../services/packageService';

const Packages = () => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const data = await packageService.getAllPackages();
                // Map API data to UI structure if needed, or ensure backend sends correct structure
                // For now assuming backend sends compatible structure, but adding icon mapping
                const mappedPackages = data.map(pkg => ({
                    ...pkg,
                    icon: getIcon(pkg.type || 'basic')
                }));
                setPackages(mappedPackages);
            } catch (error) {
                console.error("Failed to fetch packages", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPackages();
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'basic': return <FaLeaf className="text-4xl text-green-500 mb-4" />;
            case 'standard': return <FaGem className="text-4xl text-blue-500 mb-4" />;
            case 'premium': return <FaCrown className="text-4xl text-yellow-500 mb-4" />;
            default: return <FaLeaf className="text-4xl text-green-500 mb-4" />;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-text mb-4">Our Wedding Packages</h1>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        Choose the perfect package for your special day. We offer a range of options to suit every budget and requirement.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {packages.map((pkg) => (
                        <div key={pkg.id} className={`bg-white rounded-2xl shadow-card overflow-hidden relative transform transition-all duration-300 hover:-translate-y-2 ${pkg.recommended ? 'border-2 border-primary ring-4 ring-primary/10' : 'border border-gray-100'}`}>
                            {pkg.recommended && (
                                <div className="bg-primary text-white text-center py-2 font-bold text-sm uppercase tracking-wider">
                                    Most Popular
                                </div>
                            )}

                            <div className="p-8 text-center">
                                <div className="flex justify-center">{pkg.icon}</div>
                                <h3 className="text-2xl font-bold text-text mb-2">{pkg.name}</h3>
                                <div className="text-4xl font-bold text-primary mb-6">{pkg.price}</div>

                                <ul className="text-left space-y-4 mb-8">
                                    {pkg.features.map((feature, index) => (
                                        <li key={index} className="flex items-start text-gray-600">
                                            <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link to="/halls" className={`block w-full py-3 rounded-xl font-bold transition-colors ${pkg.recommended ? 'btn-primary' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                    Choose Plan
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Packages;
