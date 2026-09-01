import React, { useState } from 'react';
import ChatWindow from './ChatWindow';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    const toggle = () => {
        setIsOpen((prev) => {
            if (!prev) setHasInteracted(true);
            return !prev;
        });
    };

    return (
        <>
            {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}

            {!isOpen && !hasInteracted && (
                <div className="fixed bottom-20 right-6 z-40 bg-white rounded-2xl shadow-xl px-4 py-2.5 max-w-[220px] animate-bubble-in border border-gray-100 hidden sm:block">
                    <p className="text-xs text-gray-700">
                        👋 Need help booking a hall? <span className="font-semibold text-gold-dark">Chat with me!</span>
                    </p>
                    <div className="absolute -bottom-2 right-6 w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45"></div>
                </div>
            )}

            <button
                onClick={toggle}
                className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl transition-all duration-300 z-50 flex items-center justify-center group ${isOpen ? 'bg-gray-900 rotate-90' : ''
                    }`}
                style={
                    !isOpen
                        ? {
                            background:
                                'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #b8860b 100%)',
                        }
                        : {}
                }
                aria-label="Toggle AI assistant"
            >
                {!isOpen && (
                    <span className="absolute inset-0 rounded-full bg-gold opacity-60 animate-ping"></span>
                )}

                {isOpen ? (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <div className="relative">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                            />
                        </svg>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full ring-2 ring-white"></span>
                    </div>
                )}
            </button>
        </>
    );
};

export default ChatWidget;