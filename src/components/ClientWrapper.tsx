"use client";

import { useState, useEffect } from 'react';
import { SplashScreen } from './SplashScreen';

export function ClientWrapper({ children }: { children: React.ReactNode }) {
    // Mostrar splash solo una vez por sesión de navegador (no en cada navegación)
    const [showSplash, setShowSplash] = useState(false);

    useEffect(() => {
        const alreadyShown = sessionStorage.getItem('dispro_splash_shown');
        if (!alreadyShown) {
            setShowSplash(true);
        }
    }, []);

    const handleSplashComplete = () => {
        sessionStorage.setItem('dispro_splash_shown', '1');
        setShowSplash(false);
    };

    return (
        <>
            {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
            <div style={{ visibility: showSplash ? 'hidden' : 'visible' }}>
                {children}
            </div>
        </>
    );
}
