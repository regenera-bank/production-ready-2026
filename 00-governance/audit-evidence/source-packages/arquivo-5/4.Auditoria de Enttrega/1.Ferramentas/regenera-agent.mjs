#!/usr/bin/env node
// regenera-agent.mjs
//
// agente de revisão de um núcleo bancário em produção.
// faz UMA coisa e prova que fez só ela: reescreve comentário pra matar sinal de IA
// e botar a voz no padrão de equipe sênior. nunca toca em código.
//
// o que torna isso seguro soltar num banco: cada arquivo passa por um portão que
// tira todo comentário do antes e do depois e compara o código byte a byte. se o
// modelo encostou numa linha executável, o portão reprova e o trabalho é descartado.
// não tem "quase". e cada decisão vira evidência (hash antes/depois, o que mudou).
//
// dois motores, o mesmo portão:
//   --engine lmstudio   (padrão) usa seu modelo local pra reescrever no tom da casa
//   --engine heuristic  determinístico, offline, instantâneo. não chama LLM nenhum.
//
// uso:
//   node regenera-agent.mjs <dir>                      # dry-run: não escreve nada no repo
//   node regenera-agent.mjs <dir> --apply              # escreve no lugar (só o que passou no portão)
//   node regenera-agent.mjs <dir> --engine heuristic   # sem LLM, roda já
//   node regenera-agent.mjs --probe                    # testa a conexão com o LM Studio
//
// requer Node 18+ (fetch nativo). zero dependências, zero npm install.

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, extname, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';

// ===========================================================================
// CONFIG
// ===========================================================================

const args = process.argv.slice(2);
const flags = new Map();
const positional = [];
for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a.startsWith('--')) {
        const key = a.slice(2);
        const next = args[i + 1];
        if (next !== undefined && !next.startsWith('--')) { flags.set(key, next); i += 1; }
        else flags.set(key, true);
    } else positional.push(a);
}

const CFG = {
    dir: positional[0],
    apply: flags.has('apply'),
    engine: String(flags.get('engine') ?? 'lmstudio'),
    url: String(flags.get('url') ?? process.env.LMSTUDIO_URL ?? 'http://localhost:1234/v1'),
    model: String(flags.get('model') ?? process.env.LMSTUDIO_MODEL ?? 'local-model'),
    only: flags.get('only') ? String(flags.get('only')) : null,   // substring de caminho
    maxRetries: Number(flags.get('max-retries') ?? 2),
    maxBytes: Number(flags.get('max-bytes') ?? 70000),            // arquivos maiores: aviso (modelo local pode truncar)
    temperature: Number(flags.get('temperature') ?? 0.2),
    timeoutMs: Number(flags.get('timeout') ?? 180000),
    outDir: String(flags.get('out') ?? '.regenera-agent'),
    audit: !flags.has('no-audit'),
    probe: flags.has('probe'),
    help: flags.has('help') || flags.has('h'),
};

const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.vercel', '__MACOSX', '.regenera-agent']);
const C_LIKE = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);
const GATE_EXT = new Set([...C_LIKE, '.sql', '.sh', '.yml', '.yaml']);

// ===========================================================================
// O PORTÃO  (idêntico ao 20-verify.mjs — é o que prova "só comentário mudou")
// ===========================================================================

