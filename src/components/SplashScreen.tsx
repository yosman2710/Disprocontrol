"use client";

import { useEffect, useState } from 'react';
import { Beef } from 'lucide-react';
import '@/styles/SplashScreen.css';

export function SplashScreen({ onComplete }: { onComplete?: () => void }) {
    const [isVisible, setIsVisible] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => {
                setIsVisible(false);
                if (onComplete) onComplete();
            }, 800); // Duración de la animación de salida
        }, 2000); // Tiempo que se muestra el splash

        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!isVisible) return null;

    return (
        <div className={`splash-screen ${isExiting ? 'exit' : ''}`}>
            <div className="splash-content">
                <div className="splash-logo-container">
                    <div className="splash-logo-glow"></div>
                    <Beef size={80} className="splash-logo" color="white" />
                </div>
                <h1 className="splash-title">DisproControl</h1>
                <div className="splash-loader">
                    <div className="loader-bar"></div>
                </div>
                <p className="splash-status">Inicializando sistema...</p>
            </div>
            <div className="splash-blobs">
                <div className="splash-blob splash-blob-1"></div>
                <div className="splash-blob splash-blob-2"></div>
            </div>
        </div>
    );
}
