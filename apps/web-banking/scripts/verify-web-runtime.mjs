#!/usr/bin/env node
/**
 * Prova runtime :5176 (ou VITE_PORT) — HTML servido com CSP meta presente.
 * Não altera Firebase/Google/Raphaela — só verifica que o canal responde.
 */
const port = Number(process.env.VITE_PORT ?? 5176);
const bases = [
  `http://localhost:${port}`,
  `http://127.0.0.1:${port}`,
];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const probe = async () => {
  let lastErr;
  for (const base of bases) {
    try {
      const res = await fetch(base, { redirect: 'follow' });
      const html = await res.text();
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} em ${base}`);
      }
      if (!html.includes('Content-Security-Policy')) {
        throw new Error('CSP meta ausente no index.html servido');
      }
      if (!html.includes('verify.didit.me')) {
        throw new Error('CSP sem frame-src verify.didit.me — iframe KYC bloqueado');
      }
      if (!html.includes('Permissions-Policy') || !html.includes('https://verify.didit.me')) {
        throw new Error('Permissions-Policy sem delegação de câmera para verify.didit.me');
      }
      if (!html.includes('crossorigin="anonymous"')) {
        throw new Error('Fontes externas sem crossorigin (SRI-ready) no HTML servido');
      }
      if (!html.includes('id="root"')) {
        throw new Error('Shell React (#root) ausente');
      }
      return { status: res.status, port, base, csp: true, diditFrame: true };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error('Canal web inacessível');
};

const main = async () => {
  let lastErr;
  for (let i = 0; i < 30; i += 1) {
    try {
      const result = await probe();
      console.log(JSON.stringify({ verdict: 'PASS', ...result }));
      process.exit(0);
    } catch (err) {
      lastErr = err;
      await wait(1000);
    }
  }
  console.error(JSON.stringify({ verdict: 'FAIL', port, error: String(lastErr?.message ?? lastErr) }));
  process.exit(1);
};

void main();