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
import api from '../api/axios';

const formatTime = (date = new Date()) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const SUGGESTIONS = [
    'Find me a luxury hall in Karachi',
    'Show me halls under Rs 50000',
    'I need a venue for 500 guests',
    'What are the best outdoor venues?',
];

// InlineBookingForm now receives the threadId so it can RESUME the graph with the submitted data
const InlineBookingForm = ({ bookingForm, threadId, onBookingConfirmed }) => {
    const [guestsCount, setGuestsCount] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventType, setEventType] = useState('Wedding');
    const [phone, setPhone] = useState('');
    const [cnic, setCnic] = useState('');
    const [selectedFood, setSelectedFood] = useState({});
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const hallPrice = Number(bookingForm.hallPrice) || 0;
    const hallMenu = bookingForm.hallMenu || [];
    
    const customSeatPrice = hallMenu.reduce((total, item) => {
        return selectedFood[item.name] ? total + Number(item.price) : total;
    }, 0);
    
    const finalPricePerHead = hallPrice + customSeatPrice;
    const totalAmount = (Number(guestsCount) || 0) * finalPricePerHead;
    const prebookingAmount = totalAmount * 0.2;
    
    const handleFoodToggle = (itemName) => {
        setSelectedFood(prev => ({ ...prev, [itemName]: !prev[itemName] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Build the form data payload
            const customFoodPayload = hallMenu
                .filter(item => selectedFood[item.name])
                .map(item => ({ itemName: item.name, price: item.price, quantity: Number(guestsCount) }));

            const formData = {
                customerId:    JSON.parse(localStorage.getItem('user'))?._id || '',
                eventDate,
                eventType,
                phone,
                cnic,
                guestsCount:   Number(guestsCount),
                customSeatPrice,
                customFood:    customFoodPayload,
            };

            // ✅ Instead of calling bookingService directly, we RESUME the LangGraph
            // with the form data as a JSON string. The graph will then:
            //   bookingRequirementsNode (receives data) → createBookingNode (saves to DB)
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_BASE}/chat/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Send the form data as the "message" so the graph resumes with it
                body: JSON.stringify({ message: JSON.stringify(formData), threadId }),
            });

            if (!response.ok) throw new Error('Failed to resume graph');

            // Read the streamed response to get the confirmation message
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let confirmationText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();
                let event = null;
                for (const line of lines) {
                    if (line.startsWith('event: ')) event = line.slice(7).trim();
                    else if (line.startsWith('data: ')) {
                        try {
                            const payload = JSON.parse(line.slice(6).trim());
                            if (event === 'token') confirmationText += payload.text;
                        } catch (_) {}
                        event = null;
                    }
                }
            }

            // Notify parent with the AI confirmation message
            if (onBookingConfirmed) onBookingConfirmed(confirmationText || 'Booking confirmed!');

        } catch (error) {
            console.error("Booking error:", error);
            alert("Failed to submit booking. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="mt-4 p-5 bg-green-50 rounded-2xl border border-green-100 shadow-sm w-full min-w-[280px] text-center">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">✓</div>
                <h4 className="font-bold text-green-800 mb-1">Booking Confirmed!</h4>
                <p className="text-sm text-green-700">Your reservation for {bookingForm.hallName} has been submitted.</p>
            </div>
        );
    }

    return (
        <div className="mt-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-md w-full min-w-[280px] font-body">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <h4 className="font-bold text-navy text-lg">{bookingForm.hallName}</h4>
                <span className="text-gold font-bold text-sm bg-gold/10 px-2 py-1 rounded-lg">Rs {hallPrice.toLocaleString()} / base</span>
            </div>
            
            <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Basic Details */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-navy mb-1.5 uppercase tracking-wide">Event Date</label>
                        <input type="date" required value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-navy mb-1.5 uppercase tracking-wide">Guests</label>
                        <input type="number" required min="1" placeholder="e.g. 200" value={guestsCount} onChange={(e) => setGuestsCount(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all" />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-navy mb-1.5 uppercase tracking-wide">Event Type</label>
                        <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all">
                            <option value="Wedding">Wedding</option>
                            <option value="Engagement">Engagement</option>
                            <option value="Birthday">Birthday</option>
                            <option value="Corporate">Corporate</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-navy mb-1.5 uppercase tracking-wide">Phone No.</label>
                        <input type="tel" required placeholder="03XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-navy mb-1.5 uppercase tracking-wide">CNIC</label>
                        <input type="text" required placeholder="12345-1234567-1" value={cnic} onChange={(e) => setCnic(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all" />
                    </div>
                </div>

                {/* Custom Food Options */}
                <div className="border border-gray-100 rounded-xl p-3 bg-gray-50 mt-2">
                    <h5 className="text-sm font-bold text-navy mb-2 flex items-center gap-2"><FaTag className="text-gold" /> Customize Food Menu</h5>
                    {hallMenu.length > 0 ? (
                        <div className="space-y-2 max-h-32 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                            {hallMenu.map((item, idx) => (
                                <label key={idx} className="flex items-center justify-between bg-white p-2 border border-gray-100 rounded-lg cursor-pointer hover:border-gold/50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="checkbox" 
                                            checked={!!selectedFood[item.name]}
                                            onChange={() => handleFoodToggle(item.name)}
                                            className="w-4 h-4 text-gold rounded border-gray-300 focus:ring-gold"
                                        />
                                        <span className="text-sm font-medium text-gray-700">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-navy">+Rs {item.price}</span>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 italic">No custom menu items available for this hall.</p>
                    )}
                    <div className="mt-2 pt-2 border-t border-gray-200/60 flex justify-between text-xs">
                        <span className="font-medium text-gray-500">Extra Food Cost:</span>
                        <span className="font-bold text-gold">+ Rs {customSeatPrice} / head</span>
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-navy/5 p-4 rounded-xl border border-navy/10 space-y-2 mt-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-navy font-medium">Final Price / Guest:</span>
                        <span className="font-bold text-navy">Rs {finalPricePerHead.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-navy/10">
                        <span className="text-navy font-bold">Total Amount:</span>
                        <span className="font-bold text-navy text-lg">Rs {totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1">
                        <span className="text-gray-500 font-medium">Pre-booking to pay (20%):</span>
                        <span className="font-bold text-gold">Rs {prebookingAmount.toLocaleString()}</span>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting || totalAmount <= 0}
                    className="w-full py-3 bg-navy text-white rounded-xl font-bold text-sm hover:bg-navy/90 transition-all shadow-md enabled:hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4"
                >
                    {isSubmitting ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Processing...
                        </>
                    ) : (
                        'Confirm Booking'
                    )}
                </button>
            </form>
        </div>
    );
};

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
    const [hasSearched, setHasSearched] = useState(false);
    const [displayedHalls, setDisplayedHalls] = useState([]);
    const [isSearchingHalls, setIsSearchingHalls] = useState(false);
    const [threadId, setThreadId] = useState(null);           // persists conversation thread
    const [awaitingReply, setAwaitingReply] = useState(false); // true when booking prompt fired

    const inputRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // No need to pre-fetch all halls since AI backend does the search
    useEffect(() => {
        // Initial setup complete
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
        // Obsolete: Now we rely entirely on the backend AI Ranker!
    };

    const sendMessage = async (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        const userMessage = { sender: 'user', text: trimmed, time: formatTime() };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        setIsTyping(true);

        // Only show "searching" indicator if not in a booking yes/no reply
        if (!awaitingReply) {
            setIsSearchingHalls(true);
            setHasSearched(true);
        }

        // Add an empty streaming bot message we'll fill live
        setMessages((prev) => [...prev, { sender: 'bot', text: '', time: formatTime(), streaming: true }]);

        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

            const response = await fetch(`${API_BASE}/chat/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Always pass threadId so backend can resume interrupted state
                body: JSON.stringify({ message: trimmed, threadId }),
            });

            if (!response.ok) throw new Error('Stream request failed');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            const updateLastBotMsg = (updater) => {
                setMessages((prev) => {
                    const next = [...prev];
                    const lastBotIdx = next.map(m => m.sender).lastIndexOf('bot');
                    if (lastBotIdx !== -1) next[lastBotIdx] = updater(next[lastBotIdx]);
                    return next;
                });
            };

            setIsTyping(false);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                let event = null;
                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        event = line.slice(7).trim();
                    } else if (line.startsWith('data: ')) {
                        const raw = line.slice(6).trim();
                        try {
                            const payload = JSON.parse(raw);

                            if (event === 'thread') {
                                // Store the thread ID for follow-up messages
                                setThreadId(payload.threadId);

                            } else if (event === 'token') {
                                updateLastBotMsg((msg) => ({
                                    ...msg,
                                    text: msg.text + payload.text,
                                }));

                            } else if (event === 'halls') {
                                setDisplayedHalls(payload.cards || []);
                                setIsSearchingHalls(false);
                                updateLastBotMsg((msg) => ({
                                    ...msg,
                                    text: payload.message || 'Here are your suggested venues!',
                                    streaming: false,
                                }));

                            } else if (event === 'booking_form') {
                                updateLastBotMsg((msg) => ({
                                    ...msg,
                                    bookingForm: payload,
                                }));

                            } else if (event === 'done') {
                                setIsSearchingHalls(false);
                                // awaitingReply = true means booking_prompt just interrupted
                                setAwaitingReply(payload.awaitingReply === true);
                                updateLastBotMsg((msg) => ({ ...msg, streaming: false }));

                            } else if (event === 'error') {
                                updateLastBotMsg((msg) => ({
                                    ...msg,
                                    text: payload.message || 'Something went wrong.',
                                    streaming: false,
                                }));
                                setIsSearchingHalls(false);
                                setAwaitingReply(false);
                            }
                        } catch (_) { /* ignore malformed lines */ }
                        event = null;
                    }
                }
            }

        } catch (error) {
            console.error('Stream Chat Error:', error);
            setIsTyping(false);
            setIsSearchingHalls(false);
            setAwaitingReply(false);
            setMessages((prev) => {
                const next = [...prev];
                const lastBotIdx = next.map(m => m.sender).lastIndexOf('bot');
                if (lastBotIdx !== -1) {
                    next[lastBotIdx] = {
                        ...next[lastBotIdx],
                        text: "I couldn't reach the AI planner. Please try again later.",
                        streaming: false,
                    };
                }
                return next;
            });
        } finally {
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
                                            {msg.streaming && (
                                                <span className="inline-block w-[2px] h-[1em] bg-gold ml-0.5 align-middle animate-pulse" />
                                            )}
                                            {msg.bookingForm && (
                                                <InlineBookingForm bookingForm={msg.bookingForm} />
                                            )}
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
                            {!hasSearched ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                                    <FaSearch className="text-4xl text-gray-300" />
                                    <p className="text-lg font-medium text-center">
                                        Tell me about your dream venue!
                                        <br />
                                        I'll search for the perfect match.
                                    </p>
                                </div>
                            ) : isSearchingHalls ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                                    <FaMagic className="text-4xl animate-pulse text-gold/50" />
                                    <p className="text-lg font-medium">
                                        Searching the finest venues...
                                    </p>
                                </div>
                            ) : displayedHalls.length > 0 ? (
                                <div className="flex flex-col gap-5">
                                    {displayedHalls.map((hall) => {
                                        const imageUrl = hall.image?.startsWith('http')
                                            ? hall.image
                                            : `https://mariage-hall-booking-system.vercel.app/${hall.image}`;

                                        return (
                                            <div
                                                key={hall._id}
                                                className="bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100 hover:shadow-xl transition-all group flex flex-col sm:flex-row h-auto sm:h-52"
                                            >
                                                <div className="w-full sm:w-2/5 relative overflow-hidden bg-gray-100 h-48 sm:h-full">
                                                    <img
                                                        src={imageUrl}
                                                        alt={hall.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                                                        <span className="font-bold text-gold">
                                                            Rs {hall.price?.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    {hall.matchScore && (
                                                        <div className="absolute top-4 left-4 bg-navy/90 text-white backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm text-xs font-bold">
                                                            {hall.matchScore}% Match
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="w-full sm:w-3/5 p-5 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h3 className="text-xl font-playfair font-bold text-navy group-hover:text-gold transition-colors line-clamp-1">
                                                                {hall.name}
                                                            </h3>
                                                        </div>
                                                        <div className="flex flex-wrap items-center text-sm text-gray-600 gap-4 mb-3">
                                                            <div className="flex items-center gap-1.5">
                                                                <FaMapMarkerAlt className="text-gold opacity-70" /> {hall.location}
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <FaUsers className="text-gold opacity-70" /> {hall.capacity} pax
                                                            </div>
                                                        </div>
                                                        {hall.matchReason && (
                                                            <p className="text-xs text-gray-500 italic line-clamp-2 border-l-2 border-gold/30 pl-2">
                                                                "{hall.matchReason}"
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="mt-4 sm:mt-0 flex justify-end">
                                                        <Link
                                                            to={`/halls/${hall._id}`}
                                                            className="px-6 py-2 rounded-xl border-2 border-navy text-navy font-bold hover:bg-navy hover:text-white transition-colors text-sm"
                                                        >
                                                            View Details
                                                        </Link>
                                                    </div>
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
