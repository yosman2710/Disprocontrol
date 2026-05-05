import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Scale API moved to Web Serial' });
}
