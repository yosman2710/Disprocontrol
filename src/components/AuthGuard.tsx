"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { verifySession } from '@/lib/api';
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

            // Si no hay token ni siquiera intentamos verificar con el servidor
            const token = localStorage.getItem('dispro_token');
            if (!token) {
                if (pathname !== '/login') {
                    window.location.href = '/login';
                }
                setIsChecking(false);
                return;
            }

            const isValid = await verifySession();
            
            if (!isValid) {
                // Si no es válido y no estamos en login, redirigir
                if (window.location.pathname !== '/login') {
                    toast.error('Su sesión ha expirado o es inválida. Por favor ingrese de nuevo.');
                    localStorage.removeItem('dispro_token');
                    localStorage.removeItem('dispro_user');
                    window.location.href = '/login';
                }
            }
            setIsChecking(false);
        };

        checkAuth();
    }, [pathname]);

    // Renderizamos children siempre para no bloquear el renderizado inicial,
    // pero la redirección ocurrirá casi inmediatamente si el token es inválido.
    return <>{children}</>;
}
