import { NextResponse } from 'next/server';
import { callConnector } from '../../../lib/appsScript';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const requestId = String(formData.get('requestId') || '').trim();
    const token = String(formData.get('token') || '').trim();
    const decision = String(formData.get('decision') || '').trim();
    const comment = String(formData.get('comment') || '').trim();

    if (!requestId || !token || !decision) {
      return NextResponse.json({ error: 'Missing approval information.' }, { status: 400 });
    }

    if (decision === 'Rejected' && !comment) {
      return NextResponse.json({ error: 'A rejection comment is required.' }, { status: 400 });
    }

    const data = await callConnector<{ finalStatus: string }>('decide', {
      requestId,
      token,
      decision,
      comment
    });

    const redirectUrl = new URL('/result', request.url);
    redirectUrl.searchParams.set('status', decision);
    redirectUrl.searchParams.set('requestId', requestId);
    redirectUrl.searchParams.set('final', data.finalStatus);

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
