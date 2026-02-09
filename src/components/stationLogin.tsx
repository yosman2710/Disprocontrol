"use client";

import { useState, ReactNode } from 'react';
import { Beef, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Cambio clave para Next.js
import { toast } from 'sonner';
import '../styles/StationLogin.css'; // Tu CSS puro

interface StationCredentials {
    usuario: string;
    contrasena: string;
}

interface StationLoginProps {
    stationName: string;
    stationIcon: ReactNode;
    stationColor: string;
    credentials: StationCredentials;
    children: ReactNode;
}

export function StationLogin({
    stationName,
    stationIcon,
    stationColor,
    credentials,
    children,
}: StationLoginProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [usuario, setUsuario] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (usuario === credentials.usuario && contrasena === credentials.contrasena) {
            setIsAuthenticated(true);
            toast.success(`Acceso concedido — ${stationName}`);
        } else {
            setError('Usuario o contraseña incorrectos');
        }
    };

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <div className="login-screen">
            <button onClick={() => router.push('/')} className="back-btn">
                <ArrowLeft size={20} />
                <span>Volver</span>
            </button>

            <div className="login-card-container">
                <header className="login-header">
                    <div className="login-logo">
                        <Beef size={32} color="white" />
                    </div>
                    <h1 className="login-title">DisproControl</h1>
                </header>

                <div className={`station-badge ${stationColor}`}>
                    {stationIcon}
                    <span>{stationName}</span>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-info">
                        <Lock size={24} />
                        <p>Ingrese credenciales de estación</p>
                    </div>

                    {error && <div className="error-msg">{error}</div>}

                    <div className="input-group">
                        <label>Usuario</label>
                        <div className="input-wrapper">
                            <User className="input-icon" size={20} />
                            <input
                                type="text"
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                placeholder="Usuario de estación"
                                autoFocus
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
                            />
                            <button
                                type="button"
                                className="toggle-pw"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="login-submit">
                        Ingresar a Estación
                    </button>
                </form>
            </div>
        </div>
    );
}