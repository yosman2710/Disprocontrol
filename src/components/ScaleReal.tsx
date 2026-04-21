'use client';

import { useEffect, useState } from 'react';
import { Plug, Unplug, RotateCcw, Save } from 'lucide-react';
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

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/scale', { cache: 'no-store' });
                const data = await res.json();

                setConectada(!!data.connected);

                if (typeof data.latestWeight === 'number') {
                    const peso = data.latestWeight;
                    setPesoActual(peso);

                    setHistorial((prev) => {
                        const nuevo = [...prev, peso].slice(-8);

                        if (nuevo.length >= 5) {
                            const ultimos = nuevo.slice(-5);
                            const max = Math.max(...ultimos);
                            const min = Math.min(...ultimos);
                            setPesoEstable(max - min <= 0.1);
                        } else {
                            setPesoEstable(false);
                        }

                        return nuevo;
                    });
                }
            } catch {
                setError('No se pudo leer la balanza');
            }
        }, 500);

        return () => clearInterval(interval);
    }, []);

    const conectar = async () => {
        try {
            setCargando(true);
            setError('');

            const res = await fetch('/api/scale', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'connect' }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'No se pudo conectar al puerto COM5');
            }

            setConectada(true);
        } catch (e: any) {
            setError(e.message || 'Error conectando la balanza');
        } finally {
            setCargando(false);
        }
    };

    const desconectar = async () => {
        try {
            setCargando(true);
            setError('');

            const res = await fetch('/api/scale', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'disconnect' }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'No se pudo desconectar');
            }

            setConectada(false);
            setPesoActual(0);
            setPesoEstable(false);
            setHistorial([]);
        } catch (e: any) {
            setError(e.message || 'Error desconectando la balanza');
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
                <div style={{ color: '#ff4d4f', fontSize: '14px', marginBottom: '10px' }}>
                    {error}
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
                    <RotateCcw size={18} />
                    Limpiar
                </button>
            </div>

            <button
                className={`btn-capture-main ${variant}`}
                disabled={!pesoEstable || pesoActual <= 0 || disabled || !conectada}
                onClick={() => {
                    onCapture(parseFloat(pesoActual.toFixed(2)));
                }}
            >
                <Save size={22} /> Capturar Peso
            </button>
        </div>
    );
}