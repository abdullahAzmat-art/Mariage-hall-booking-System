import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const SUGGESTIONS = [
    'How do I book a hall?',
    'What is the advance payment?',
    'Show me halls under ₹50,000',
    'Cancellation policy?',
];

const formatTime = (date = new Date()) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const ChatWindow = ({ onClose }) => {
    const [messages, setMessages] = useState([
        {
            sender: 'bot',
            text: "Hello! I'm Aria ✨ — your Marriage Hall Booking Assistant. How can I help you today?",
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
        <div
            className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-w-sm h-[560px] max-h-[80vh] rounded-3xl overflow-hidden z-50 flex flex-col animate-chat-pop"
            style={{
                background:
                    'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,247,237,0.9) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow:
                    '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.5) inset',
            }}
        >
            {/* Header */}
            <div
                className="relative px-5 py-4 flex justify-between items-center text-white overflow-hidden"
                style={{
                    background:
                        'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #b8860b 100%)',
                }}
            >
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold/30 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl"></div>

                <div className="relative flex items-center gap-3">
                    <div className="relative">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center text-lg font-bold shadow-lg ring-2 ring-white/30">
                            A
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full ring-2 ring-[#1a1a2e] animate-pulse"></span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-base leading-tight">Aria</h3>
                        <p className="text-[11px] text-white/70 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                            Online · Replies instantly
                        </p>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="relative w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all hover:rotate-90 duration-300"
                    aria-label="Close chat"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </div>

            {/* Messages Area */}
            <div
                className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 20% 20%, rgba(184,134,11,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(99,102,241,0.05) 0%, transparent 50%)',
                }}
            >
                <div className="text-center text-[11px] text-gray-400 my-2">Today</div>

                {messages.map((msg, index) => {
                    const isUser = msg.sender === 'user';
                    const showAvatar =
                        !isUser && (index === 0 || messages[index - 1].sender === 'user');
                    return (
                        <div
                            key={index}
                            className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'} animate-msg-in`}
                        >
                            {!isUser && showAvatar && (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                                    A
                                </div>
                            )}
                            {!isUser && !showAvatar && <div className="w-7 shrink-0"></div>}

                            <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[78%]`}>
                                <div
                                    className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${isUser
                                        ? 'rounded-2xl rounded-br-md text-white'
                                        : 'rounded-2xl rounded-bl-md text-gray-800 border border-gray-100'
                                        }`}
                                    style={
                                        isUser
                                            ? {
                                                background:
                                                    'linear-gradient(135deg, #b8860b 0%, #d4a017 100%)',
                                            }
                                            : { background: '#ffffff' }
                                    }
                                >
                                    {msg.text}
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 px-1">
                                    {msg.time}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {isTyping && (
                    <div className="flex items-end gap-2 justify-start animate-msg-in">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                            A
                        </div>
                        <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm flex items-center gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-typing" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-typing" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-typing" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick suggestions (only show at start) */}
            {messages.length <= 1 && (
                <div className="px-4 pb-2 flex gap-2 overflow-x-auto hide-scrollbar">
                    {SUGGESTIONS.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => sendMessage(s)}
                            className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-white border border-gold/30 text-gold-dark hover:bg-gold hover:text-white transition-colors shadow-sm"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <form
                onSubmit={handleSend}
                className="p-3 border-t border-gray-100 flex gap-2 items-end bg-white/60 backdrop-blur-sm"
            >
                <div className="flex-1 relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me anything…"
                        className="w-full px-4 py-2.5 pr-10 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-gold/40 focus:bg-white text-sm transition-all"
                    />
                    {input && (
                        <button
                            type="button"
                            onClick={() => setInput('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="w-10 h-10 rounded-full text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md"
                    style={{
                        background:
                            'linear-gradient(135deg, #b8860b 0%, #d4a017 100%)',
                    }}
                    aria-label="Send message"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 translate-x-0.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;