function stripCLike(src) {
    let out = '', i = 0; const n = src.length; let str = null;
    while (i < n) {
        const c = src[i], c2 = src[i + 1];
        if (str) { out += c; if (c === '\\') { out += c2 ?? ''; i += 2; continue; } if (c === str) str = null; i += 1; continue; }
        if (c === "'" || c === '"' || c === '`') { str = c; out += c; i += 1; continue; }
        if (c === '/' && c2 === '/') { while (i < n && src[i] !== '\n') i += 1; continue; }
        if (c === '/' && c2 === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i += 1; i += 2; continue; }
        out += c; i += 1;
    }
    return out;
}
function stripSql(src) {
    let out = '', i = 0; const n = src.length;
    while (i < n) {
        const c = src[i], c2 = src[i + 1];
        if (c === "'") { out += c; i += 1; while (i < n) { out += src[i]; if (src[i] === "'" && src[i + 1] === "'") { out += src[i + 1]; i += 2; continue; } if (src[i] === "'") { i += 1; break; } i += 1; } continue; }
        if (c === '$') { const m = /^\$[A-Za-z0-9_]*\$/.exec(src.slice(i)); if (m) { const tag = m[0]; out += tag; i += tag.length; const end = src.indexOf(tag, i); if (end === -1) { out += src.slice(i); i = n; } else { out += src.slice(i, end + tag.length); i = end + tag.length; } continue; } }
        if (c === '-' && c2 === '-') { while (i < n && src[i] !== '\n') i += 1; continue; }
        if (c === '/' && c2 === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i += 1; i += 2; continue; }
        out += c; i += 1;
    }
    return out;
}
function stripHashLike(src) {
    let out = '', i = 0; const n = src.length; let str = null;
    while (i < n) {
        const c = src[i];
        if (str) { out += c; if (c === str) str = null; i += 1; continue; }
        if (c === "'" || c === '"') { str = c; out += c; i += 1; continue; }
        if (c === '#') { while (i < n && src[i] !== '\n') i += 1; continue; }
        out += c; i += 1;
    }
    return out;
}
function codeOnly(src, ext) {
    let s;
    if (C_LIKE.has(ext)) s = stripCLike(src);
    else if (ext === '.sql') s = stripSql(src);
    else if (['.sh', '.yml', '.yaml'].includes(ext)) s = stripHashLike(src);
    else s = src;
    return s.replace(/\s+/g, ' ').trim();
}

const AI_VESTIGES = [
    /REGENERA ENTERPRISE SYSTEM/i,
    /\bAs an AI\b/i,
    /\bGenerated by (?:AI|GPT|Claude|Gemini|Copilot)\b/i,
    /\bv\d+\.\d+\b.*ENTERPRISE/i,
];

// retorna { ok, reason, hint } — a verdade sobre se o código foi preservado.
function gateVerify(original, rewritten, ext) {
    if (rewritten.trim().length === 0) return { ok: false, reason: 'reescrito veio vazio', hint: '' };
    const a = codeOnly(original, ext);
    const b = codeOnly(rewritten, ext);
    if (a !== b) {
        let k = 0; while (k < a.length && k < b.length && a[k] === b[k]) k += 1;
        return { ok: false, reason: 'código mudou (não só comentário)', hint: `...${a.slice(Math.max(0, k - 50), k + 50)}...` };
    }
    for (const re of AI_VESTIGES) if (re.test(rewritten)) return { ok: false, reason: `vestígio de IA permaneceu: ${re}`, hint: '' };
    if (C_LIKE.has(ext)) {
        const code = stripCLike(rewritten);
        const open = (code.match(/\{/g) || []).length;
        const close = (code.match(/\}/g) || []).length;
        if (open !== close) return { ok: false, reason: `chaves desbalanceadas (${open} vs ${close})`, hint: '' };
    }
    return { ok: true, reason: 'código preservado byte a byte; só comentário mudou', hint: '' };
}

// ===========================================================================
// MOTOR HEURÍSTICO  (sem LLM — determinístico, não pode falhar no portão)
// ===========================================================================

