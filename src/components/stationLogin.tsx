"use client";

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Beef, ArrowLeft, Lock, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import '../styles/StationLogin.css';

interface StationLoginProps {
    stationName: string;
    stationIcon: ReactNode;
    stationColor: string; // ej: "bg-destructive"
    targetRole: string;   // ej: "pesador_caliente"
    children: ReactNode;
}

export function StationLogin({ stationName, stationIcon, stationColor, targetRole, children }: StationLoginProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const userStr = localStorage.getItem('dispro_user');
        if (!userStr) {
            router.push('/login');
            return;
        }

        const user = JSON.parse(userStr);
        if (user.role === 'admin' || user.role === targetRole) {
            setIsAuthenticated(true);
            setIsLoading(false);
        } else {
            toast.error(`No tienes permiso para el área: ${stationName}`);
            // Si no es admin y no es su área, lo mandamos a su área correspondiente o al login
            redirectByRole(user.role);
        }
    }, [targetRole, router, stationName]);

    const redirectByRole = (role: string) => {
        switch (role) {
            case 'pesador_caliente':
                router.push('/heavy_hot');
                break;
            case 'pesador_frio':
                router.push('/heavy_cold');
                break;
            case 'deshuesador':
                router.push('/boner');
                break;
            case 'registrador':
                router.push('/order');
                break;
            default:
                router.push('/login');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('dispro_user');
        localStorage.removeItem('dispro_token');
        router.push('/login');
        toast.info('Sesión cerrada');
    };

    if (isLoading) {
        return (
            <div className="login-screen">
                <div className="login-card-container" style={{ textAlign: 'center', padding: '40px' }}>
                    <Beef size={48} className="animate-bounce" color="#641B2E" />
                    <p style={{ marginTop: '20px', color: '#64748b' }}>Verificando acceso...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <>
            {/* Botón de Logout (esquina superior derecha) */}
            <button
                onClick={handleLogout}
                className="logout-btn"
                style={{ position: 'fixed', top: '20px', right: '40px', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', padding: '8px 16px', borderRadius: '30px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
            >
                <LogOut size={18} />
                Cerrar Sesión
            </button>

            {/* Botón flotante para volver (solo admin) */}
            {JSON.parse(localStorage.getItem('dispro_user') || '{}').role === 'admin' && (
                <button
                    onClick={() => router.push('/')}
                    className="back-btn"
                    style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #e2e8f0', color: '#475569', padding: '8px 16px', borderRadius: '30px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
                >
                    <ArrowLeft size={20} />
                    Panel Principal
                </button>
            )}
            {children}
        </>
    );
}