"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { API_URL } from '@/lib/api';
import '../../styles/StationLogin.css';

export default function LoginPage() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [usuario, setUsuario] = useState('');
    const [username, setUsername] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [role, setRole] = useState('admin');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Redirigir si ya hay sesión guardada localmente
        const userStr = localStorage.getItem('dispro_user');
        const token = localStorage.getItem('dispro_token');
        if (userStr && token) {
            const user = JSON.parse(userStr);
            redirectByRole(user.role);
        }
    }, []);

    const redirectByRole = (role: string) => {
        switch (role) {
            case 'admin': router.push('/'); break;
            case 'pesador_caliente': router.push('/recepcion'); break;
            case 'deshuesador': router.push('/corte_items'); break;
            case 'registrador': router.push('/order'); break;
            default: router.push('/');
        }
    };

    /**
     * LOGIN: Estrategia híbrida
     * 1. Autenticar en Supabase Auth (para sesión del frontend/AuthGuard)
     * 2. Llamar al backend Express /auth/login (para obtener el JWT que acepta la API REST)
     *    El backend Express puede validar la contraseña porque el usuario fue registrado
     *    con un hash bcrypt real generado por la función RPC de Supabase (pgcrypto).
     */
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // PASO 1: Supabase Auth (sesión del frontend)
            const { data: supaData, error: supaError } = await supabase.auth.signInWithPassword({
                email: usuario,
                password: contrasena
            });
            if (supaError) throw new Error(`Credenciales incorrectas: ${supaError.message}`);

            // PASO 2: JWT del backend Express (para autorizar peticiones a la API REST)
            const backendRes = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: usuario, password: contrasena })
            });

            if (!backendRes.ok) {
                const errData = await backendRes.json().catch(() => ({}));
                throw new Error(errData.message || errData.error || `Error del backend (${backendRes.status})`);
            }

            const backendData = await backendRes.json();

            // PASO 3: Guardar token del backend + datos de usuario con rol
            const userData = {
                id: supaData.user.id,
                email: supaData.user.email,
                role: backendData.user?.role || 'admin'
            };

            localStorage.setItem('dispro_token', backendData.token);
            localStorage.setItem('dispro_user', JSON.stringify(userData));

            toast.success(`Bienvenido, ${userData.role}`);
            redirectByRole(userData.role);

        } catch (err: any) {
            toast.error(err.message || 'Error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * REGISTRO: Crea el usuario en ambos sistemas
     * 1. Supabase Auth → para gestión de sesión en el frontend
     * 2. RPC register_user_with_hash → crea el usuario en la tabla pública 'users'
     *    con un hash bcrypt real (generado por pgcrypto, compatible con Node.js bcrypt)
     *    para que el backend Express pueda validar la contraseña con bcrypt.compare()
     */
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // PASO 1: Crear en Supabase Auth
            const { data: supaData, error: supaError } = await supabase.auth.signUp({
                email: usuario,
                password: contrasena,
                options: { data: { username, role } }
            });
            if (supaError) throw new Error(`Error en Supabase Auth: ${supaError.message}`);

            // PASO 2: Crear en tabla pública 'users' con bcrypt hash real
            // La función RPC usa pgcrypto (crypt + gen_salt('bf', 10)) → formato $2a$ compatible con Node.js
            const { error: rpcError } = await supabase.rpc('register_user_with_hash', {
                p_email: usuario,
                p_username: username || usuario.split('@')[0],
                p_password: contrasena,
                p_role: role
            });

            if (rpcError) {
                console.warn('RPC error al crear perfil público:', rpcError.message);
                toast.warning('Cuenta de acceso creada, pero el perfil de sistema falló. Contacta al administrador.');
            } else {
                toast.success('¡Registro exitoso! Ahora puedes iniciar sesión.');
            }

            setIsRegistering(false);
            setContrasena('');
            setUsuario('');
            setUsername('');

        } catch (err: any) {
            toast.error(err.message || 'Error al registrar el usuario');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-screen">
            <div className="login-card-container" style={{ maxWidth: '420px', padding: '30px' }}>
                <header className="login-header">
                    <div className="login-logo">
                        <img src="/icon.png" alt="Logo" style={{ width: 48, height: 48, objectFit: 'contain' }} />
                    </div>
                    <h1 className="login-title">DisproControl</h1>
                </header>

                {isRegistering ? (
                    <form onSubmit={handleRegister} className="login-form">
                        <div className="form-info">
                            <ClipboardList size={24} />
                            <p>Crear nuevo usuario en el sistema</p>
                        </div>

                        <div className="input-group">
                            <label>Email</label>
                            <div className="input-wrapper">
                                <User className="input-icon" size={20} />
                                <input type="email" value={usuario}
                                    onChange={(e) => setUsuario(e.target.value)}
                                    placeholder="usuario@disprocar.com" required />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Nombre de Usuario</label>
                            <div className="input-wrapper">
                                <User className="input-icon" size={20} />
                                <input type="text" value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="admin_dispro" required />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Rol del Sistema</label>
                            <div className="input-wrapper" style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                <select value={role} onChange={(e) => setRole(e.target.value)}
                                    style={{ width: '100%', padding: '12px', background: 'transparent', border: 'none', color: '#1e293b', fontWeight: 600, outline: 'none' }}>
                                    <option value="admin">Administrador</option>
                                    <option value="registrador">Registrador</option>
                                    <option value="pesador_caliente">Pesador Caliente</option>
                                    <option value="deshuesador">Deshuesador</option>
                                </select>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Contraseña</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={20} />
                                <input type={showPassword ? 'text' : 'password'} value={contrasena}
                                    onChange={(e) => setContrasena(e.target.value)}
                                    placeholder="Mínimo 6 caracteres" required minLength={6} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="toggle-pw">
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="login-submit" disabled={isLoading}>
                            {isLoading ? 'REGISTRANDO...' : 'REGISTRAR USUARIO'}
                        </button>

                        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#64748b' }}>
                            ¿Ya tienes cuenta?{' '}
                            <button type="button" onClick={() => setIsRegistering(false)}
                                style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
                                Iniciar Sesión
                            </button>
                        </p>
                    </form>
                ) : (
                    <form onSubmit={handleLogin} className="login-form">
                        <div className="form-info">
                            <Lock size={24} />
                            <p>Ingrese sus credenciales de acceso</p>
                        </div>

                        <div className="input-group">
                            <label>Email</label>
                            <div className="input-wrapper">
                                <User className="input-icon" size={20} />
                                <input type="text" value={usuario}
                                    onChange={(e) => setUsuario(e.target.value)}
                                    placeholder="usuario@gmail.com" required />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Contraseña</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={20} />
                                <input type={showPassword ? 'text' : 'password'} value={contrasena}
                                    onChange={(e) => setContrasena(e.target.value)}
                                    placeholder="••••••••" required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="toggle-pw">
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="login-submit" disabled={isLoading}>
                            {isLoading ? 'CARGANDO...' : 'INGRESAR'}
                        </button>

                        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#64748b' }}>
                            ¿No tienes cuenta?{' '}
                            <button type="button" onClick={() => setIsRegistering(true)}
                                style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
                                Registrarse
                            </button>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
