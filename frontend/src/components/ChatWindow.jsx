import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const SUGGESTIONS = [
    'How do I book a hall?',
    'What is the advance payment?',
    'Show me halls under Rs 50,000',
    'Cancellation policy?',
];

const formatTime = (date = new Date()) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const ChatWindow = ({ onClose }) => {
    const [messages, setMessages] = useState([
        {
            sender: 'bot',
            text: "Hello! I'm Vera ✨ — your Venuora Booking Concierge. How can I assist you today?",
            time: formatTime(),
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const sendMessage = async (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        const userMessage = { sender: 'user', text: trimmed, time: formatTime() };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        setIsTyping(true);

        try {
            const res = await axios.post(
                'https://mariage-hall-booking-system.vercel.app/api/chat',
                { message: trimmed }
            );
            const replyText = res.data.reply || "I'm here to help with your booking!";
            setTimeout(() => {
                setIsTyping(false);
                setMessages((prev) => [
                    ...prev,
                    { sender: 'bot', text: replyText, time: formatTime() },
                ]);
                setLoading(false);
            }, 600);
        } catch (error) {
            console.error('Chat Error:', error);
            setIsTyping(false);
            setMessages((prev) => [
                ...prev,
                {
                    sender: 'bot',
                    text: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
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
        <div className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-w-sm h-[560px] max-h-[80vh] rounded-3xl overflow-hidden z-50 flex flex-col shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] animate-chat-pop bg-ivory-warm border border-gray-200">
            {/* Header */}
            <div className="relative px-5 py-5 flex justify-between items-center text-white bg-navy overflow-hidden">
                <div className="relative flex items-center gap-3 z-10">
                    <div className="relative">
                        <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-xl font-playfair font-bold text-navy shadow-sm">
                            V
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-navy"></span>
                    </div>
                    <div>
                        <h3 className="font-playfair font-bold text-lg leading-tight">Vera</h3>
                        <p className="text-[11px] text-white/70 flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                            Online · Booking Concierge
                        </p>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="relative w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                    aria-label="Close chat"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 font-body scrollbar-thin scrollbar-thumb-gray-200">
                <div className="text-center text-[11px] font-bold uppercase tracking-wider text-gray-400 my-2">Today</div>

                {messages.map((msg, index) => {
                    const isUser = msg.sender === 'user';
                    const showAvatar = !isUser && (index === 0 || messages[index - 1].sender === 'user');
                    return (
                        <div key={index} className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'} animate-msg-in`}>
                            {!isUser && showAvatar && (
                                <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-sm font-playfair font-bold text-navy shadow-sm shrink-0">
                                    V
                                </div>
                            )}
                            {!isUser && !showAvatar && <div className="w-8 shrink-0"></div>}

                            <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[78%]`}>
                                <div className={`px-4 py-3 text-sm leading-relaxed shadow-sm ${
                                    isUser
                                        ? 'bg-terracotta text-white rounded-2xl rounded-br-sm'
                                        : 'bg-white text-navy border border-gray-100 rounded-2xl rounded-bl-sm'
                                }`}>
                                    {msg.text}
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 px-1 font-medium">
                                    {msg.time}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {isTyping && (
                    <div className="flex items-end gap-2 justify-start animate-msg-in">
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-sm font-playfair font-bold text-navy shadow-sm shrink-0">
                            V
                        </div>
                        <div className="bg-white border border-gray-100 px-4 py-3.5 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-typing" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-typing" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-typing" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick suggestions */}
            {messages.length <= 1 && (
                <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
                    {SUGGESTIONS.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => sendMessage(s)}
                            className="shrink-0 text-[11px] font-bold px-4 py-2 rounded-full bg-white border border-gray-200 text-navy hover:border-terracotta hover:text-terracotta transition-colors shadow-sm"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-3 items-end shadow-[0_-4px_20px_rgb(0,0,0,0.02)]">
                <div className="flex-1 relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="w-full px-5 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta text-sm text-navy transition-all placeholder-gray-400"
                    />
                </div>
                <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="w-12 h-12 shrink-0 rounded-full bg-terracotta text-white flex items-center justify-center transition-all hover:bg-terracotta/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    aria-label="Send message"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;