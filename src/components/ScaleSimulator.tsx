
'use client';
import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Save } from 'lucide-react';
import '../styles/ScaleSimulator.css';

interface ScaleSimulatorProps {
    title: string;
    icon: React.ReactNode;
    resNumber: number;
    onCapture: (peso: number) => void;
    disabled?: boolean;
    variant?: 'hot' | 'cold';
}

export function ScaleSimulator({ title, icon, resNumber, onCapture, disabled, variant = 'hot' }: ScaleSimulatorProps) {
    const [pesoActual, setPesoActual] = useState(0);
    const [pesoEstable, setPesoEstable] = useState(false);
    const [simulando, setSimulando] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (simulando) {
            const targetWeight = Math.random() * 100 + 350; // Simulación de res pesada
            interval = setInterval(() => {
                setPesoActual(prev => {
                    const diff = targetWeight - prev;
                    if (Math.abs(diff) < 0.1) {
                        setPesoEstable(true);
                        return targetWeight + (Math.random() - 0.5) * 0.05;
                    }
                    setPesoEstable(false);
                    return prev + diff * 0.15;
                });
            }, 50);
        }
        return () => clearInterval(interval);
    }, [simulando]);

    const resetScale = () => {
        setSimulando(false);
        setPesoActual(0);
        setPesoEstable(false);
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

            <div className="scale-controls">
                <button
                    className={`btn-scale btn-sim ${simulando ? 'active' : ''}`}
                    onClick={() => setSimulando(!simulando)}
                    disabled={disabled}
                >
                    {simulando ? <Pause size={18} /> : <Play size={18} />}
                    {simulando ? 'Detener' : 'Simular'}
                </button>
                <button className="btn-scale btn-tara" onClick={resetScale} disabled={disabled}>
                    <RotateCcw size={18} /> Tarar
                </button>
            </div>

            <button
                className={`btn-capture-main ${variant}`}
                disabled={!pesoEstable || pesoActual <= 0 || disabled}
                onClick={() => {
                    onCapture(parseFloat(pesoActual.toFixed(2)));
                    resetScale();
                }}
            >
                <Save size={22} /> Capturar Peso
            </button>
        </div>
    );
}