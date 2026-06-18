import { NextResponse } from 'next/server';
import { callConnector } from '../../../lib/appsScript';

export const runtime = 'nodejs';

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === 'string' ? entry.trim() : '';
}

async function fileToPayload(file: File | null) {
  if (!file || file.size === 0) return null;
  const bytes = Buffer.from(await file.arrayBuffer());
  return {
    name: file.name,
    type: file.type || 'application/octet-stream',
    base64: bytes.toString('base64')
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const receipt = formData.get('receipt');

    const data = await callConnector<{ requestId: string; status: string }>('createRequest', {
      requestType: value(formData, 'requestType'),
      buyerName: value(formData, 'buyerName'),
      buyerEmail: value(formData, 'buyerEmail'),
      datePurchased: value(formData, 'datePurchased'),
      need: value(formData, 'need'),
      vendorName: value(formData, 'vendorName'),
      itemPurchased: value(formData, 'itemPurchased'),
      actualAmount: value(formData, 'actualAmount'),
      notes: value(formData, 'notes'),
      receipt: receipt instanceof File ? await fileToPayload(receipt) : null
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
