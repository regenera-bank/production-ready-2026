import { useMemo, useState } from 'react';
import { ApiDocsPanel } from './components/ApiDocsPanel';
import { SandboxKeysPanel } from './components/SandboxKeysPanel';
import { WebhookTesterPanel } from './components/WebhookTesterPanel';
import { issueToken } from './platform/api-client';

type Tab = 'docs' | 'keys' | 'webhooks';

export function App() {
  const [tab, setTab] = useState<Tab>('docs');
  const [clientId, setClientId] = useState('sandbox-client-001');
  const [clientSecret, setClientSecret] = useState('sandbox-secret-001');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const authorized = useMemo(() => Boolean(token), [token]);

  async function authenticate() {
    setError('');
    try {
      const response = await issueToken(clientId, clientSecret);
      setToken(response.access_token);
    } catch (err) {
      setToken('');
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.25rem 3rem' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--primary)', margin: 0, fontWeight: 600 }}>Regenera Bank</p>
        <h1 style={{ margin: '0.25rem 0 0.5rem', fontSize: '2rem' }}>Partner Developer Portal</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          API docs, sandbox credentials, and webhook testing for Partner API v1.
        </p>
      </header>

      <section
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '1rem',
          marginBottom: '1rem',
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Sandbox authentication</h2>
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr 1fr auto' }}>
          <input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="client_id" />
          <input
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder="client_secret"
            type="password"
          />
          <button className="primary" onClick={authenticate}>
            Get token
          </button>
        </div>
        {error ? <p style={{ color: '#f87171' }}>{error}</p> : null}
        {authorized ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            Token acquired. Scopes are enforced by the facade.
          </p>
        ) : null}
      </section>

      <nav style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {([
          ['docs', 'API Docs'],
          ['keys', 'Sandbox Keys'],
          ['webhooks', 'Webhook Tester'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? 'primary' : undefined}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'docs' ? <ApiDocsPanel /> : null}
      {tab === 'keys' ? <SandboxKeysPanel token={token} /> : null}
      {tab === 'webhooks' ? <WebhookTesterPanel token={token} /> : null}
    </div>
  );
}