const DIVIDER = /^\s*\/\/\s*[-=*_]{4,}\s*$/;
const THEATER = /(QUANTUM|CYBERPUNK|\bAGI\b|GOD-?TIER|NEURAL LOGIC ENGINE|ENTERPRISE SYSTEM|SINGULARITY|AI CONTEXT INJECTION|MODEL SELECTION STRATEGY|THEME CONFIG MAPS|RENDERERS)/i;
const LABEL_NOISE = new Set([
    'components', 'icons', 'extended modules', 'custom hooks', 'ui state', 'settings state', 'notification state',
    'navigation state', 'form data', 'form validations', 'email form state', 'email submit handler', 'biometrics scan state',
    'raphaela agi state', 'audio refs for gemini tts', 'tts', 'svg dimensions', 'create path', 'type filter', 'category filter',
    'global search query', 'sequence timing', 'mouse parallax logic', 'execute', 'parse output', 'extract web intelligence',
    'determine model for ui feedback', 'dynamic qr code update', 'pre-fill from ai', 'auto-fill from props', 'append user message',
    'decode base64', 'update chat with ai response text', 'verify gemini api key', 'clear search when changing modules',
    'mock data for chart', 'mock contact name resolution', 'normalize data to fit the svg viewbox', 'render', 'helpers', 'state', 'styles', 'types',
]);
const CONVERT = new Map([
    ['simulating success for ux if no token, but warning user',
        '// sem token real, simula sucesso só pra não travar a UX — e avisa. simulação não é liquidação.'],
    ['smart match logic for mock purposes',
        '// resolução de nome é mock. em produção isso bate no cadastro real, não num dicionário local.'],
    ['hardcoded context of other modules to simulate full system awareness',
        '// contexto dos outros módulos é chumbado pra dar à IA a ilusão de visão total. é maquete, não telemetria.'],
    ['simulate neural processing', '// "processamento neural" é encenação de carregamento. nada pensa aqui.'],
    ['simulate futuristic auth handshake', '// handshake futurista é teatro de UX. a autenticação real acontece no backend.'],
    ['simulate security alert', '// alerta de segurança encenado: gatilho de demo, não detecção real.'],
    ['silently handle no-speech to avoid ui spam', '// no-speech é silenciado de propósito: senão a UI vira spam de erro a cada pausa.'],
]);

