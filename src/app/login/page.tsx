"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Beef, Lock, User, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import '../../styles/StationLogin.css';

export default function LoginPage() {
    const [usuario, setUsuario] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Redirigir si ya está autenticado y la sesión es válida
        const checkExistingAuth = async () => {
            const userStr = localStorage.getItem('dispro_user');
            const token = localStorage.getItem('dispro_token');
            
            if (userStr && token) {
                try {
                    const { verifySession } = await import('@/lib/api');
                    const isValid = await verifySession();
                    if (isValid) {
                        const user = JSON.parse(userStr);
                        redirectByRole(user.role);
                    }
                } catch (e) {
                    // Silently fail, let the user login normally
                    console.warn('Initial session check failed:', e);
                }
            }
        };
        checkExistingAuth();
    }, []);

    const redirectByRole = (role: string) => {
        switch (role) {
            case 'admin':
                router.push('/');
                break;
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
                router.push('/');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email: usuario, password: contrasena }),
            });

            localStorage.setItem('dispro_token', data.token);
            localStorage.setItem('dispro_user', JSON.stringify(data.user));
            toast.success(`Bienvenido, ${data.user.role}`);
            redirectByRole(data.user.role);
        } catch (err: any) {
            toast.error(err.message || 'Error de conexión con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-screen">
            <div className="login-card-container">
                <header className="login-header">
                    <div className="login-logo">
                        <Beef size={32} color="white" />
                    </div>
                    <h1 className="login-title">DisproControl</h1>
                </header>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-info">
                        <Lock size={24} />
                        <p>Ingrese sus credenciales de acceso</p>
                    </div>

                    <div className="input-group">
                        <label>Email o Usuario</label>
                        <div className="input-wrapper">
                            <User className="input-icon" size={20} />
                            <input
                                type="text"
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                placeholder="usuario@gmail.com"
                                required
                            />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Contraseña</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={20} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={contrasena}
                                onChange={(e) => setContrasena(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="toggle-pw">
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="login-submit" disabled={isLoading}>
                        {isLoading ? 'CARGANDO...' : 'INGRESAR'}
                    </button>
                </form>
            </div>
        </div>
    );
}
