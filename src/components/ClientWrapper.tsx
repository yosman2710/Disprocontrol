"use client";

import { useState, useEffect } from 'react';
import { SplashScreen } from './SplashScreen';

export function ClientWrapper({ children }: { children: React.ReactNode }) {
    const [showSplash, setShowSplash] = useState(true);

    // Solo mostramos el splash una vez por sesión (opcional)
    // O siempre al inicio. El usuario pidió mejorar la animación de inicio.
    
    return (
        <>
            {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
            <div style={{ visibility: showSplash ? 'hidden' : 'visible' }}>
                {children}
            </div>
        </>
    );
}
