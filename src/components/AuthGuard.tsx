"use client";
 
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
 
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
 
            // Validar token y sesión de Supabase
            const token = localStorage.getItem('dispro_token');
            const userStr = localStorage.getItem('dispro_user');
            
            if (!token || !userStr) {
                if (pathname !== '/login') {
                    window.location.href = '/login';
                }
                setIsChecking(false);
                return;
            }
 
            try {
                // Validación rápida usando la sesión de Supabase
                const { data: { session } } = await supabase.auth.getSession();
                
                if (!session) {
                    // Si no hay sesión activa en Supabase pero hay datos locales antiguos, limpiamos
                    toast.error('Su sesión ha expirado. Por favor ingrese de nuevo.');
                    localStorage.removeItem('dispro_token');
                    localStorage.removeItem('dispro_user');
                    window.location.href = '/login';
                }
            } catch (error) {
                console.error("AuthGuard Session validation error:", error);
            }
            
            setIsChecking(false);
        };
 
        checkAuth();
    }, [pathname]);
 
    // Renderizamos children siempre para no bloquear el renderizado inicial,
    // pero la redirección ocurrirá casi inmediatamente si el token es inválido.
    return <>{children}</>;
}
