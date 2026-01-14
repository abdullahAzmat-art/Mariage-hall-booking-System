import React, { useRef } from 'react';
import { SwitchTransition, Transition } from 'react-transition-group';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';

const PageTransition = ({ children }) => {
    const location = useLocation();
    const nodeRef = useRef(null);

    const onEnter = (node) => {
        gsap.fromTo(
            node,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
        );
    };

    const onExit = (node) => {
        gsap.to(node, {
            opacity: 0,
            y: -20,
            duration: 0.3,
            ease: 'power2.in',
        });
    };

    return (
        <SwitchTransition>
            <Transition
                key={location.pathname}
                nodeRef={nodeRef}
                timeout={500}
                onEnter={onEnter}
                onExit={onExit}
                unmountOnExit
            >
                <div ref={nodeRef} className="page-transition-container">
                    {children}
                </div>
            </Transition>
        </SwitchTransition>
    );
};

export default PageTransition;
