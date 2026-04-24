import { SerialPort, ReadlineParser } from 'serialport';

// Patrón Singleton para evitar múltiples conexiones en modo desarrollo de Next.js
interface ScaleState {
  port: SerialPort | null;
  parser: ReadlineParser | null;
  latestWeight: number;
  latestRawLine: string;
  connected: boolean;
}

const globalWithScale = global as typeof globalThis & {
  _scaleState?: ScaleState;
};

if (!globalWithScale._scaleState) {
  globalWithScale._scaleState = {
    port: null,
    parser: null,
    latestWeight: 0,
    latestRawLine: '',
    connected: false,
  };
}

const state = globalWithScale._scaleState;

function extractWeight(line: string): number | null {
  const clean = line.trim().replace(',', '.');
  const match = clean.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const value = parseFloat(match[0]);
  return Number.isNaN(value) ? null : value;
}

export async function connectScale() {
  if (state.connected && state.port && state.port.isOpen) {
    return { connected: true, message: 'Ya está conectada' };
  }

  // Si hay un puerto que quedó "colgado" pero no está abierto, lo limpiamos
  if (state.port) {
    try {
      if (state.port.isOpen) await new Promise(r => state.port!.close(r));
    } catch (e) {
      console.log('Error cerrando puerto previo:', e);
    }
  }

  console.log('Intentando conectar a la balanza en COM5...');

  state.port = new SerialPort({
    path: 'COM5',
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    autoOpen: false,
  });

  state.parser = state.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

  state.parser.on('data', (line: string) => {
    console.log('Datos recibidos de balanza:', line);
    state.latestRawLine = line;
    const weight = extractWeight(line);
    if (weight !== null) {
      state.latestWeight = weight;
    }
  });

  state.port.on('error', (err) => {
    console.error('Error serial (COM5):', err.message);
    state.connected = false;
  });

  state.port.on('close', () => {
    console.log('Puerto COM5 cerrado');
    state.connected = false;
  });

  await new Promise<void>((resolve, reject) => {
    state.port!.open((err) => {
      if (err) {
        console.error('No se pudo abrir COM5:', err.message);
        state.connected = false;
        return reject(err);
      }
      console.log('Balanza conectada exitosamente en COM5');
      state.connected = true;
      resolve();
    });
  });

  return { connected: true, message: 'Balanza conectada en COM5' };
}

export async function disconnectScale() {
  if (!state.port || !state.connected) {
    state.connected = false;
    return { connected: false, message: 'Ya estaba desconectada' };
  }

  await new Promise<void>((resolve, reject) => {
    state.port!.close((err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  state.port = null;
  state.parser = null;
  state.connected = false;

  return { connected: false, message: 'Balanza desconectada' };
}

export function getScaleState() {
  return {
    connected: state.connected,
    latestWeight: state.latestWeight,
    latestRawLine: state.latestRawLine,
  };
}

export async function listAvailablePorts() {
  try {
    const ports = await SerialPort.list();
    return ports.map(p => ({
      path: p.path,
      manufacturer: p.manufacturer,
      friendlyName: p.friendlyName
    }));
  } catch (error) {
    console.error('Error listando puertos:', error);
    return [];
  }
}