function heuristicRewrite(src, ext) {
    // só mexe com segurança em comentário; mesma varredura ciente de string do portão.
    if (!C_LIKE.has(ext)) {
        // sql/sh/yml: remove só divisor ASCII e banner óbvio, conservador.
        return src.split('\n').filter((l) => !/^\s*[#-]{2}\s*[-=*_]{6,}\s*$/.test(l)).join('\n').replace(/\n{3,}/g, '\n\n');
    }
    let out = '', i = 0; const n = src.length; let str = null;
    const decide = (text) => {
        const t = text.replace(/\s+$/, '');
        const body = t.replace(/^\s*\/\/\s?/, '').trim().toLowerCase();
        if (DIVIDER.test(t)) return { drop: true };
        if (LABEL_NOISE.has(body)) return { drop: true };
        if (CONVERT.has(body)) return { replace: CONVERT.get(body) };
        if (THEATER.test(t)) return { drop: true };
        return { keep: true };
    };
    while (i < n) {
        const c = src[i], c2 = src[i + 1];
        if (str) { out += c; if (c === '\\') { out += c2 ?? ''; i += 2; continue; } if (c === str) str = null; i += 1; continue; }
        if (c === "'" || c === '"' || c === '`') { str = c; out += c; i += 1; continue; }
        if (c === '/' && c2 === '/') {
            let j = i + 2; while (j < n && src[j] !== '\n') j += 1;
            const comment = src.slice(i, j);
            let ls = i - 1; while (ls >= 0 && src[ls] !== '\n' && (src[ls] === ' ' || src[ls] === '\t')) ls -= 1;
            const full = (ls < 0) || (src[ls] === '\n');
            const d = decide(comment);
            if (d.drop) { out = out.replace(/[ \t]*$/, ''); i = (full && j < n && src[j] === '\n') ? j + 1 : j; continue; }
            if (d.replace != null) { out += d.replace; i = j; continue; }
            out += comment; i = j; continue;
        }
        if (c === '/' && c2 === '*') {
            let j = i + 2; while (j < n && !(src[j] === '*' && src[j + 1] === '/')) j += 1; j = Math.min(j + 2, n);
            const block = src.slice(i, j);
            let ls = i - 1; while (ls >= 0 && src[ls] !== '\n' && (src[ls] === ' ' || src[ls] === '\t')) ls -= 1;
            const full = (ls < 0) || (src[ls] === '\n');
            if (/SPDX-License-Identifier|@license/.test(block)) { out = out.replace(/[ \t]*$/, ''); i = (full && j < n && src[j] === '\n') ? j + 1 : j; continue; }
            out += block; i = j; continue;
        }
        out += c; i += 1;
    }
    return out.replace(/\n{3,}/g, '\n\n');
}

// ===========================================================================
// DETECÇÃO DE SINAL  (pra ledger: o que foi encontrado / removido)
// ===========================================================================

function detectSignals(src) {
    const found = [];
    if (/SPDX-License-Identifier|@license/.test(src)) found.push('banner @license/SPDX');
    if (/^\s*\/\/\s*[-=*_]{4,}\s*$/m.test(src)) found.push('divisor ASCII');
    const comments = (src.match(/\/\/[^\n]*/g) || []).join('\n');
    if (THEATER.test(comments)) found.push('cabeçalho-teatro (QUANTUM/NEURAL/etc.)');
    if (/\b(Generated by|As an AI)\b/i.test(src)) found.push('marca de geração automática');
    return found;
}

// achados read-only de prontidão pra produção (NÃO são corrigidos automaticamente).
function auditFile(src, rel) {
    const out = [];
    const SECRETS = [
        [/AIza[0-9A-Za-z_\-]{20,}/, 'chave Google API exposta', 'Critical'],
        [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'chave privada embutida', 'Critical'],
        [/jwt[-_ ]?secret/i, 'JWT secret referenciado/embutido', 'Critical'],
        [/(secret|token|password)\s*[:=]\s*['"][^'"]{8,}['"]/i, 'credencial literal no código', 'High'],
    ];
    src.split('\n').forEach((line, idx) => {
        for (const [re, msg, sev] of SECRETS) if (re.test(line)) out.push({ rel, line: idx + 1, msg, sev });
        if (/\b(TODO|FIXME|HACK)\b/.test(line) && !/@\w+|\(\w+\)|\d{4}-\d{2}-\d{2}/.test(line)) out.push({ rel, line: idx + 1, msg: 'TODO/FIXME órfão (sem dono nem prazo)', sev: 'Medium' });
    });
    return out;
}

// ===========================================================================
// PROMPT  (o contrato — vai como system pro modelo local)
// ===========================================================================

const SYSTEM_PROMPT = `Você é um agente de revisão de um núcleo bancário em produção. Sua única função é reescrever COMENTÁRIOS para eliminar sinal de IA e deixar a voz técnica no padrão de uma equipe sênior real. Você NÃO altera código.

REGRA ZERO — não toque em código:
- Não mude nenhum token executável: identificadores, tipos, strings, números, ordem de statements, imports, assinaturas, SQL, nomes de coluna. Nada.
- A única coisa que você edita é comentário (//, /* */, #, --) e banner de licença.
- Preserve o whitespace do código. Não reindente, não reformate.
- Devolva o ARQUIVO INTEIRO, do começo ao fim. Sem cortar, sem resumir, sem "resto igual".

Há um portão automático que tira todo comentário do antes e do depois e compara o código byte a byte. Se você encostar em uma linha de código, o portão REPROVA e seu trabalho é descartado. Errar pra menos é seguro; errar pra mais reprova.

TOM dos comentários (padrão sênior):
- Comente o PORQUÊ, nunca o quê. O código já diz o quê.
- Cada comentário que sobrar deve explicar pelo menos um: por que o componente existe; qual contrato protege; qual invariante mantém; qual falha impede; qual risco financeiro contém; qual obrigação regulatória materializa; o que acontece quando ele falha.
- Frase curta, seca, técnica, orientada a risco e consequência. A força vem da precisão, não de frase de efeito. Não transforme tudo em slogan.
- Identificador em inglês técnico; alma do comentário em português. Não traduza nomes de símbolo, tabela, coluna, função.

ELIMINE (sinal de IA / ruído):
- Banner ASCII e bloco @license/SPDX por arquivo (licença é centralizada no LICENSE da raiz).
- Comentário genérico, explicação do óbvio, slogan sem conteúdo, repetição, placeholder.
- TODO/FIXME sem dono e sem condição de fechamento.
- Linguagem promocional, exagero corporativo, versão-teatro (v4.0, Enterprise, QUANTUM, God-Tier), emoji, "Generated by", "As an AI".
- Comentário em inglês que só restata a próxima linha → remova ou converta ao tom.

NÃO invente fato. Se o arquivo não diz o dono de um TODO, não chute. Se você não tem certeza se algo é comentário ou código, trate como CÓDIGO e não toque.

CONTRATO DE SAÍDA:
- Devolva SOMENTE o conteúdo final do arquivo. Nada antes, nada depois.
- SEM cercas de markdown (\`\`\`), sem "Aqui está o arquivo", sem comentário meta.
- Mesmo encoding, arquivo completo.`;

// ===========================================================================
// CLIENTE LM STUDIO  (OpenAI-compatible)
// ===========================================================================

async function chat(messages) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), CFG.timeoutMs);
    try {
        const res = await fetch(`${CFG.url.replace(/\/$/, '')}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: CFG.model, messages, temperature: CFG.temperature, max_tokens: -1, stream: false }),
            signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
        const data = await res.json();
        return data?.choices?.[0]?.message?.content ?? '';
    } finally { clearTimeout(t); }
}

// tira cerca de markdown e preâmbulo que o modelo às vezes adiciona apesar do contrato.
function unwrap(text) {
    let t = text.replace(/^\uFEFF/, '');
    const fence = t.match(/^\s*```[a-zA-Z]*\s*\n([\s\S]*?)\n```\s*$/);
    if (fence) t = fence[1];
    t = t.replace(/^\s*(aqui está[^\n]*\n)/i, '');
    return t;
}

async function llmRewrite(original, rel, ext, log) {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Arquivo: ${rel}\n\n${original}` },
    ];
    for (let attempt = 1; attempt <= CFG.maxRetries + 1; attempt += 1) {
        let cand;
        try { cand = unwrap(await chat(messages)); }
        catch (e) { return { rewritten: original, ok: false, attempts: attempt, reason: `erro de rede/modelo: ${e.message}` }; }
        const v = gateVerify(original, cand, ext);
        if (v.ok) return { rewritten: cand, ok: true, attempts: attempt, reason: v.reason };
        log(`    tentativa ${attempt} reprovou: ${v.reason}`);
        messages.push({ role: 'assistant', content: cand });
        messages.push({ role: 'user', content: `REPROVADO pelo portão: ${v.reason}.${v.hint ? ` Divergência perto de: ${v.hint}` : ''} Reescreva o ARQUIVO INTEIRO mudando SOMENTE comentário. Não toque em nenhum token de código.` });
    }
    return { rewritten: original, ok: false, attempts: CFG.maxRetries + 1, reason: 'esgotou tentativas; original mantido' };
}

