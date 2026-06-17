import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { APPROVALS_REQUIRED } from '../../../lib/config';
import { getDecisionByToken, getDecisionsForRequest, getRequestById, updateDecision, updateRequestStatus } from '../../../lib/google';
import { sendFinalDecisionEmail } from '../../../lib/email';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const formData = await request.formData();
  const requestId = String(formData.get('requestId') || '').trim();
  const token = String(formData.get('token') || '').trim();
  const decision = String(formData.get('decision') || '').trim();
  const comment = String(formData.get('comment') || '').trim();

  if (!requestId || !token || !decision) {
    return NextResponse.json({ error: 'Missing approval information.' }, { status: 400 });
  }

  if (decision !== 'Approved' && decision !== 'Rejected') {
    return NextResponse.json({ error: 'Invalid decision.' }, { status: 400 });
  }

  if (decision === 'Rejected' && !comment) {
    return NextResponse.json({ error: 'A rejection comment is required.' }, { status: 400 });
  }

  const requestData = await getRequestById(requestId);
  const decisionData = await getDecisionByToken(requestId, token);

  if (!requestData || !decisionData) {
    return NextResponse.json({ error: 'Approval link not found.' }, { status: 404 });
  }

  if (requestData.request.status !== 'Pending') {
    redirect(`/result?status=${encodeURIComponent(requestData.request.status)}&requestId=${encodeURIComponent(requestId)}`);
  }

  if (decisionData.decision.decision !== 'Pending') {
    redirect(`/result?status=Already%20Submitted&requestId=${encodeURIComponent(requestId)}`);
  }

  await updateDecision(decisionData.rowNumber, decision, comment);

  const decisions = await getDecisionsForRequest(requestId);
  const approvalCount = decisions.filter(item => item.decision === 'Approved').length;
  const rejectionCount = decisions.filter(item => item.decision === 'Rejected').length;

  let finalStatus = 'Pending';
  if (rejectionCount > 0) finalStatus = 'Rejected';
  if (approvalCount >= APPROVALS_REQUIRED) finalStatus = 'Approved';

  await updateRequestStatus(requestData.rowNumber, finalStatus, approvalCount, rejectionCount);

  if (finalStatus !== 'Pending') {
    await sendFinalDecisionEmail(requestData.request, finalStatus, decisions);
  }

  redirect(`/result?status=${encodeURIComponent(decision)}&requestId=${encodeURIComponent(requestId)}&final=${encodeURIComponent(finalStatus)}`);
}
