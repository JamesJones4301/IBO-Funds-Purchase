# In Becoming One Funds Approval

This is a Vercel approval page that uses Google Apps Script as the simple connector to Google Sheets, Google Drive, and Gmail.

## Workflow

1. Buyer submits a funds request in Vercel.
2. Vercel sends the request to Apps Script.
3. Apps Script creates a Request ID.
4. Apps Script saves the request to Google Sheets.
5. Apps Script saves the receipt to Google Drive when one is uploaded.
6. If the buyer is a board member, the two other board members receive approval emails.
7. If the buyer is not a board member, all three board members receive approval emails.
8. The request is approved after 2 eligible board approvals.
9. Any rejection rejects the request.
10. Approval and rejection comments are saved to Google Sheets.

## Board emails

- James: james@proverbs31landsphere.com
- Jayda: mrsjaydaflores@gmail.com
- Lawanda: lawanda@proverbs31landsphere.com

## Vercel environment variables

Only three variables are required:

```text
NEXT_PUBLIC_BASE_URL=https://your-vercel-app.vercel.app
APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
IBO_CONNECTOR_KEY=choose-a-private-key-here
```

`IBO_CONNECTOR_KEY` must match `CONNECTOR_KEY` in Apps Script.

## Setup order

1. Paste the Apps Script code into the Google Sheet.
2. Deploy Apps Script as a Web App.
3. Copy the Apps Script Web App URL.
4. Add Vercel environment variables.
5. Deploy Vercel.
6. Copy the Vercel URL.
7. Put the Vercel URL in Apps Script as `VERCEL_BASE_URL`.
8. Redeploy Apps Script.
9. Update `NEXT_PUBLIC_BASE_URL` in Vercel to the final Vercel URL.
10. Redeploy Vercel.

## Google Sheet

The Apps Script uses this Google Sheet:

```text
1wgUHosxyBpMQ9-xD3t3mM9z4ykhrG5_7-2RnvXsB5Tg
```

The Apps Script creates these tabs:

- Requests
- Decisions

## Google Drive receipt folder

The Apps Script saves receipts here:

```text
1Vd5c-HPC8FMvCrrhxOK5zRGI2NA1y-n9
```

## Important nonprofit control

Do not purchase with IBO funds until the request shows Approved in Google Sheets. A buyer who is also a board member cannot approve their own request because Apps Script excludes the buyer email from the approver list.