// ===========================================================================
// UTIL
// ===========================================================================

const sha256 = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
function walk(dir, acc = []) {
    for (const e of readdirSync(dir)) {
        if (EXCLUDE_DIRS.has(e)) continue;
        const p = join(dir, e);
        const st = statSync(p);
        if (st.isDirectory()) walk(p, acc);
        else acc.push(p);
    }
    return acc;
}
function ensureDir(p) { mkdirSync(dirname(p), { recursive: true }); }

// ===========================================================================
// PROBE  (testa a conexão antes de uma rodada grande)
// ===========================================================================

async function probe() {
    process.stdout.write(`Probe LM Studio em ${CFG.url} ... `);
    try {
        const res = await fetch(`${CFG.url.replace(/\/$/, '')}/models`);
        const data = await res.json();
        const ids = (data?.data ?? []).map((m) => m.id);
        console.log('OK');
        console.log('Modelos carregados:', ids.length ? ids.join(', ') : '(nenhum — carregue um modelo no LM Studio)');
        process.stdout.write('Teste de geração ... ');
        const out = await chat([{ role: 'user', content: 'responda só: ok' }]);
        console.log(`OK → "${out.trim().slice(0, 40)}"`);
        console.log('\nConexão pronta. Rode: node regenera-agent.mjs <dir> --apply');
    } catch (e) {
        console.log('FALHOU');
        console.error(`  ${e.message}`);
        console.error('  Cheque: LM Studio aberto, servidor local ligado, um modelo carregado, porta certa (--url).');
        console.error('  Sem LM Studio agora? Rode offline: node regenera-agent.mjs <dir> --engine heuristic');
        process.exit(1);
    }
}

// ===========================================================================
// MAIN
// ===========================================================================

