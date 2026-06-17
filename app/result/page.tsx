export default async function ResultPage({ searchParams }: { searchParams: Promise<{ status?: string; requestId?: string; final?: string }> }) {
  const params = await searchParams;
  const status = params.status || 'Submitted';
  const requestId = params.requestId || '';
  const final = params.final || '';

  return (
    <main>
      <div className="card">
        <h1>Decision Recorded</h1>
        <p className="success">Your decision was recorded as: <b>{status}</b>.</p>
        {requestId && <p>Request ID: <b>{requestId}</b></p>}
        {final && <p>Current request status: <b>{final}</b></p>}
        <p>You may close this page.</p>
      </div>
    </main>
  );
}
