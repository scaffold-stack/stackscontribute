/** micro-STX helpers for StacksContribute UI */

export const MICRO_STX = 1_000_000n;

export function clarityUintToBigInt(raw: unknown): bigint | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'bigint') return raw;
  if (typeof raw === 'number' && Number.isFinite(raw)) return BigInt(Math.trunc(raw));
  if (typeof raw === 'string' && /^-?\d+$/.test(raw)) return BigInt(raw);
  if (typeof raw === 'object' && raw !== null && 'ok' in raw) {
    const response = raw as { ok: boolean; value: unknown };
    if (!response.ok) return null;
    return clarityUintToBigInt(response.value);
  }
  return null;
}

export function unwrapOkValue<T = unknown>(raw: unknown): T | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'object' && raw !== null && 'ok' in raw) {
    const response = raw as { ok: boolean; value: T };
    if (!response.ok) return null;
    return response.value ?? null;
  }
  return raw as T;
}

export function formatStx(raw: unknown, digits = 6): string {
  const value = clarityUintToBigInt(raw);
  if (value === null) return '—';
  const whole = value / MICRO_STX;
  const fraction = value % MICRO_STX;
  const fractionStr = fraction
    .toString()
    .padStart(6, '0')
    .replace(/0+$/, '')
    .slice(0, digits);
  return fractionStr ? `${whole}.${fractionStr}` : String(whole);
}

export function parseStxInput(input: string): bigint | null {
  const trimmed = input.trim();
  if (!trimmed || !/^\d+(\.\d{0,6})?$/.test(trimmed)) return null;
  const [whole, fraction = ''] = trimmed.split('.');
  const fracPadded = (fraction + '000000').slice(0, 6);
  try {
    return BigInt(whole) * MICRO_STX + BigInt(fracPadded);
  } catch {
    return null;
  }
}

export function truncateAddress(address: string, size = 4): string {
  if (address.length <= size * 2 + 3) return address;
  return `${address.slice(0, size + 2)}…${address.slice(-size)}`;
}

export function isValidPrincipal(addr: string | null | undefined): addr is string {
  return typeof addr === 'string' && /^(ST|SP)[0-9A-HJ-NP-Z]{38,41}$/.test(addr);
}

export type CauseRecord = {
  creator: string;
  title: string;
  description: string;
  goal: bigint;
  raised: bigint;
  withdrawn: bigint;
  donors: bigint;
  'created-at': bigint;
};

export function parseCause(raw: unknown): CauseRecord | null {
  const value = unwrapOkValue(raw);
  if (!value || typeof value !== 'object') return null;
  const c = value as Record<string, unknown>;
  const creator = typeof c.creator === 'string' ? c.creator : null;
  const title = typeof c.title === 'string' ? c.title : null;
  const description = typeof c.description === 'string' ? c.description : null;
  const goal = clarityUintToBigInt(c.goal);
  const raised = clarityUintToBigInt(c.raised);
  const withdrawn = clarityUintToBigInt(c.withdrawn);
  const donors = clarityUintToBigInt(c.donors);
  const createdAt = clarityUintToBigInt(c['created-at']);
  if (!creator || !title || !description || goal === null || raised === null || withdrawn === null || donors === null || createdAt === null) {
    return null;
  }
  return {
    creator,
    title,
    description,
    goal,
    raised,
    withdrawn,
    donors,
    'created-at': createdAt,
  };
}
