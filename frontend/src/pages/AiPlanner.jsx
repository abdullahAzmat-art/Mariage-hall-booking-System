import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
    FaPaperPlane,
    FaMagic,
    FaMapMarkerAlt,
    FaUsers,
    FaTag,
    FaGem,
    FaSearch,
    FaCircle,
} from 'react-icons/fa';
import hallService from '../services/hallService';

const formatTime = (date = new Date()) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const SUGGESTIONS = [
    'Find me a luxury hall in Karachi',
    'Show me halls under Rs 50000',
    'I need a venue for 500 guests',
    'What are the best outdoor venues?',
];

const AiPlanner = () => {
    const [messages, setMessages] = useState([
        {
            sender: 'bot',
            text: "Hi! I'm your AI Event Planner, Vera \u2726 \u2014 your personal venue concierge. Tell me about your dream event \u2014 budget, location, guest count \u2014 and I'll surface the perfect halls for you.",
            time: formatTime(),
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    const [allHalls, setAllHalls] = useState([]);
    const [displayedHalls, setDisplayedHalls] = useState([]);
    const [isSearchingHalls, setIsSearchingHalls] = useState(true);

    const inputRef = useRef(null);
    const messagesContainerRef = useRef(null);

    useEffect(() => {
        const fetchHalls = async () => {
            try {
                const data = await hallService.getAllHalls();
                setAllHalls(data);
                setDisplayedHalls(data.slice(0, 3));
                setIsSearchingHalls(false);
            } catch (error) {
                console.error('Failed to fetch halls', error);
                setIsSearchingHalls(false);
            }
        };
        fetchHalls();
    }, []);

    const scrollToBottom = () => {
        const container = messagesContainerRef.current;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const filterHallsLocally = (query) => {
        if (!allHalls.length) return;

        setIsSearchingHalls(true);
        const lowerQuery = query.toLowerCase();
        let filtered = [...allHalls];

        if (lowerQuery.includes('karachi')) {
            filtered = filtered.filter((h) =>
                h.location?.toLowerCase().includes('karachi')
            );
        }
        if (lowerQuery.includes('lahore')) {
            filtered = filtered.filter((h) =>
                h.location?.toLowerCase().includes('lahore')
            );
        }
        if (lowerQuery.includes('islamabad')) {
            filtered = filtered.filter((h) =>
                h.location?.toLowerCase().includes('islamabad')
            );
        }

        const priceMatch = lowerQuery.match(
            /(?:under|budget|max) (?:rs\s*)?(\d+)/
        );
        if (priceMatch && priceMatch[1]) {
            const maxPrice = parseInt(priceMatch[1], 10);
            filtered = filtered.filter((h) => h.price <= maxPrice);
        }

        const capMatch = lowerQuery.match(
            /(?:for\s*)?(\d+)\s*(?:guests|people|pax)?/
        );
        if (capMatch && capMatch[1] && parseInt(capMatch[1], 10) > 100) {
            const reqCap = parseInt(capMatch[1], 10);
            filtered = filtered.filter((h) => h.capacity >= reqCap - 100);
        }

        setTimeout(() => {
            setDisplayedHalls(filtered.slice(0, 3));
            setIsSearchingHalls(false);
        }, 800);
    };

    const sendMessage = async (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        const userMessage = { sender: 'user', text: trimmed, time: formatTime() };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        setIsTyping(true);

        filterHallsLocally(trimmed);

        try {
            const res = await axios.post(
                'https://mariage-hall-booking-system.vercel.app/api/chat',
                { message: trimmed }
            );

            setTimeout(() => {
                setIsTyping(false);
                setMessages((prev) => [
                    ...prev,
                    {
                        sender: 'bot',
                        text: res.data.reply ||
                            "I've updated the suggested venues based on your preferences!",
                        time: formatTime(),
                    },
                ]);
                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error('Chat Error:', error);
            setIsTyping(false);
            setMessages((prev) => [
                ...prev,
                {
                    sender: 'bot',
                    text: "I've filtered the venues, but couldn't reach the language model. Here are my best heuristic picks.",
                    time: formatTime(),
                },
            ]);
            setLoading(false);
        }
    };

    const handleSend = (e) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] bg-ivory-warm font-body relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-10 right-10 w-[35%] h-[35%] rounded-full bg-gold/5 blur-[100px]"></div>
                <div className="absolute bottom-10 left-10 w-[30%] h-[30%] rounded-full bg-plum/5 blur-[100px]"></div>
            </div>

            <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-8">
                {/* LEFT COLUMN: Chat Interface */}
                <div className="w-full lg:w-1/2 rounded-[2rem] flex flex-col h-full overflow-hidden">
                    {/* Messages List */}
                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
                        {messages.map((msg, index) => {
                            const isUser = msg.sender === 'user';
                            const showAvatar =
                                !isUser &&
                                (index === 0 ||
                                    messages[index - 1].sender === 'user');
                            return (
                                <div
                                    key={index}
                                    className={`flex items-end gap-3 ${
                                        isUser ? 'justify-end' : 'justify-start'
                                    } animate-msg-in`}
                                >
                                    {!isUser && showAvatar && (
                                        <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-lg shrink-0 shadow-md">
                                            <FaGem className="text-navy/80" />
                                        </div>
                                    )}
                                    {!isUser && !showAvatar && (
                                        <div className="w-10 shrink-0"></div>
                                    )}

                                    <div
                                        className={`flex flex-col ${
                                            isUser ? 'items-end' : 'items-start'
                                        } max-w-[85%]`}
                                    >
                                        <div
                                            className={`px-5 py-3.5 text-[15px] leading-relaxed ${
                                                isUser
                                                    ? 'bg-navy text-white rounded-2xl rounded-br-sm'
                                                    : 'bg-gray-50 text-navy border border-gray-100 rounded-2xl rounded-bl-sm'
                                            }`}
                                        >
                                            {msg.text}
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-1.5 px-1 font-medium">
                                            {msg.time}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}

                        {isTyping && (
                            <div className="flex items-end gap-3 justify-start animate-msg-in">
                                <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-lg shrink-0 shadow-md">
                                    <FaGem className="text-navy/80" />
                                </div>
                                <div className="bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                                    <span
                                        className="w-2 h-2 bg-gray-400 rounded-full animate-typing"
                                        style={{ animationDelay: '0ms' }}
                                    ></span>
                                    <span
                                        className="w-2 h-2 bg-gray-400 rounded-full animate-typing"
                                        style={{ animationDelay: '150ms' }}
                                    ></span>
                                    <span
                                        className="w-2 h-2 bg-gray-400 rounded-full animate-typing"
                                        style={{ animationDelay: '300ms' }}
                                    ></span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Suggestions */}
                    {messages.length <= 1 && (
                        <div className="px-6 pb-6 flex flex-wrap gap-2">
                            {SUGGESTIONS.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(s)}
                                    className="text-xs font-semibold px-4 py-2.5 rounded-full bg-gray-50 border border-gray-200 text-navy hover:border-gold hover:text-gold hover:bg-white transition-all shadow-sm"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Container */}
                    <form
                        onSubmit={handleSend}
                        className="p-5  border-t border-gray-100 flex gap-3 items-end"
                    >
                        <div className="flex-1">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Describe your dream venue..."
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-[15px] text-navy transition-all placeholder-gray-400 resize-none h-[54px]"
                                rows={1}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="w-[56px] h-[59px] shrink-0 rounded-2xl bg-gold text-navy flex items-center justify-center transition-all hover:bg-gold-dark enabled:hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                        >
                            <FaPaperPlane className="text-lg translate-y-[1px] -translate-x-[1px]" />
                        </button>
                    </form>
                </div>

                {/* RIGHT COLUMN: Results */}
                <div className="hidden lg:flex lg:w-1/2 flex-col h-full">
                    <div className=" rounded-[2rem] flex flex-col h-full overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-playfair font-bold text-navy">
                                    Live Suggestions
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Picks are updating based on your chat.
                                </p>
                            </div>
                            <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                                {displayedHalls.length} Matches
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {isSearchingHalls ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                                    <FaMagic className="text-4xl animate-pulse text-gold/50" />
                                    <p className="text-lg font-medium">
                                        Searching the finest venues...
                                    </p>
                                </div>
                            ) : displayedHalls.length > 0 ? (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    {displayedHalls.map((hall) => {
                                        const imageUrl = hall.image?.startsWith(
                                            'http'
                                        )
                                            ? hall.image
                                            : `https://mariage-hall-booking-system.vercel.app/${hall.image}`;

                                        return (
                                            <div
                                                key={hall._id}
                                                className="bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100 hover:shadow-xl transition-all group"
                                            >
                                                <div className="h-48 relative overflow-hidden bg-gray-100">
                                                    <img
                                                        src={imageUrl}
                                                        alt={hall.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                                                        <span className="font-bold text-gold">
                                                            Rs{' '}
                                                            {hall.price?.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-5">
                                                    <h3 className="text-xl font-playfair font-bold text-navy mb-3 group-hover:text-gold transition-colors">
                                                        {hall.name}
                                                    </h3>
                                                    <div className="space-y-2 mb-5">
                                                        <div className="flex items-center text-sm text-gray-600 gap-2">
                                                            <FaMapMarkerAlt className="text-gold opacity-70" />{' '}
                                                            {hall.location}
                                                        </div>
                                                        <div className="flex items-center text-sm text-gray-600 gap-2">
                                                            <FaUsers className="text-gold opacity-70" />{' '}
                                                            {hall.capacity}{' '}
                                                            guests capacity
                                                        </div>
                                                    </div>
                                                    <Link
                                                        to={`/halls/${hall._id}`}
                                                        className="block w-full text-center py-2.5 rounded-xl border-2 border-navy text-navy font-bold hover:bg-navy hover:text-white transition-colors"
                                                    >
                                                        View Details
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                                    <FaTag className="text-4xl text-gray-300" />
                                    <p className="text-lg font-medium text-center">
                                        No venues match your criteria.
                                        <br />
                                        Try broadening your search.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiPlanner;
