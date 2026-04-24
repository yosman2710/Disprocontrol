'use client';

import { useEffect, useState } from 'react';
import { Plug, Unplug, RotateCcw, Save, AlertCircle } from 'lucide-react';
import '../styles/ScaleSimulator.css';

interface ScaleRealProps {
    title: string;
    icon: React.ReactNode;
    resNumber: number;
    onCapture: (peso: number) => void;
    disabled?: boolean;
    variant?: 'hot' | 'cold';
}

export function ScaleReal({
    title,
    icon,
    resNumber,
    onCapture,
    disabled,
    variant = 'hot',
}: ScaleRealProps) {
    const [pesoActual, setPesoActual] = useState(0);
    const [pesoEstable, setPesoEstable] = useState(false);
    const [conectada, setConectada] = useState(false);
    const [historial, setHistorial] = useState<number[]>([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [puertosDisponibles, setPuertosDisponibles] = useState<any[]>([]);

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/scale', { cache: 'no-store' });
                if (!res.ok) return;
                
                const data = await res.json();
                setConectada(!!data.connected);

                if (typeof data.latestWeight === 'number') {
                    const peso = data.latestWeight;
                    setPesoActual(peso);

                    setHistorial((prev) => {
                        const nuevo = [...prev, peso].slice(-5);
                        
                        // Lógica de estabilidad: 3 lecturas con diferencia menor a 0.2kg
                        if (nuevo.length >= 3) {
                            const max = Math.max(...nuevo);
                            const min = Math.min(...nuevo);
                            setPesoEstable(max - min <= 0.2);
                        } else {
                            setPesoEstable(false);
                        }
                        return nuevo;
                    });
                }
            } catch (err) {
                // Silencioso para no interrumpir el polling
            }
        }, 400);

        return () => clearInterval(interval);
    }, []);

    const conectar = async () => {
        try {
            setCargando(true);
            setError('');
            setPuertosDisponibles([]);

            const res = await fetch('/api/scale', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'connect' }),
            });

            const data = await res.json();

            if (!res.ok) {
                // Si falla, pedimos la lista de puertos para ayudar al usuario
                const listRes = await fetch('/api/scale', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'listPorts' }),
                });
                const ports = await listRes.json();
                setPuertosDisponibles(Array.isArray(ports) ? ports : []);
                
                throw new Error(data.error || 'No se pudo conectar al puerto COM5');
            }

            setConectada(true);
            setError('');
        } catch (e: any) {
            setError(e.message || 'Error conectando la balanza');
        } finally {
            setCargando(false);
        }
    };

    const desconectar = async () => {
        try {
            setCargando(true);
            await fetch('/api/scale', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'disconnect' }),
            });
            setConectada(false);
            setPesoActual(0);
            setPesoEstable(false);
        } catch (e: any) {
            setError('Error al desconectar');
        } finally {
            setCargando(false);
        }
    };

    const resetScale = () => {
        setPesoActual(0);
        setPesoEstable(false);
        setHistorial([]);
    };

    return (
        <div className={`scale-container ${variant}`}>
            <div className={`scale-header ${variant}`}>
                {icon}
                <span className="scale-title-text">
                    {title} — <span className="highlight-res">Res #{resNumber}</span>
                </span>
            </div>

            <div className={`scale-display ${pesoEstable ? 'is-stable' : ''}`}>
                {pesoEstable && <div className="status-badge">● ESTABLE</div>}
                <div className="weight-value">{pesoActual.toFixed(2)}</div>
                <div className="weight-unit">Kilogramos (kg)</div>
            </div>

            {error && (
                <div className="error-box" style={{ background: '#fff1f0', border: '1px solid #ffa39e', padding: '10px', borderRadius: '6px', marginBottom: '15px', color: '#cf1322', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                        <AlertCircle size={16} />
                        {error}
                    </div>
                    {puertosDisponibles.length > 0 && (
                        <div style={{ marginTop: '5px', paddingLeft: '24px' }}>
                            Puertos detectados: {puertosDisponibles.map(p => p.path).join(', ')}
                        </div>
                    )}
                </div>
            )}

            <div className="scale-controls">
                {!conectada ? (
                    <button
                        className="btn-scale btn-sim"
                        onClick={conectar}
                        disabled={disabled || cargando}
                    >
                        <Plug size={18} />
                        Conectar COM5
                    </button>
                ) : (
                    <button
                        className="btn-scale btn-sim active"
                        onClick={desconectar}
                        disabled={disabled || cargando}
                    >
                        <Unplug size={18} />
                        Desconectar
                    </button>
                )}

                <button
                    className="btn-scale btn-tara"
                    onClick={resetScale}
                    disabled={disabled || cargando}
                >
                    <RotateCcw size={18} /> Limpiar
                </button>
            </div>

            <button
                className={`btn-capture-main ${variant}`}
                // Habilitamos si hay peso > 0 y está conectada, incluso si la estabilidad falla por mínima oscilación
                disabled={pesoActual <= 0.1 || disabled || !conectada}
                onClick={() => {
                    onCapture(parseFloat(pesoActual.toFixed(2)));
                }}
            >
                <Save size={22} /> Capturar Peso
            </button>
        </div>
    );
}
