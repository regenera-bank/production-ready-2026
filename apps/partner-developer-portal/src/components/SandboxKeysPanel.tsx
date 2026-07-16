import { useEffect, useState } from 'react';
import { createSandboxKey, listSandboxKeys, type SandboxKey } from '../platform/api-client';
import { PARTNER_SCOPES } from '../platform/api-docs';

type Props = { token: string };

export function SandboxKeysPanel({ token }: Props) {
  const [keys, setKeys] = useState<SandboxKey[]>([]);
  const [name, setName] = useState('Integration Key');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['pix:read', 'pix:write']);
  const [createdSecret, setCreatedSecret] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    listSandboxKeys(token)
      .then(setKeys)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load keys'));
  }, [token]);

  async function onCreate() {
    if (!token) return;
    setError('');
    try {
      const created = await createSandboxKey(token, { name, scopes: selectedScopes });
      setCreatedSecret(created.clientSecret ?? '');
      const refreshed = await listSandboxKeys(token);
      setKeys(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create key');
    }
  }

  function toggleScope(scope: string) {
    setSelectedScopes((current) =>
      current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope],
    );
  }

  if (!token) {
    return <p style={{ color: 'var(--muted)' }}>Authenticate to manage sandbox keys.</p>;
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <section
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '1rem',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Existing keys</h2>
        {keys.length === 0 ? <p style={{ color: 'var(--muted)' }}>No keys yet.</p> : null}
        <ul>
          {keys.map((key) => (
            <li key={key.id}>
              <strong>{key.name}</strong> — <code>{key.clientId}</code> ({key.scopes.join(', ')})
            </li>
          ))}
        </ul>
      </section>

      <section
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '1rem',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Create sandbox key</h2>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Key name" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {PARTNER_SCOPES.map((scope) => (
              <label key={scope} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedScopes.includes(scope)}
                  onChange={() => toggleScope(scope)}
                />
                <code>{scope}</code>
              </label>
            ))}
          </div>
          <button className="primary" onClick={onCreate}>
            Create key
          </button>
        </div>
        {createdSecret ? (
          <p>
            Secret (shown once): <code>{createdSecret}</code>
          </p>
        ) : null}
        {error ? <p style={{ color: '#f87171' }}>{error}</p> : null}
      </section>
    </div>
  );
}