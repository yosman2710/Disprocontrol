import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

let port: SerialPort | null = null;
let parser: ReadlineParser | null = null;
let latestWeight = 0;
let latestRawLine = '';
let connected = false;

function extractWeight(line: string): number | null {
  // Limpia la línea y busca un número como 452.30 o 452,30
  const clean = line.trim().replace(',', '.');

  // Ejemplos que soporta:
  // "452.30"
  // "PESO: 452.30 kg"
  // "ST,GS,452.30,kg"
  const match = clean.match(/-?\d+(?:\.\d+)?/);

  if (!match) return null;

  const value = parseFloat(match[0]);
  if (Number.isNaN(value)) return null;

  return value;
}

export async function connectScale() {
  if (connected && port) {
    return { connected: true, message: 'Ya está conectada' };
  }

  port = new SerialPort({
    path: 'COM5',
    baudRate: 9600,   // <- cámbialo si tu balanza usa otro
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

  port.on('error', (err) => {
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
  };
}