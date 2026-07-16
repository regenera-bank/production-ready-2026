import { useEffect, useState } from 'react';
import {
  listWebhookSubscriptions,
  registerWebhook,
  testWebhook,
  type WebhookSubscription,
} from '../platform/api-client';
import { WEBHOOK_EVENTS } from '../platform/api-docs';

type Props = { token: string };

export function WebhookTesterPanel({ token }: Props) {
  const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);
  const [url, setUrl] = useState('https://webhook.site/test-endpoint');
  const [eventType, setEventType] = useState<string>(WEBHOOK_EVENTS[0]);
  const [selectedSubscription, setSelectedSubscription] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    listWebhookSubscriptions(token)
      .then((items) => {
        setSubscriptions(items);
        if (items[0]) setSelectedSubscription(items[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load subscriptions'));
  }, [token]);

  async function onRegister() {
    if (!token) return;
    setError('');
    try {
      const created = await registerWebhook(token, {
        url,
        events: [eventType],
      });
      const refreshed = await listWebhookSubscriptions(token);
      setSubscriptions(refreshed);
      setSelectedSubscription(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register webhook');
    }
  }

  async function onTest() {
    if (!token || !selectedSubscription) return;
    setError('');
    try {
      const delivery = await testWebhook(token, {
        subscriptionId: selectedSubscription,
        eventType,
      });
      setResult(JSON.stringify(delivery, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Webhook test failed');
    }
  }

  if (!token) {
    return <p style={{ color: 'var(--muted)' }}>Authenticate to test webhooks.</p>;
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
        <h2 style={{ marginTop: 0 }}>Register endpoint</h2>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
            {WEBHOOK_EVENTS.map((event) => (
              <option key={event} value={event}>
                {event}
              </option>
            ))}
          </select>
          <button className="primary" onClick={onRegister}>
            Register webhook
          </button>
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
        <h2 style={{ marginTop: 0 }}>Test delivery</h2>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <select
            value={selectedSubscription}
            onChange={(e) => setSelectedSubscription(e.target.value)}
          >
            {subscriptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.url} ({item.events.join(', ')})
              </option>
            ))}
          </select>
          <button onClick={onTest}>Send test event</button>
        </div>
        {result ? (
          <pre
            style={{
              marginTop: '1rem',
              background: '#0b1220',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '0.75rem',
              overflowX: 'auto',
            }}
          >
            {result}
          </pre>
        ) : null}
        {error ? <p style={{ color: '#f87171' }}>{error}</p> : null}
      </section>
    </div>
  );
}