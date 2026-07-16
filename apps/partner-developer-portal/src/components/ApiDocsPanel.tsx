import { API_ENDPOINTS, PARTNER_SCOPES, WEBHOOK_EVENTS } from '../platform/api-docs';

export function ApiDocsPanel() {
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
        <h2 style={{ marginTop: 0 }}>Contract references</h2>
        <ul style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
          <li>
            <code>contracts/openapi/partner-api-v1.openapi.yaml</code>
          </li>
          <li>
            <code>contracts/asyncapi/partner-webhooks-v1.asyncapi.yaml</code>
          </li>
          <li>
            <code>governance/error-catalog/CORE-ERRORS.json</code>
          </li>
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
        <h2 style={{ marginTop: 0 }}>OAuth scopes</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {PARTNER_SCOPES.map((scope) => (
            <code
              key={scope}
              style={{
                background: '#0b1220',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '0.25rem 0.5rem',
              }}
            >
              {scope}
            </code>
          ))}
        </div>
      </section>

      <section
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '1rem',
        }}
      >
        <h2 style={{ marginTop: 0 }}>REST endpoints</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
              <th>Method</th>
              <th>Path</th>
              <th>Scope</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            {API_ENDPOINTS.map((endpoint) => (
              <tr key={`${endpoint.method}-${endpoint.path}`} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '0.5rem 0' }}>
                  <code>{endpoint.method}</code>
                </td>
                <td>
                  <code>{endpoint.path}</code>
                </td>
                <td>
                  <code>{endpoint.scope}</code>
                </td>
                <td style={{ color: 'var(--muted)' }}>{endpoint.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '1rem',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Webhook events</h2>
        <p style={{ color: 'var(--muted)' }}>
          Deliveries are signed with HMAC-SHA256 over <code>{'{timestamp}.{body}'}</code>.
        </p>
        <ul>
          {WEBHOOK_EVENTS.map((event) => (
            <li key={event}>
              <code>{event}</code>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}