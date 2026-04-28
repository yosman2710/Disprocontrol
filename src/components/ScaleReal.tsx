'use client';

import { useEffect, useState, useRef } from 'react';
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
    
    // Referencias para la Web Serial API
    const portRef = useRef<any>(null);
    const readerRef = useRef<any>(null);
    const isReadingRef = useRef<boolean>(false);

    // Al desmontar el componente, nos aseguramos de cerrar el puerto
    useEffect(() => {
        return () => {
            isReadingRef.current = false;
            if (readerRef.current) {
                readerRef.current.cancel().catch(console.error);
            }
        };
    }, []);

    const procesarLineaBalanza = (linea: string) => {
        const clean = linea.trim().replace(',', '.');
        const match = clean.match(/-?\d+(?:\.\d+)?/);
        
        if (match) {
            const peso = parseFloat(match[0]);
            if (!Number.isNaN(peso)) {
                setPesoActual(peso);

                setHistorial((prev) => {
                    const nuevo = [...prev, peso].slice(-5);
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
        }
    };

    const leerPuerto = async () => {
        const port = portRef.current;
        if (!port) return;

        try {
            const textDecoder = new TextDecoderStream();
            const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
            const reader = textDecoder.readable.getReader();
            readerRef.current = reader;

            let buffer = '';

            while (isReadingRef.current) {
                const { value, done } = await reader.read();
                if (done) {
                    break;
                }
                if (value) {
                    buffer += value;
                    // Separar por salto de línea (\n o \r\n)
                    const lineas = buffer.split(/\r?\n/);
                    
                    if (lineas.length > 1) {
                        for (let i = 0; i < lineas.length - 1; i++) {
                            procesarLineaBalanza(lineas[i]);
                        }
                        buffer = lineas[lineas.length - 1]; // Guardar el fragmento incompleto
                    }
                }
            }
        } catch (err: any) {
            console.error('Error leyendo del puerto:', err);
            // Ignore cancelation errors
            if (err.name !== 'TypeError') {
                setError('Se perdió la conexión con la báscula');
            }
            setConectada(false);
        } finally {
            readerRef.current?.releaseLock();
        }
    };

    const conectar = async () => {
        try {
            setCargando(true);
            setError('');

            // 1. Verificar si el navegador soporta Web Serial
            if (!('serial' in navigator)) {
                throw new Error('Tu navegador no soporta la Web Serial API. Por favor, usa Google Chrome o Microsoft Edge.');
            }

            // 2. Pedir al usuario que seleccione el puerto COM
            // Esto abrirá una ventanita del navegador
            const port = await (navigator as any).serial.requestPort();
            portRef.current = port;

            // 3. Abrir el puerto (9600 baudios es el estandar de la Doran 4300)
            await port.open({ baudRate: 9600 });
            setConectada(true);

            // 4. Iniciar la lectura en bucle
            isReadingRef.current = true;
            leerPuerto();

        } catch (e: any) {
            console.error(e);
            // Si el usuario cancela la selección, el error suele ser "No port selected"
            if (e.message?.includes('No port selected')) {
                setError(''); // No mostrar error si simplemente canceló la ventana
            } else {
                setError(e.message || 'Error conectando la balanza por USB');
            }
        } finally {
            setCargando(false);
        }
    };

    const desconectar = async () => {
        try {
            setCargando(true);
            isReadingRef.current = false; // Esto romperá el ciclo while en leerPuerto()

            if (readerRef.current) {
                await readerRef.current.cancel(); // Forzar la detención del reader
            }

            // Esperar un momento breve para que el reader libere el lock
            setTimeout(async () => {
                if (portRef.current) {
                    try {
                        await portRef.current.close();
                    } catch (e) {
                        console.error('Error cerrando puerto', e);
                    }
                    portRef.current = null;
                }
                setConectada(false);
                setPesoActual(0);
                setPesoEstable(false);
                setCargando(false);
            }, 100);

        } catch (e: any) {
            console.error(e);
            setError('Error al desconectar');
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
                        Conectar Báscula
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
