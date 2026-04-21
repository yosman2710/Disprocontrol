import type { ReadlineParser } from '@serialport/parser-readline';
import type { SerialPort } from 'serialport';

let port: SerialPort | null = null;
let parser: ReadlineParser | null = null;
let latestWeight = 0;
let latestRawLine = '';
let connected = false;
let serialSupportError: string | null = null;

async function loadSerialModules() {
  try {
    const [{ SerialPort }, { ReadlineParser }] = await Promise.all([
      import('serialport'),
      import('@serialport/parser-readline'),
    ]);

    serialSupportError = null;

    return { SerialPort, ReadlineParser };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No se pudo cargar serialport';

    serialSupportError = message;
    throw new Error(
      `SerialPort no est\u00e1 disponible en este entorno: ${message}`
    );
  }
}

function extractWeight(line: string): number | null {
  const clean = line.trim().replace(',', '.');
  const match = clean.match(/-?\d+(?:\.\d+)?/);

  if (!match) return null;

  const value = parseFloat(match[0]);
  if (Number.isNaN(value)) return null;

  return value;
}

export async function connectScale() {
  if (connected && port) {
    return { connected: true, message: 'Ya est\u00e1 conectada' };
  }

  const { SerialPort, ReadlineParser } = await loadSerialModules();

  port = new SerialPort({
    path: 'COM5',
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    autoOpen: false,
  });

  parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

  parser.on('data', (line: string) => {
    latestRawLine = line;
    const weight = extractWeight(line);
    if (weight !== null) {
      latestWeight = weight;
    }
  });

  port.on('error', (err: Error) => {
    console.error('Error serial:', err.message);
    connected = false;
  });

  port.on('close', () => {
    connected = false;
  });

  await new Promise<void>((resolve, reject) => {
    port!.open((err) => {
      if (err) return reject(err);
      connected = true;
      resolve();
    });
  });

  return { connected: true, message: 'Balanza conectada en COM5' };
}

export async function disconnectScale() {
  if (!port || !connected) {
    connected = false;
    return { connected: false, message: 'Ya estaba desconectada' };
  }

  await new Promise<void>((resolve, reject) => {
    port!.close((err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  port = null;
  parser = null;
  connected = false;

  return { connected: false, message: 'Balanza desconectada' };
}

export function getScaleState() {
  return {
    connected,
    latestWeight,
    latestRawLine,
    serialAvailable: serialSupportError === null,
    serialError: serialSupportError,
  };
}
