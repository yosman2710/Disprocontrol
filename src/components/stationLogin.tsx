"use client";

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Beef, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
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
    const [usuario, setUsuario] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    // 1. Persistencia: Revisar si ya está logueado al cargar
    useEffect(() => {
        const userStr = localStorage.getItem('dispro_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.role === 'admin' || user.role === targetRole) {
                setIsAuthenticated(true);
            }
        }
    }, [targetRole]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch('http://localhost:3001/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: usuario, password: contrasena }),
            });

            const data = await res.json(); // Aquí recibes tu JSON con token y user

            if (res.ok) {
                // Validar si es Admin o el rol de la estación
                if (data.user.role === 'admin' || data.user.role === targetRole) {
                    localStorage.setItem('dispro_token', data.token);
                    localStorage.setItem('dispro_user', JSON.stringify(data.user));
                    setIsAuthenticated(true);
                    toast.success(`Acceso concedido como ${data.user.role}`);
                } else {
                    const area = data.user.role === 'pesador_caliente' ? 'Peso Caliente' : data.user.role === 'pesador_frio' ? 'Peso Frio' : 'Deshuesado';
                    toast.error(`No tienes permiso para esta área. Eres del area de: ${area}`);
                    setError(`No tienes permiso para esta área. Eres del area de: ${area}`);
                }
            } else {
                toast.error(data.message || 'Credenciales incorrectas');
                setError(data.message || 'Credenciales incorrectas');
            }
        } catch (err) {
            toast.error('Error de conexión con el servidor');
            setError('Error de conexión con el servidor');
        }
    };

    if (isAuthenticated) return <>{children}</>;

    return (
        <div className="login-screen">
            <button onClick={() => router.push('/')} className="back-btn">
                <ArrowLeft size={20} /> Volver
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
                        <label>Email o Usuario</label>
                        <div className="input-wrapper">
                            <User className="input-icon" size={20} />
                            <input
                                type="text"
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                placeholder="usuario@gmail.com"
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
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="toggle-pw">
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="login-submit">INGRESAR</button>
                </form>
            </div>
        </div>
    );
}