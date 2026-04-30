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
                router.push('/recepcion');
                break;
            case 'deshuesador':
                router.push('/corte_items');
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
            {children}
        </>
    );
}