# In Becoming One Funds Approval

This is a Vercel-ready approval app for In Becoming One fund purchases.

## Workflow

1. Buyer submits a funds request.
2. Request ID is created automatically.
3. Request is saved to Google Sheets.
4. If the buyer is a board member, the two other board members receive approval emails.
5. If the buyer is not a board member, all three board members receive approval emails.
6. The request is approved after 2 eligible board approvals.
7. Any rejection rejects the request.
8. Approval and rejection comments are saved to Google Sheets.
9. Receipts upload to Google Drive when `GOOGLE_DRIVE_FOLDER_ID` is configured.

## Board emails

- James: james@proverbs31landsphere.com
- Jayda: mrsjaydaflores@gmail.com
- Lawanda: lawanda@proverbs31landsphere.com

## Google Sheet setup

Create a Google Sheet. Copy the Sheet ID from the URL.

Example URL:

```text
https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
```

Add the Sheet ID to Vercel as:

```text
GOOGLE_SHEET_ID=SHEET_ID_HERE
```

The app creates these tabs automatically:

- Requests
- Decisions

## Google service account setup

1. Create a Google Cloud project.
2. Enable Google Sheets API.
3. Enable Google Drive API.
4. Create a service account.
5. Create a JSON key.
6. Copy the service account email.
7. Share the Google Sheet with the service account email as Editor.
8. If using receipt uploads, create a Drive folder and share it with the service account email as Editor.

Use these Vercel environment variables:

```text
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEET_ID=
GOOGLE_DRIVE_FOLDER_ID=
```

For `GOOGLE_PRIVATE_KEY`, keep the `\n` line breaks inside the value.

## SMTP email setup

This app uses SMTP through Nodemailer.

For Gmail, create an app password and use:

```text
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="In Becoming One <your-email@gmail.com>"
```

## Vercel setup

1. Go to Vercel.
2. Add a new project.
3. Import this GitHub repository.
4. Add the environment variables from `.env.example`.
5. Deploy.
6. Copy the deployment URL.
7. Set `NEXT_PUBLIC_BASE_URL` to the live Vercel URL.
8. Redeploy.

## Local development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Important nonprofit control

Do not purchase with IBO funds until the request shows Approved in Google Sheets. A buyer who is also a board member cannot approve their own request because the app excludes the buyer email from the approver list.
