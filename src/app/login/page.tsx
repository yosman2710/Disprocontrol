"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Beef, Lock, User, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import '../../styles/StationLogin.css';

export default function LoginPage() {
    const [usuario, setUsuario] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Redirigir si ya está autenticado
        const userStr = localStorage.getItem('dispro_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            redirectByRole(user.role);
        }
    }, []);

    const redirectByRole = (role: string) => {
        switch (role) {
            case 'admin':
                router.push('/');
                break;
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
                router.push('/');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('https://backend-disprocar.onrender.com//auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: usuario, password: contrasena }),
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('dispro_token', data.token);
                localStorage.setItem('dispro_user', JSON.stringify(data.user));
                toast.success(`Bienvenido, ${data.user.role}`);
                redirectByRole(data.user.role);
            } else {
                toast.error(data.message || 'Credenciales incorrectas');
            }
        } catch (err) {
            toast.error('Error de conexión con el servidor');
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
