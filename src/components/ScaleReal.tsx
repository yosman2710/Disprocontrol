'use client';

import { useEffect, useState } from 'react';
import { Plug, Unplug, RotateCcw, Save, AlertCircle } from 'lucide-react';
import '../styles/ScaleSimulator.css';

// --- ESTADO GLOBAL DE LA BÁSCULA ---
// Al sacar estas variables fuera del componente, la conexión persiste
// incluso si el componente se desmonta (ej: al pasar a la siguiente Res).
let globalPort: any = null;
let globalReader: any = null;
let globalIsReading = false;
let globalPesoActual = 0;
let globalPesoEstable = false;
let historialLocal: number[] = [];

type StateListener = (peso: number, estable: boolean) => void;
type ConnectionListener = (conectada: boolean, error: string) => void;

const stateListeners = new Set<StateListener>();
const connectionListeners = new Set<ConnectionListener>();

function notifyState() {
    stateListeners.forEach(l => l(globalPesoActual, globalPesoEstable));
}

function notifyConnection(conectada: boolean, error: string = '') {
    connectionListeners.forEach(l => l(conectada, error));
}

function procesarLineaBalanza(linea: string) {
    const clean = linea.trim().replace(',', '.');
    const match = clean.match(/-?\d+(?:\.\d+)?/);
    
    if (match) {
        const peso = parseFloat(match[0]);
        if (!Number.isNaN(peso)) {
            globalPesoActual = peso;

            historialLocal = [...historialLocal, peso].slice(-5);
            if (historialLocal.length >= 3) {
                const max = Math.max(...historialLocal);
                const min = Math.min(...historialLocal);
                globalPesoEstable = (max - min <= 0.2);
            } else {
                globalPesoEstable = false;
            }
            notifyState();
        }
    }
}

async function leerPuerto() {
    if (!globalPort) return;

    try {
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = globalPort.readable.pipeTo(textDecoder.writable);
        globalReader = textDecoder.readable.getReader();

        let buffer = '';

        while (globalIsReading) {
            const { value, done } = await globalReader.read();
            if (done) break;
            if (value) {
                buffer += value;
                const lineas = buffer.split(/\r?\n/);
                if (lineas.length > 1) {
                    for (let i = 0; i < lineas.length - 1; i++) {
                        procesarLineaBalanza(lineas[i]);
                    }
                    buffer = lineas[lineas.length - 1];
                }
            }
        }
    } catch (err: any) {
        console.error('Error leyendo del puerto:', err);
        if (err.name !== 'TypeError') {
            notifyConnection(false, 'Se perdió la conexión con la báscula');
        }
    } finally {
        if (globalReader) {
            globalReader.releaseLock();
            globalReader = null;
        }
    }
}

async function conectarGlobal() {
    try {
        if (!('serial' in navigator)) {
            throw new Error('Navegador no soporta Web Serial API. Usa Chrome o Edge.');
        }

        // Si el usuario elige un puerto, pedimos el prompt
        const port = await (navigator as any).serial.requestPort();
        globalPort = port;

        if (!globalPort.readable) {
            await globalPort.open({ baudRate: 9600 });
        }

        globalIsReading = true;
        notifyConnection(true, '');
        leerPuerto();

    } catch (e: any) {
        console.error(e);
        if (e.message?.includes('No port selected')) {
            notifyConnection(false, ''); 
        } else if (e.message?.includes('already open')) {
            // Si por alguna razón dice que ya está abierto, lo asumimos conectado
            globalIsReading = true;
            notifyConnection(true, '');
            leerPuerto();
        } else {
            notifyConnection(false, e.message || 'Error conectando la balanza');
        }
    }
}

async function autoConectarGlobal() {
    try {
        if (globalPort && globalPort.readable) return; // Ya conectado

        if (!('serial' in navigator)) return;

        // Recuperar puertos que el usuario ya ha autorizado antes
        const ports = await (navigator as any).serial.getPorts();
        if (ports.length > 0) {
            globalPort = ports[0];
            if (!globalPort.readable) {
                await globalPort.open({ baudRate: 9600 });
            }
            globalIsReading = true;
            notifyConnection(true, '');
            leerPuerto();
        }
    } catch (e) {
        console.error('Autoconexión falló:', e);
    }
}

async function desconectarGlobal() {
    globalIsReading = false;
    
    if (globalReader) {
        await globalReader.cancel().catch(() => {});
    }

    setTimeout(async () => {
        if (globalPort) {
            try {
                await globalPort.close();
            } catch (e) {
                console.error('Error cerrando puerto', e);
            }
            globalPort = null;
        }
        globalPesoActual = 0;
        globalPesoEstable = false;
        historialLocal = [];
        notifyState();
        notifyConnection(false, '');
    }, 150);
}

function limpiarGlobal() {
    globalPesoActual = 0;
    globalPesoEstable = false;
    historialLocal = [];
    notifyState();
}

// --- FIN ESTADO GLOBAL ---

interface ScaleRealProps {
    title: string;
    icon: React.ReactNode;
    resNumber: number;
    onCapture: (peso: number) => void;
    disabled?: boolean;
    variant?: 'hot' | 'corte';
}

export function ScaleReal({
    title,
    icon,
    resNumber,
    onCapture,
    disabled,
    variant = 'hot',
}: ScaleRealProps) {
    const [pesoActual, setPesoActual] = useState(globalPesoActual);
    const [pesoEstable, setPesoEstable] = useState(globalPesoEstable);
    const [conectada, setConectada] = useState(!!globalPort && globalIsReading);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const onStateChange = (peso: number, estable: boolean) => {
            setPesoActual(peso);
            setPesoEstable(estable);
        };

        const onConnectionChange = (estaConectada: boolean, err: string) => {
            setConectada(estaConectada);
            setError(err);
            setCargando(false);
        };

        stateListeners.add(onStateChange);
        connectionListeners.add(onConnectionChange);

        // Intentar autoconectar si ya se dio permiso en esta sesión o anteriormente
        if (!globalPort || !globalIsReading) {
            autoConectarGlobal();
        }

        return () => {
            stateListeners.delete(onStateChange);
            connectionListeners.delete(onConnectionChange);
        };
    }, []);

    const handleConectar = async () => {
        setCargando(true);
        setError('');
        await conectarGlobal();
        setCargando(false);
    };

    const handleDesconectar = async () => {
        setCargando(true);
        await desconectarGlobal();
        setCargando(false);
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
                        onClick={handleConectar}
                        disabled={disabled || cargando}
                    >
                        <Plug size={18} />
                        Conectar Báscula
                    </button>
                ) : (
                    <button
                        className="btn-scale btn-sim active"
                        onClick={handleDesconectar}
                        disabled={disabled || cargando}
                    >
                        <Unplug size={18} />
                        Desconectar
                    </button>
                )}

                <button
                    className="btn-scale btn-tara"
                    onClick={limpiarGlobal}
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
