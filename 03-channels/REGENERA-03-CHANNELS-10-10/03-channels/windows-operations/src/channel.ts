declare function require(name: string): any;
const { createHash } = require('node:crypto');

export interface CriticalAction { id:string; maker:string; checker?:string; reason:string; evidence:string[]; expiresAt?:string }
export interface AuditEvent { sequence:number; actionId:string; actor:string; decision:'REQUESTED'|'APPROVED'|'REJECTED'; previousHash:string; hash:string }

export function approve(action: CriticalAction, checker: string): Readonly<CriticalAction> {
  if (!action.maker || !checker) throw new Error('ACTOR_REQUIRED');
  if (action.maker===checker) throw new Error('SELF_APPROVAL_FORBIDDEN');
  if (!action.reason.trim()) throw new Error('REASON_REQUIRED');
  if (action.evidence.length===0) throw new Error('EVIDENCE_REQUIRED');
  if (action.expiresAt && Date.parse(action.expiresAt)<=Date.now()) throw new Error('ACTION_EXPIRED');
  return Object.freeze({ ...action, checker });
}

export function maskPii(value:string, reveal=false):string {
  if (reveal) return value;
  if (value.length<=4) return '****';
  return `${value.slice(0,2)}***${value.slice(-2)}`;
}

export function appendAudit(chain: readonly AuditEvent[], next: Omit<AuditEvent,'sequence'|'previousHash'|'hash'>): AuditEvent[] {
  if (!next.actionId || !next.actor) throw new Error('AUDIT_IDENTITY_REQUIRED');
  const previousHash=chain.length?chain[chain.length-1].hash:'GENESIS';
  const sequence=chain.length+1;
  const hash=digest(`${sequence}|${next.actionId}|${next.actor}|${next.decision}|${previousHash}`);
  return [...chain,Object.freeze({ ...next, sequence, previousHash, hash })];
}

export function verifyAudit(chain: readonly AuditEvent[]): boolean {
  let previousHash='GENESIS';
  for (let index=0; index<chain.length; index+=1) {
    const event=chain[index];
    const sequence=index+1;
    if (event.sequence!==sequence || event.previousHash!==previousHash) return false;
    const expected=digest(`${sequence}|${event.actionId}|${event.actor}|${event.decision}|${previousHash}`);
    if (event.hash!==expected) return false;
    previousHash=event.hash;
  }
  return true;
}

function digest(value:string):string {
  return createHash('sha256').update(value,'utf8').digest('hex');
}
