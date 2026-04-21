'use client';

import { useEffect, useRef, useState } from 'react';
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

interface SerialPortInfo {
    usbVendorId?: number;
    usbProductId?: number;
}

interface SerialPortLike {
    readable: ReadableStream<Uint8Array> | null;
    open(options: {
        baudRate: number;
        dataBits?: number;
        stopBits?: 1 | 2;
        parity?: 'none' | 'even' | 'odd';
        bufferSize?: number;
        flowControl?: 'none' | 'hardware';
    }): Promise<void>;
    close(): Promise<void>;
    getInfo(): SerialPortInfo;
}

interface SerialLike {
    getPorts(): Promise<SerialPortLike[]>;
    requestPort(options?: { filters?: Array<Record<string, number>> }): Promise<SerialPortLike>;
    addEventListener(
        type: 'connect' | 'disconnect',
        listener: (event: Event) => void
    ): void;
    removeEventListener(
        type: 'connect' | 'disconnect',
        listener: (event: Event) => void
    ): void;
}

declare global {
    interface Navigator {
        serial?: SerialLike;
    }
}

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
}

function extractWeight(line: string): number | null {
    const clean = line.trim().replace(',', '.');
    const match = clean.match(/-?\d+(?:\.\d+)?/);

    if (!match) return null;

    const value = parseFloat(match[0]);
    return Number.isNaN(value) ? null : value;
}

function getPortLabel(port: SerialPortLike | null) {
    if (!port) return 'Puerto serial';

    const info = port.getInfo();
    const vendor = info.usbVendorId?.toString(16).toUpperCase().padStart(4, '0');
    const product = info.usbProductId?.toString(16).toUpperCase().padStart(4, '0');

    if (vendor && product) {
        return `Puerto ${vendor}:${product}`;
    }

    return 'Puerto serial';
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
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [serialSupported, setSerialSupported] = useState(true);
    const [portLabel, setPortLabel] = useState('Puerto serial');

    const portRef = useRef<SerialPortLike | null>(null);
    const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
    const historialRef = useRef<number[]>([]);
    const closingRef = useRef(false);

    const resetScale = () => {
        historialRef.current = [];
        setPesoActual(0);
        setPesoEstable(false);
    };

    const updateWeight = (peso: number) => {
        setPesoActual(peso);

        const nuevo = [...historialRef.current, peso].slice(-8);
        historialRef.current = nuevo;

        if (nuevo.length < 5) {
            setPesoEstable(false);
            return;
        }

        const ultimos = nuevo.slice(-5);
        const max = Math.max(...ultimos);
        const min = Math.min(...ultimos);
        setPesoEstable(max - min <= 0.1);
    };

    const closeCurrentPort = async () => {
        closingRef.current = true;

        const reader = readerRef.current;
        readerRef.current = null;

        if (reader) {
            try {
                await reader.cancel();
            } catch {
                // Ignora cancelaciones si el stream ya fue cerrado.
            }

            try {
                reader.releaseLock();
            } catch {
                // Ignora si no hay lock activo.
            }
        }

        const port = portRef.current;
        portRef.current = null;

        if (port) {
            try {
                await port.close();
            } catch {
                // Ignora errores al cerrar puertos ya cerrados.
            }
        }

        setConectada(false);
        setPortLabel('Puerto serial');
        closingRef.current = false;
    };

    const startReading = async (port: SerialPortLike) => {
        if (!port.readable) {
            throw new Error('El puerto serial no expone un stream legible');
        }

        const reader = port.readable.getReader();
        readerRef.current = reader;

        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { value, done } = await reader.read();

                if (done) {
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split(/\r?\n/);
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    const peso = extractWeight(line);
                    if (peso !== null) {
                        updateWeight(peso);
                        setError('');
                    }
                }
            }
        } catch (error: unknown) {
            if (!closingRef.current) {
                setError(getErrorMessage(error, 'Error leyendo la balanza'));
            }
        } finally {
            try {
                reader.releaseLock();
            } catch {
                // Ignora si el lock ya fue liberado.
            }

            if (readerRef.current === reader) {
                readerRef.current = null;
            }

            if (!closingRef.current) {
                await closeCurrentPort();
            }
        }
    };

    useEffect(() => {
        if (typeof navigator === 'undefined' || !navigator.serial) {
            setSerialSupported(false);
            setError('Este navegador no soporta Web Serial. Usa Chrome o Edge en escritorio.');
            return;
        }

        let mounted = true;
        const serial = navigator.serial;

        const syncGrantedPorts = async () => {
            try {
                const ports = await serial.getPorts();
                if (!mounted) return;

                if (ports[0]) {
                    portRef.current = ports[0];
                    setPortLabel(getPortLabel(ports[0]));
                }
            } catch {
                if (mounted) {
                    setError('No se pudieron consultar los puertos seriales autorizados.');
                }
            }
        };

        const handleDisconnect = () => {
            void closeCurrentPort();
            resetScale();
        };

        serial.addEventListener('disconnect', handleDisconnect);
        void syncGrantedPorts();

        return () => {
            mounted = false;
            serial.removeEventListener('disconnect', handleDisconnect);
            void closeCurrentPort();
        };
    }, []);

    const conectar = async () => {
        if (!navigator.serial) {
            setError('Web Serial no est\u00e1 disponible en este navegador.');
            return;
        }

        try {
            setCargando(true);
            setError('');

            const selectedPort =
                portRef.current ?? (await navigator.serial.requestPort());

            if (portRef.current && conectada) {
                await closeCurrentPort();
            }

            await selectedPort.open({
                baudRate: 9600,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                flowControl: 'none',
            });

            portRef.current = selectedPort;
            setPortLabel(getPortLabel(selectedPort));
            setConectada(true);
            resetScale();

            void startReading(selectedPort);
        } catch (error: unknown) {
            setConectada(false);
            setError(getErrorMessage(error, 'Error conectando la balanza'));
        } finally {
            setCargando(false);
        }
    };

    const desconectar = async () => {
        try {
            setCargando(true);
            setError('');
            await closeCurrentPort();
            resetScale();
        } catch (error: unknown) {
            setError(getErrorMessage(error, 'Error desconectando la balanza'));
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className={`scale-container ${variant}`}>
            <div className={`scale-header ${variant}`}>
                {icon}
                <span className="scale-title-text">
                    {title} - <span className="highlight-res">Res #{resNumber}</span>
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
                        type="button"
                        className="btn-scale btn-sim"
                        onClick={conectar}
                        disabled={disabled || cargando || !serialSupported}
                        title={disabled ? 'La b\u00e1scula est\u00e1 temporalmente bloqueada.' : undefined}
                    >
                        <Plug size={18} />
                        {portRef.current ? `Conectar ${portLabel}` : 'Seleccionar puerto'}
                    </button>
                ) : (
                    <button
                        type="button"
                        className="btn-scale btn-sim active"
                        onClick={desconectar}
                        disabled={disabled || cargando}
                    >
                        <Unplug size={18} />
                        Desconectar
                    </button>
                )}

                <button
                    type="button"
                    className="btn-scale btn-tara"
                    onClick={resetScale}
                    disabled={disabled || cargando}
                >
                    <RotateCcw size={18} />
                    Limpiar
                </button>
            </div>

            <button
                type="button"
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
