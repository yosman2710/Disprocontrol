"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Función helper para verificar si el JWT ha expirado
const isTokenExpired = (token: string) => {
    try {
        const payloadBase64 = token.split('.')[1];
        const decodedJson = atob(payloadBase64);
        const decoded = JSON.parse(decodedJson);
        const exp = decoded.exp;
        const now = Date.now() / 1000;
        return exp < now;
    } catch (e) {
        return true; // Si no se puede decodificar, asumimos que es inválido
    }
};

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const [isChecking, setIsChecking] = useState(true);
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = async () => {
            if (typeof window === 'undefined') return;

            // No validar en la página de login
            if (pathname === '/login') {
                setIsChecking(false);
                return;
            }

            // Validar token y sesión
            const token = localStorage.getItem('dispro_token');
            const userStr = localStorage.getItem('dispro_user');
            
            if (!token || !userStr || isTokenExpired(token)) {
                if (token && isTokenExpired(token)) {
                    toast.error('Su sesión ha expirado. Por favor ingrese de nuevo.');
                }
                localStorage.removeItem('dispro_token');
                localStorage.removeItem('dispro_user');
                
                if (pathname !== '/login') {
                    window.location.href = '/login';
                }
                return; // No cambiamos isChecking a false para no renderizar contenido antes de redirigir
            }

            try {
                // Validación de la sesión de Supabase
                const { data: { session } } = await supabase.auth.getSession();
                
                if (!session) {
                    toast.error('Su sesión ha expirado. Por favor ingrese de nuevo.');
                    localStorage.removeItem('dispro_token');
                    localStorage.removeItem('dispro_user');
                    window.location.href = '/login';
                    return;
                }
            } catch (error) {
                console.error("AuthGuard Session validation error:", error);
            }
            
            setIsChecking(false);
        };

        checkAuth();
    }, [pathname]);

    // Mostrar nada mientras se verifica, para evitar que cargue la interfaz si el token es inválido
    if (isChecking && pathname !== '/login') {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a' }}>
                <div style={{ color: '#fff', fontFamily: 'sans-serif' }}>Verificando sesión...</div>
            </div>
        );
    }

    return <>{children}</>;
}
