import { callConnector } from '../../lib/appsScript';

type ApprovalDetails = {
  request: {
    requestId: string;
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
  };
  decision: {
    approverName: string;
    decision: string;
  };
};

export default async function ApprovePage({ searchParams }: { searchParams: Promise<{ requestId?: string; token?: string }> }) {
  const params = await searchParams;
  const requestId = params.requestId || '';
  const token = params.token || '';

  if (!requestId || !token) {
    return <main><div className="card"><h1>Approval Link Missing</h1><p className="error">This approval link is missing a request ID or token.</p></div></main>;
  }

  let details: ApprovalDetails;

  try {
    details = await callConnector<ApprovalDetails>('getRequest', { requestId, token });
  } catch (error) {
    return <main><div className="card"><h1>Approval Not Found</h1><p className="error">{error instanceof Error ? error.message : 'This approval link is not valid.'}</p></div></main>;
  }

  const request = details.request;
  const decision = details.decision;
  const alreadyDecided = decision.decision && decision.decision !== 'Pending';
  const isFinal = request.status && request.status !== 'Pending';

  return (
    <main>
      <div className="card">
        <h1>IBO Funds Approval Review</h1>
        <p className="notice">Reviewer: <b>{decision.approverName}</b>. Add a comment, then approve or reject.</p>

        {alreadyDecided && <p className="error">You already submitted this decision: {decision.decision}.</p>}
        {isFinal && <p className="error">This request already has a final status: {request.status}.</p>}

        <table className="table">
          <tbody>
            <tr><td>Request ID</td><td>{request.requestId}</td></tr>
            <tr><td>Buyer Name</td><td>{request.buyerName}</td></tr>
            <tr><td>Buyer Email</td><td>{request.buyerEmail}</td></tr>
            <tr><td>Date Purchased or Needed</td><td>{request.datePurchased || 'Not entered'}</td></tr>
            <tr><td>Why Buyer Needs Purchase</td><td>{request.need}</td></tr>
            <tr><td>Vendor Name</td><td>{request.vendorName}</td></tr>
            <tr><td>Item Purchased</td><td>{request.itemPurchased}</td></tr>
            <tr><td>Actual Amount</td><td>{request.actualAmount}</td></tr>
            <tr><td>Receipt</td><td>{request.receiptUrl ? <a href={request.receiptUrl}>View receipt</a> : 'No receipt uploaded'}</td></tr>
            <tr><td>Notes</td><td>{request.notes || 'None'}</td></tr>
            <tr><td>Status</td><td>{request.status}</td></tr>
          </tbody>
        </table>

        {!alreadyDecided && !isFinal && (
          <form action="/api/approve" method="POST">
            <input type="hidden" name="requestId" value={request.requestId} />
            <input type="hidden" name="token" value={token} />

            <label htmlFor="comment">Approval or Rejection Comment</label>
            <textarea id="comment" name="comment" placeholder="Add a note. Rejection comments are required." />

            <div className="actions">
              <button className="approve" name="decision" value="Approved" type="submit">Approve</button>
              <button className="reject" name="decision" value="Rejected" type="submit">Reject</button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
