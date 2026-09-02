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
                <div className="fixed bottom-24 right-6 z-40 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] px-5 py-4 max-w-[240px] animate-bubble-in border border-gray-100 hidden sm:block">
                    <p className="text-sm text-navy font-medium leading-snug">
                        👋 Need help booking? <br/>
                        <span className="font-bold text-terracotta">Chat with Vera!</span>
                    </p>
                    <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-gray-100 rotate-45"></div>
                </div>
            )}

            <button
                onClick={toggle}
                className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300 z-50 flex items-center justify-center group ${isOpen ? 'bg-navy rotate-90 hover:bg-navy/90' : 'bg-navy hover:bg-navy/90'}`}
                aria-label="Toggle AI assistant"
            >
                {!isOpen && (
                    <span className="absolute inset-0 rounded-full bg-navy opacity-40 animate-ping"></span>
                )}

                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-terracotta rounded-full ring-2 ring-navy"></span>
                    </div>
                )}
            </button>
        </>
    );
};

export default ChatWidget;