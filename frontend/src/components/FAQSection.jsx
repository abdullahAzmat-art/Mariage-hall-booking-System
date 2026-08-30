import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronDown, FaQuestionCircle, FaHeadset, FaCommentDots } from 'react-icons/fa';

const faqs = [
    {
        question: "How do I schedule an in-person venue tour or tasting session?",
        answer: "You can schedule a complimentary private walkthrough directly through any venue's page or by contacting our 24/7 concierge team. We also arrange pre-event culinary tastings with executive chefs once you reserve your tentative date.",
        category: "Booking"
    },
    {
        question: "What is your booking advance deposit and payment schedule?",
        answer: "To lock in your date, a standard 25% deposit is required upon reservation confirmation. The remaining balance can be settled in flexible installments, with the final payment due 7 days prior to your event date. All transactions are backed by bank-grade encryption.",
        category: "Payment"
    },
    {
        question: "Can we customize the catering menu or bring our own specialized vendors?",
        answer: "Yes, absolutely! Our partner venues offer flexible catering packages that can be personalized for dietary preferences (Halal, Vegetarian, Continental, etc.). Many venues also permit verified outside decorators and caterers upon prior registration with the venue manager.",
        category: "Catering"
    },
    {
        question: "What happens if we need to reschedule or cancel our booking?",
        answer: "We understand plans can shift. If you reschedule more than 30 days before the event, your entire deposit transfers to your new date without penalty, subject to venue availability. Cancellations are handled transparently per our flexible refund policy.",
        category: "Policy"
    },
    {
        question: "How does the AI Event Assistant help during my planning?",
        answer: "Our intelligent booking assistant analyzes your guest count, preferred date, budget, and culinary preferences to instantly match you with ideal venues, suggest seating arrangements, and calculate accurate cost estimates in real-time.",
        category: "Technology"
    },
    {
        question: "Are power backup generators, sound systems, and valet staff guaranteed?",
        answer: "Yes. Every verified venue on Venuora is required to have heavy-duty synchronized generator backups (zero downtime), acoustic sound compliance, and trained uniformed valet & security personnel on-site throughout your event.",
        category: "Amenities"
    }
];

const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState(0);

    const toggleFaq = (index) => {
        setOpenIndex(openIndex === index ? -1 : index);
    };

    return (
        <section id="faq" className="py-24 bg-ivory-warm relative">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="text-terracotta uppercase tracking-[0.2em] text-xs font-bold bg-terracotta/10 px-4 py-1.5 rounded-full inline-block mb-3">
                        Help & FAQs
                    </span>
                    <h2 className="text-4xl md:text-5xl font-playfair font-bold text-navy leading-tight">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-body mt-4 text-lg max-w-2xl mx-auto">
                        Everything you need to know about discovering, booking, and hosting extraordinary events with Venuora.
                    </p>
                </div>

                {/* FAQ Accordions */}
                <div className="space-y-4">
                    {faqs.map((faq, index) => {
                        const isOpen = openIndex === index;
                        return (
                            <div
                                key={index}
                                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                                    isOpen
                                        ? 'bg-white border-terracotta/40 shadow-lg'
                                        : 'bg-white/70 border-gray-200/70 hover:border-gray-300 hover:bg-white'
                                }`}
                            >
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full py-5 px-6 sm:px-8 text-left flex items-center justify-between gap-4 focus:outline-none"
                                >
                                    <span className="font-playfair font-bold text-navy text-lg sm:text-xl pr-2">
                                        {faq.question}
                                    </span>
                                    <div
                                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                                            isOpen
                                                ? 'bg-terracotta text-white rotate-180'
                                                : 'bg-gray-100 text-gray-500'
                                        }`}
                                    >
                                        <FaChevronDown className="text-sm" />
                                    </div>
                                </button>

                                <div
                                    className={`transition-all duration-300 ease-in-out px-6 sm:px-8 overflow-hidden ${
                                        isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 pb-0 opacity-0'
                                    }`}
                                >
                                    <p className="text-body leading-relaxed text-base pt-2 border-t border-gray-100">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Still Have Questions Box */}
                <div className="mt-14 bg-white rounded-2xl p-8 border border-gray-100 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-terracotta/10 text-terracotta flex items-center justify-center text-2xl shrink-0">
                            <FaCommentDots />
                        </div>
                        <div>
                            <h4 className="font-playfair font-bold text-navy text-xl">Still have questions?</h4>
                            <p className="text-body text-sm mt-1">Our dedicated venue consultants are available 24/7 to assist you.</p>
                        </div>
                    </div>
                    <Link
                        to="/contact"
                        className="btn-primary py-3 px-6 rounded-xl font-bold whitespace-nowrap shadow-sm hover:shadow-md"
                    >
                        Talk to an Expert
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
