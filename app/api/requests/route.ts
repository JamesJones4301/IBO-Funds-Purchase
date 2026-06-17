import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { APPROVALS_REQUIRED, getApproversForBuyer } from '../../../lib/config';
import { appendDecision, appendRequest, ensureSheetsExist, uploadReceiptToDrive, type DecisionRecord, type PurchaseRequest } from '../../../lib/google';
import { sendApprovalEmail, sendBuyerReceivedEmail } from '../../../lib/email';

export const runtime = 'nodejs';

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === 'string' ? entry.trim() : '';
}

function createRequestId() {
  const date = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `IBO-${date}-${random}`;
}

export async function POST(request: Request) {
  try {
    await ensureSheetsExist();

    const formData = await request.formData();
    const requestId = createRequestId();
    const receipt = formData.get('receipt');
    let receiptUrl = '';

    if (receipt instanceof File && receipt.size > 0) {
      receiptUrl = await uploadReceiptToDrive(receipt, requestId);
    }

    const purchaseRequest: PurchaseRequest = {
      requestId,
      createdAt: new Date().toISOString(),
      buyerName: value(formData, 'buyerName'),
      buyerEmail: value(formData, 'buyerEmail'),
      datePurchased: value(formData, 'datePurchased'),
      need: value(formData, 'need'),
      vendorName: value(formData, 'vendorName'),
      itemPurchased: value(formData, 'itemPurchased'),
      actualAmount: value(formData, 'actualAmount'),
      receiptUrl,
      notes: value(formData, 'notes'),
      status: 'Pending',
      approvalCount: '0',
      rejectionCount: '0',
      finalDecisionAt: ''
    };

    if (!purchaseRequest.buyerName || !purchaseRequest.buyerEmail || !purchaseRequest.need || !purchaseRequest.vendorName || !purchaseRequest.itemPurchased || !purchaseRequest.actualAmount) {
      return NextResponse.json({ error: 'Please complete all required fields.' }, { status: 400 });
    }

    await appendRequest(purchaseRequest);

    const approvers = getApproversForBuyer(purchaseRequest.buyerEmail);
    if (approvers.length < APPROVALS_REQUIRED) {
      return NextResponse.json({ error: 'Not enough eligible board members to approve this request.' }, { status: 400 });
    }

    for (const approver of approvers) {
      const decision: DecisionRecord = {
        requestId,
        approverName: approver.name,
        approverEmail: approver.email,
        token: crypto.randomUUID(),
        decision: 'Pending',
        comment: '',
        decisionDate: ''
      };

      await appendDecision(decision);
      await sendApprovalEmail(purchaseRequest, decision);
    }

    await sendBuyerReceivedEmail(purchaseRequest);

    return NextResponse.json({ requestId, status: 'Pending' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
