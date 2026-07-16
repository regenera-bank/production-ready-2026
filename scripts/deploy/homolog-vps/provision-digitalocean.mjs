#!/usr/bin/env node
/**
 * Cria Droplet DigitalOcean para homolog Regenera.
 *
 * Pré-requisitos:
 *   1. Conta https://cloud.digitalocean.com
 *   2. API Token: Account → API → Generate New Token
 *   3. Chave SSH em Account → Security → SSH Keys (anote o ID numérico)
 *
 * Uso:
 *   DO_TOKEN=... DO_SSH_KEY_ID=12345678 node scripts/deploy/homolog-vps/provision-digitalocean.mjs
 */
const REGION = process.env.DO_REGION?.trim() || 'nyc3';
const SIZE = process.env.DO_SIZE?.trim() || 's-1vcpu-2gb';
const NAME = process.env.DO_DROPLET_NAME?.trim() || 'regenera-homolog';

async function main() {
  const token = process.env.DO_TOKEN?.trim();
  const sshKeyId = process.env.DO_SSH_KEY_ID?.trim();
  if (!token) {
    console.error('DO_TOKEN ausente — gere em cloud.digitalocean.com → API');
    process.exit(1);
  }
  if (!sshKeyId) {
    console.error('DO_SSH_KEY_ID ausente — Account → Security → SSH Keys');
    process.exit(1);
  }

  const body = {
    name: NAME,
    region: REGION,
    size: SIZE,
    image: 'ubuntu-24-04-x64',
    ssh_keys: [Number(sshKeyId)],
    tags: ['regenera', 'homolog'],
    user_data: `#cloud-config\npackage_update: true\npackages:\n  - git\n`,
  };

  const response = await fetch('https://api.digitalocean.com/v2/droplets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    console.error(`DigitalOcean HTTP ${response.status}: ${text}`);
    process.exit(1);
  }

  const data = JSON.parse(text);
  const droplet = data.droplet;
  console.log(`Droplet criado: ${droplet.name} (id ${droplet.id})`);
  console.log('Aguardando IP público...');

  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const poll = await fetch(`https://api.digitalocean.com/v2/droplets/${droplet.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pollData = await poll.json();
    const ip = pollData.droplet?.networks?.v4?.find((n) => n.type === 'public')?.ip_address;
    if (ip) {
      console.log('');
      console.log('=== SERVIDOR CRIADO ===');
      console.log(`IP público: ${ip}`);
      console.log('');
      console.log('GoDaddy → regenerabank.com → Registros DNS:');
      console.log(`  A  api  →  ${ip}`);
      console.log(`  A  app  →  ${ip}`);
      console.log('');
      console.log('SSH:');
      console.log(`  ssh root@${ip}`);
      console.log('');
      console.log('Na VPS:');
      console.log(`  git clone <repo> /opt/regenera-bank`);
      console.log('  bash scripts/deploy/homolog-vps/bootstrap-ubuntu.sh');
      return;
    }
  }

  console.error('Timeout aguardando IP — veja o painel DigitalOcean.');
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});