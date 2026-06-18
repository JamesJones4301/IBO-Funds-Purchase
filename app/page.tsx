'use client';

import { useState } from 'react';

export default function HomePage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submitRequest(formData: FormData) {
    setStatus('sending');
    setMessage('');

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error || 'Request could not be submitted.');
        return;
      }

      setStatus('success');
      setMessage('Request submitted. Request ID: ' + data.requestId);
      const form = document.getElementById('requestForm') as HTMLFormElement | null;
      form?.reset();
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Request could not be submitted.');
    }
  }

  return (
    <main>
      <div className="card">
        <h1>In Becoming One Funds Approval</h1>
        <p className="notice">Submit this form before using IBO funds. If the buyer is a board member, the two other board members must approve before purchase.</p>

        {status === 'success' && <p className="success">{message}</p>}
        {status === 'error' && <p className="error">{message}</p>}

        <form id="requestForm" action={submitRequest}>
          <label htmlFor="requestType">Request Type</label>
          <select id="requestType" name="requestType" required defaultValue="">
            <option value="" disabled>Select request type</option>
            <option value="New Request">New Request</option>
            <option value="Receipt Submission">Receipt Submission</option>
            <option value="Reimbursement">Reimbursement</option>
          </select>

          <div className="row">
            <div>
              <label htmlFor="buyerName">Buyer Name</label>
              <input id="buyerName" name="buyerName" required />
            </div>
            <div>
              <label htmlFor="buyerEmail">Buyer Email</label>
              <input id="buyerEmail" name="buyerEmail" type="email" required />
            </div>
          </div>

          <div className="row">
            <div>
              <label htmlFor="datePurchased">Date Purchased or Needed</label>
              <input id="datePurchased" name="datePurchased" type="date" />
            </div>
            <div>
              <label htmlFor="actualAmount">Actual or Estimated Amount</label>
              <input id="actualAmount" name="actualAmount" inputMode="decimal" required />
            </div>
          </div>

          <label htmlFor="need">Why does the buyer need to purchase?</label>
          <textarea id="need" name="need" required />

          <div className="row">
            <div>
              <label htmlFor="vendorName">Vendor Name</label>
              <input id="vendorName" name="vendorName" required />
            </div>
            <div>
              <label htmlFor="itemPurchased">Item Purchased or Requested</label>
              <input id="itemPurchased" name="itemPurchased" required />
            </div>
          </div>

          <label htmlFor="receiptLink">Receipt Link</label>
          <input
            id="receiptLink"
            name="receiptLink"
            type="url"
            placeholder="Paste Google Drive receipt link here"
          />
          <p className="notice">Upload receipts to the IBO Purchase Receipts Google Drive folder, then paste the share link here.</p>

          <label htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" />

          <div className="actions">
            <button className="primary" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