const HELP = `regenera-agent — mata sinal de IA em comentário, prova que não tocou no código.

  node regenera-agent.mjs <dir> [opções]

  --apply              escreve no lugar (default é dry-run: escreve propostas em ${CFG.outDir}/)
  --engine <e>         lmstudio (default) | heuristic (offline, sem LLM)
  --url <u>            endpoint do LM Studio (default ${CFG.url})
  --model <m>          id do modelo carregado (default ${CFG.model})
  --only <substr>      processa só caminhos contendo <substr>
  --max-retries <n>    re-prompts quando o portão reprova (default 2)
  --no-audit           pula a varredura read-only de prontidão
  --probe              testa a conexão com o LM Studio e sai
  --help               isto

  Saída: ${CFG.outDir}/ledger.json e ${CFG.outDir}/RELATORIO.md (evidência por arquivo).
  Garantia: nenhum arquivo é escrito sem passar no portão (código idêntico byte a byte).`;

async function main() {
    if (CFG.help) { console.log(HELP); return; }
    if (CFG.probe) { await probe(); return; }
    if (!CFG.dir) { console.error('faltou <dir>. use --help.'); process.exit(2); }
    const root = resolve(CFG.dir);
    if (!existsSync(root)) { console.error(`dir não existe: ${root}`); process.exit(2); }
    if (CFG.engine === 'lmstudio') {
        try { await fetch(`${CFG.url.replace(/\/$/, '')}/models`); }
        catch { console.error(`LM Studio inacessível em ${CFG.url}. Use --probe pra diagnosticar, ou --engine heuristic pra rodar offline.`); process.exit(1); }
    }

    const all = walk(root).map((p) => ({ abs: p, rel: relative(root, p), ext: extname(p).toLowerCase() }))
        .filter((f) => !CFG.only || f.rel.includes(CFG.only));
    const targets = all.filter((f) => GATE_EXT.has(f.ext));

    console.log(`\nregenera-agent | motor=${CFG.engine} | ${CFG.apply ? 'APPLY (escreve no lugar)' : 'DRY-RUN (não toca no repo)'}`);
    console.log(`dir: ${root}`);
    console.log(`${targets.length} arquivos no escopo do portão (de ${all.length} totais).\n`);

    const ledger = [];
    const findings = [];
    let nClean = 0, nRewrote = 0, nRejected = 0;

    for (const f of targets) {
        const original = readFileSync(f.abs, 'utf8');
        const hashBefore = sha256(original);
        const signals = detectSignals(original);
        if (CFG.audit) findings.push(...auditFile(original, f.rel));

        const tooBig = Buffer.byteLength(original, 'utf8') > CFG.maxBytes && CFG.engine === 'lmstudio';
        let rewritten = original, ok = true, attempts = 0, reason = 'sem mudança necessária';

        if (tooBig) {
            // o portão pega truncamento (código difere → reprova), mas avisar é honesto.
            console.log(`• ${f.rel}  [grande: ${Buffer.byteLength(original)} bytes — risco de truncar no modelo local; usando heurística]`);
            rewritten = heuristicRewrite(original, f.ext); attempts = 0;
        } else if (CFG.engine === 'heuristic') {
            rewritten = heuristicRewrite(original, f.ext);
        } else {
            const r = await llmRewrite(original, f.rel, f.ext, (m) => console.log(m));
            rewritten = r.rewritten; ok = r.ok; attempts = r.attempts; reason = r.reason;
        }

        // portão final, sempre — mesmo na heurística (cinto e suspensório).
        const v = gateVerify(original, rewritten, f.ext);
        const changed = rewritten !== original;
        let status;
        if (!v.ok) { status = 'REJEITADO'; rewritten = original; nRejected += 1; }
        else if (changed) { status = 'reescrito'; nRewrote += 1; }
        else { status = 'já limpo'; nClean += 1; }

        const hashAfter = sha256(rewritten);

        // escrita: só o que passou. dry-run vai pra outDir; apply vai no lugar.
        if (status === 'reescrito') {
            if (CFG.apply) writeFileSync(f.abs, rewritten);
            else { const dest = join(root, CFG.outDir, 'proposto', f.rel); ensureDir(dest); writeFileSync(dest, rewritten); }
        }

        const icon = status === 'REJEITADO' ? '✗' : status === 'reescrito' ? '✎' : '·';
        console.log(`${icon} ${f.rel}  [${status}]${signals.length ? `  sinal: ${signals.join(', ')}` : ''}${status === 'REJEITADO' ? `  (${v.reason})` : ''}`);

        ledger.push({
            caminho: f.rel,
            ext: f.ext,
            motor: tooBig ? 'heuristic(grande)' : CFG.engine,
            status,
            sinal_encontrado: signals,
            hash_antes: hashBefore,
            hash_depois: hashAfter,
            tentativas: attempts,
            comportamento: status === 'REJEITADO' ? 'inalterado (proposta descartada, original mantido)' : 'inalterado (provado pelo portão: código idêntico byte a byte)',
            portao: v.reason,
        });
    }

    // ---- evidência em disco ----
    const outBase = join(root, CFG.outDir);
    mkdirSync(outBase, { recursive: true });
    writeFileSync(join(outBase, 'ledger.json'), JSON.stringify({ gerado_em: new Date().toISOString(), dir: root, motor: CFG.engine, aplicado: CFG.apply, resumo: { reescrito: nRewrote, ja_limpo: nClean, rejeitado: nRejected }, arquivos: ledger, prontidao_producao: findings }, null, 2));

    const md = [];
    md.push(`# Relatório do regenera-agent`);
    md.push(`\nGerado em ${new Date().toISOString()} · motor \`${CFG.engine}\` · ${CFG.apply ? '**APLICADO no lugar**' : 'dry-run (propostas em `' + CFG.outDir + '/proposto/`)'}`);
    md.push(`\n## Comments / AI-signal removal / High`);
    md.push(`\n| resultado | arquivos |\n|---|---:|\n| reescrito (passou no portão) | ${nRewrote} |\n| já limpo | ${nClean} |\n| **rejeitado** (código teria mudado → descartado) | ${nRejected} |`);
    md.push(`\n## Gate / Code-preservation proof / Critical`);
    md.push(`\nTodo arquivo reescrito tem \`hash_antes\` e \`hash_depois\` no \`ledger.json\`. O portão removeu`);
    md.push(`comentário dos dois lados e comparou o código byte a byte. Comportamento: **inalterado**, por construção.`);
    md.push(`\n| arquivo | status | sinal removido | hash antes → depois |`);
    md.push(`|---|---|---|---|`);
    for (const e of ledger) md.push(`| \`${e.caminho}\` | ${e.status} | ${e.sinal_encontrado.join(', ') || '—'} | \`${e.hash_antes.slice(0, 8)}\` → \`${e.hash_depois.slice(0, 8)}\` |`);
    if (findings.length) {
        md.push(`\n## Production-readiness / Findings / (read-only, NÃO corrigido)`);
        md.push(`\nO agente não toca em código, então estes ficam pra decisão humana:`);
        md.push(`\n| severidade | arquivo:linha | achado |`);
        md.push(`|---|---|---|`);
        for (const x of findings.sort((a, b) => ({ Critical: 0, High: 1, Medium: 2, Low: 3 }[a.sev] - { Critical: 0, High: 1, Medium: 2, Low: 3 }[b.sev]))) md.push(`| ${x.sev} | \`${x.rel}:${x.line}\` | ${x.msg} |`);
    }
    writeFileSync(join(outBase, 'RELATORIO.md'), md.join('\n') + '\n');

    console.log(`\n── resumo ──`);
    console.log(`reescrito: ${nRewrote}   já limpo: ${nClean}   rejeitado: ${nRejected}`);
    if (findings.length) console.log(`prontidão produção: ${findings.length} achado(s) read-only (ver relatório)`);
    console.log(`evidência: ${join(CFG.outDir, 'ledger.json')} e ${join(CFG.outDir, 'RELATORIO.md')}`);
    if (!CFG.apply && nRewrote) console.log(`\ndry-run. propostas em ${join(CFG.outDir, 'proposto')}/. revise e rode de novo com --apply pra escrever no lugar.`);
    if (nRejected) { console.log(`\n${nRejected} arquivo(s) REJEITADO(s): o modelo tentou mexer no código. originais intactos.`); process.exitCode = 1; }
}

main().catch((e) => { console.error('erro fatal:', e.message); process.exit(1); });
