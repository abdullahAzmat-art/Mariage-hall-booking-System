import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col bg-white font-poppins text-text selection:bg-primary/20 selection:text-primary">
            <Navbar />
            <main className="flex-grow pt-24 pb-12 flex flex-col w-full">
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
