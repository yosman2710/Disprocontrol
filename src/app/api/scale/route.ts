import { NextResponse } from 'next/server';
import { connectScale, disconnectScale, getScaleState } from '@/lib/scalePort';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = getScaleState();
    return NextResponse.json(state);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Error leyendo balanza';

    return NextResponse.json(
      { error: message },
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

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Error en la balanza';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
