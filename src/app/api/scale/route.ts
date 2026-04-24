import { NextResponse } from 'next/server';
import { connectScale, disconnectScale, getScaleState, listAvailablePorts } from '@/lib/scalePort';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = getScaleState();
    return NextResponse.json(state);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error leyendo balanza' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body?.action;

    if (action === 'connect') {
      const result = await connectScale();
      return NextResponse.json(result);
    }

    if (action === 'disconnect') {
      const result = await disconnectScale();
      return NextResponse.json(result);
    }

    if (action === 'listPorts') {
      const ports = await listAvailablePorts();
      return NextResponse.json(ports);
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('API Scale Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error en la balanza' },
      { status: 500 }
    );
  }
}