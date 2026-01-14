import React, { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { gsap } from 'gsap';
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaClock } from 'react-icons/fa';

const Contact = () => {
    const formRef = useRef(null);
    const infoRef = useRef(null);
    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const complaintService = (await import('../services/complaintService')).default;
            await complaintService.createComplaint(formData);
            toast.success('Complaint submitted successfully!');
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            toast.error('Failed to submit complaint');
        }
    };

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(infoRef.current, {
                x: -50,
                opacity: 0,
                duration: 0.8,
                ease: "power3.out",
                delay: 0.2
            });
            gsap.from(formRef.current, {
                x: 50,
                opacity: 0,
                duration: 0.8,
                ease: "power3.out",
                delay: 0.4
            });
        });
        return () => ctx.revert();
    }, []);

    return (
        <div className="overflow-hidden pt-20 min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="relative h-[40vh] flex items-center justify-center overflow-hidden bg-primary">
                <div className="absolute inset-0 z-0 opacity-30">
                    <img
                        src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1498&q=80"
                        alt="Contact Background"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="relative z-10 text-center text-white px-4">
                    <h1 className="text-4xl md:text-6xl font-playfair font-bold mb-4">Get in Touch</h1>
                    <p className="text-lg md:text-xl font-light text-gold-light">We'd love to hear from you.</p>
                </div>
            </section>

            <div className="container mx-auto px-4 py-16">
                <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto">
                    {/* Contact Info */}
                    <div ref={infoRef} className="lg:w-1/3 space-y-8">
                        <div className="bg-white p-8 rounded-2xl shadow-card border border-gray-100">
                            <h2 className="text-2xl font-playfair font-bold text-primary mb-6">Contact Information</h2>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold shrink-0">
                                        <FaMapMarkerAlt />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Our Location</h3>
                                        <p className="text-gray-600">123 Luxury Lane, Golden City, GC 54321</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold shrink-0">
                                        <FaPhoneAlt />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Phone Number</h3>
                                        <p className="text-gray-600">+1 (555) 123-4567</p>
                                        <p className="text-gray-600">+1 (555) 987-6543</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold shrink-0">
                                        <FaEnvelope />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Email Address</h3>
                                        <p className="text-gray-600">info@luxehalls.com</p>
                                        <p className="text-gray-600">bookings@luxehalls.com</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold shrink-0">
                                        <FaClock />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Office Hours</h3>
                                        <p className="text-gray-600">Mon - Sat: 9:00 AM - 8:00 PM</p>
                                        <p className="text-gray-600">Sun: 10:00 AM - 6:00 PM</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div ref={formRef} className="lg:w-2/3">
                        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-card border border-gray-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-bl-full -mr-10 -mt-10"></div>

                            <h2 className="text-3xl font-playfair font-bold text-primary mb-2">Send us a Message</h2>
                            <p className="text-gray-500 mb-8">Fill out the form below and we'll get back to you shortly.</p>

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                                        <input
                                            type="email"
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Subject</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                                        placeholder="Subject"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Message</label>
                                    <textarea
                                        rows="4"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all resize-none"
                                        placeholder="How can we help you?"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        required
                                    ></textarea>
                                </div>

                                <button type="submit" className="w-full btn-gold py-4 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                                    Send Message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
