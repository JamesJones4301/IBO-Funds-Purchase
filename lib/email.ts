import nodemailer from 'nodemailer';
import { BOARD_MEMBERS, baseUrl } from './config';
import type { PurchaseRequest, DecisionRecord } from './google';

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function transporter() {
  return nodemailer.createTransport({
    host: requireEnv('SMTP_HOST'),
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: requireEnv('SMTP_USER'),
      pass: requireEnv('SMTP_PASS')
    }
  });
}

function money(value: string) {
  if (!value) return '$0.00';
  const number = Number(value);
  if (Number.isNaN(number)) return `$${value}`;
  return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export async function sendApprovalEmail(request: PurchaseRequest, decision: DecisionRecord) {
  const approvalUrl = `${baseUrl()}/approve?requestId=${encodeURIComponent(request.requestId)}&token=${encodeURIComponent(decision.token)}`;

  const html = `
    <div style="font-family:Arial,sans-serif;color:#222;font-size:15px;line-height:1.5">
      <h2 style="color:#1f4e79">IBO Funds Approval Needed</h2>
      <p>Hello ${decision.approverName},</p>
      <p>${request.buyerName} submitted a funds request for In Becoming One.</p>
      <p><b>A board member needs approval from 2 other board members before making a purchase.</b></p>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:720px">
        <tr><td><b>Request ID</b></td><td>${request.requestId}</td></tr>
        <tr><td><b>Buyer</b></td><td>${request.buyerName}</td></tr>
        <tr><td><b>Buyer Email</b></td><td>${request.buyerEmail}</td></tr>
        <tr><td><b>Date Purchased</b></td><td>${request.datePurchased || 'Not purchased yet'}</td></tr>
        <tr><td><b>Why Needed</b></td><td>${request.need}</td></tr>
        <tr><td><b>Vendor</b></td><td>${request.vendorName}</td></tr>
        <tr><td><b>Item</b></td><td>${request.itemPurchased}</td></tr>
        <tr><td><b>Actual Amount</b></td><td>${money(request.actualAmount)}</td></tr>
        <tr><td><b>Notes</b></td><td>${request.notes || ''}</td></tr>
      </table>
      <p style="margin-top:22px">
        <a href="${approvalUrl}" style="background:#1f4e79;color:#fff;padding:12px 18px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block">Review Request</a>
      </p>
      <p>If the button does not work, copy this link into your browser:</p>
      <p>${approvalUrl}</p>
    </div>`;

  await transporter().sendMail({
    from: requireEnv('SMTP_FROM'),
    to: decision.approverEmail,
    subject: `IBO Approval Needed: ${request.itemPurchased} - ${money(request.actualAmount)}`,
    html,
    text: `IBO approval needed for ${request.itemPurchased}. Review here: ${approvalUrl}`
  });
}

export async function sendBuyerReceivedEmail(request: PurchaseRequest) {
  const html = `
    <div style="font-family:Arial,sans-serif;color:#222;font-size:15px;line-height:1.5">
      <h2 style="color:#1f4e79">IBO Request Received</h2>
      <p>Hello ${request.buyerName},</p>
      <p>Your IBO funds request was received and sent for board approval.</p>
      <p><b>Do not purchase with IBO funds until 2 eligible board members approve.</b></p>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:720px">
        <tr><td><b>Request ID</b></td><td>${request.requestId}</td></tr>
        <tr><td><b>Vendor</b></td><td>${request.vendorName}</td></tr>
        <tr><td><b>Item</b></td><td>${request.itemPurchased}</td></tr>
        <tr><td><b>Actual Amount</b></td><td>${money(request.actualAmount)}</td></tr>
        <tr><td><b>Why Needed</b></td><td>${request.need}</td></tr>
      </table>
    </div>`;

  await transporter().sendMail({
    from: requireEnv('SMTP_FROM'),
    to: request.buyerEmail,
    subject: `IBO Request Received: ${request.requestId}`,
    html,
    text: `Your IBO request was received. Request ID: ${request.requestId}. Do not purchase until 2 eligible board members approve.`
  });
}

export async function sendFinalDecisionEmail(request: PurchaseRequest, finalStatus: string, decisions: DecisionRecord[]) {
  const decisionRows = decisions.map(d => `<tr><td>${d.approverName}</td><td>${d.decision}</td><td>${d.comment || ''}</td></tr>`).join('');

  const html = `
    <div style="font-family:Arial,sans-serif;color:#222;font-size:15px;line-height:1.5">
      <h2 style="color:#1f4e79">IBO Request ${finalStatus}</h2>
      <p>Request <b>${request.requestId}</b> has a final status of <b>${finalStatus}</b>.</p>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:720px">
        <tr><td><b>Buyer</b></td><td>${request.buyerName}</td></tr>
        <tr><td><b>Item</b></td><td>${request.itemPurchased}</td></tr>
        <tr><td><b>Vendor</b></td><td>${request.vendorName}</td></tr>
        <tr><td><b>Amount</b></td><td>${money(request.actualAmount)}</td></tr>
        <tr><td><b>Receipt</b></td><td>${request.receiptUrl ? `<a href="${request.receiptUrl}">View receipt</a>` : 'No receipt uploaded'}</td></tr>
      </table>
      <h3>Board Decisions</h3>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:720px">
        <tr><td><b>Board Member</b></td><td><b>Decision</b></td><td><b>Comment</b></td></tr>
        ${decisionRows}
      </table>
    </div>`;

  await transporter().sendMail({
    from: requireEnv('SMTP_FROM'),
    to: request.buyerEmail,
    cc: BOARD_MEMBERS.map(member => member.email).join(','),
    subject: `IBO Request ${finalStatus}: ${request.requestId}`,
    html,
    text: `IBO request ${request.requestId} is ${finalStatus}.`
  });
}
