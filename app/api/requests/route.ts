import { NextResponse } from 'next/server';
import { callConnector } from '../../../lib/appsScript';

export const runtime = 'nodejs';

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === 'string' ? entry.trim() : '';
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const data = await callConnector<{ requestId: string; status: string }>('createRequest', {
      requestType: value(formData, 'requestType'),
      buyerName: value(formData, 'buyerName'),
      buyerEmail: value(formData, 'buyerEmail'),
      datePurchased: value(formData, 'datePurchased'),
      need: value(formData, 'need'),
      vendorName: value(formData, 'vendorName'),
      itemPurchased: value(formData, 'itemPurchased'),
      actualAmount: value(formData, 'actualAmount'),
      receiptLink: value(formData, 'receiptLink'),
      notes: value(formData, 'notes')
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
