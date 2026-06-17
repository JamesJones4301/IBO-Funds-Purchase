import { google } from 'googleapis';
import { Readable } from 'stream';

const REQUESTS_SHEET = 'Requests';
const DECISIONS_SHEET = 'Decisions';

export type PurchaseRequest = {
  requestId: string;
  createdAt: string;
  buyerName: string;
  buyerEmail: string;
  datePurchased: string;
  need: string;
  vendorName: string;
  itemPurchased: string;
  actualAmount: string;
  receiptUrl: string;
  notes: string;
  status: string;
  approvalCount: string;
  rejectionCount: string;
  finalDecisionAt: string;
};

export type DecisionRecord = {
  requestId: string;
  approverName: string;
  approverEmail: string;
  token: string;
  decision: string;
  comment: string;
  decisionDate: string;
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function getAuth() {
  const clientEmail = requireEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKey = requireEnv('GOOGLE_PRIVATE_KEY').replace(/\\n/g, '\n');

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file'
    ]
  });
}

export function getSheetId() {
  return requireEnv('GOOGLE_SHEET_ID');
}

function sheetsClient() {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

function driveClient() {
  return google.drive({ version: 'v3', auth: getAuth() });
}

export async function ensureSheetsExist() {
  const sheets = sheetsClient();
  const spreadsheetId = getSheetId();
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = new Set((spreadsheet.data.sheets || []).map(s => s.properties?.title));
  const requests: any[] = [];

  if (!existing.has(REQUESTS_SHEET)) requests.push({ addSheet: { properties: { title: REQUESTS_SHEET } } });
  if (!existing.has(DECISIONS_SHEET)) requests.push({ addSheet: { properties: { title: DECISIONS_SHEET } } });

  if (requests.length) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
  }

  await setHeaders();
}

async function setHeaders() {
  const sheets = sheetsClient();
  const spreadsheetId = getSheetId();

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${REQUESTS_SHEET}!A1:O1`,
    valueInputOption: 'RAW',
    requestBody: { values: [[
      'Request ID', 'Created At', 'Buyer Name', 'Buyer Email', 'Date Purchased',
      'Why Buyer Needs Purchase', 'Vendor Name', 'Item Purchased', 'Actual Amount',
      'Receipt URL', 'Notes', 'Status', 'Approval Count', 'Rejection Count', 'Final Decision At'
    ]] }
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${DECISIONS_SHEET}!A1:G1`,
    valueInputOption: 'RAW',
    requestBody: { values: [[
      'Request ID', 'Approver Name', 'Approver Email', 'Token', 'Decision', 'Comment', 'Decision Date'
    ]] }
  });
}

export async function appendRequest(request: PurchaseRequest) {
  const sheets = sheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: `${REQUESTS_SHEET}!A:O`,
    valueInputOption: 'RAW',
    requestBody: { values: [[
      request.requestId, request.createdAt, request.buyerName, request.buyerEmail,
      request.datePurchased, request.need, request.vendorName, request.itemPurchased,
      request.actualAmount, request.receiptUrl, request.notes, request.status,
      request.approvalCount, request.rejectionCount, request.finalDecisionAt
    ]] }
  });
}

export async function appendDecision(decision: DecisionRecord) {
  const sheets = sheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: `${DECISIONS_SHEET}!A:G`,
    valueInputOption: 'RAW',
    requestBody: { values: [[
      decision.requestId, decision.approverName, decision.approverEmail,
      decision.token, decision.decision, decision.comment, decision.decisionDate
    ]] }
  });
}

export async function getRequestById(requestId: string) {
  const sheets = sheetsClient();
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `${REQUESTS_SHEET}!A2:O`
  });

  const rows = result.data.values || [];
  const index = rows.findIndex(row => row[0] === requestId);
  if (index === -1) return null;
  return { rowNumber: index + 2, request: rowToRequest(rows[index]) };
}

export async function getDecisionByToken(requestId: string, token: string) {
  const sheets = sheetsClient();
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `${DECISIONS_SHEET}!A2:G`
  });

  const rows = result.data.values || [];
  const index = rows.findIndex(row => row[0] === requestId && row[3] === token);
  if (index === -1) return null;
  return { rowNumber: index + 2, decision: rowToDecision(rows[index]) };
}

export async function updateDecision(rowNumber: number, decision: string, comment: string) {
  const sheets = sheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range: `${DECISIONS_SHEET}!E${rowNumber}:G${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[decision, comment, new Date().toISOString()]] }
  });
}

export async function getDecisionsForRequest(requestId: string) {
  const sheets = sheetsClient();
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `${DECISIONS_SHEET}!A2:G`
  });

  return (result.data.values || []).filter(row => row[0] === requestId).map(rowToDecision);
}

export async function updateRequestStatus(rowNumber: number, status: string, approvalCount: number, rejectionCount: number) {
  const sheets = sheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range: `${REQUESTS_SHEET}!L${rowNumber}:O${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[status, String(approvalCount), String(rejectionCount), status === 'Pending' ? '' : new Date().toISOString()]] }
  });
}

function rowToRequest(row: string[]): PurchaseRequest {
  return {
    requestId: row[0] || '', createdAt: row[1] || '', buyerName: row[2] || '', buyerEmail: row[3] || '',
    datePurchased: row[4] || '', need: row[5] || '', vendorName: row[6] || '', itemPurchased: row[7] || '',
    actualAmount: row[8] || '', receiptUrl: row[9] || '', notes: row[10] || '', status: row[11] || '',
    approvalCount: row[12] || '0', rejectionCount: row[13] || '0', finalDecisionAt: row[14] || ''
  };
}

function rowToDecision(row: string[]): DecisionRecord {
  return {
    requestId: row[0] || '', approverName: row[1] || '', approverEmail: row[2] || '', token: row[3] || '',
    decision: row[4] || '', comment: row[5] || '', decisionDate: row[6] || ''
  };
}

export async function uploadReceiptToDrive(file: File, requestId: string) {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) return '';

  const bytes = Buffer.from(await file.arrayBuffer());
  const stream = Readable.from(bytes);
  const drive = driveClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

  const upload = await drive.files.create({
    requestBody: { name: `${requestId}-${safeName}`, parents: [folderId] },
    media: { mimeType: file.type || 'application/octet-stream', body: stream },
    fields: 'id, webViewLink'
  });

  return upload.data.webViewLink || '';
}
