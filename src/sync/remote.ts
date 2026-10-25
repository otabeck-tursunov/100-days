import type { Snapshot } from './merge'

/** Supabase ulanish sozlamalari: build vaqtida (VITE_*) yoki Sozlamalardan qo'lda kiritilgan. */
export interface SyncConfig {
  url: string
  key: string
}

interface Session {
  access_token: string
  refresh_token: string
  expires_at: number // ms
  email: string
}

const CFG_KEY = 'sync-config'
const SES_KEY = 'sync-session'

const envCfg = (): SyncConfig | null => {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  return url && key ? { url, key } : null
}

const read = <T,>(k: string): T | null => {
  try {
    return JSON.parse(localStorage.getItem(k) ?? 'null') as T | null
  } catch {
    return null
  }
}

export const getConfig = (): SyncConfig | null => envCfg() ?? read<SyncConfig>(CFG_KEY)
export const hasEnvConfig = () => !!envCfg()
export const saveConfig = (c: SyncConfig) =>
  localStorage.setItem(CFG_KEY, JSON.stringify({ url: c.url.trim().replace(/\/+$/, ''), key: c.key.trim() }))
export const getSession = () => read<Session>(SES_KEY)
const setSession = (s: Session | null) =>
  s ? localStorage.setItem(SES_KEY, JSON.stringify(s)) : localStorage.removeItem(SES_KEY)

export class AuthError extends Error {}
export class NetworkError extends Error {}

async function http(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init)
  } catch {
    throw new NetworkError('Internet yo\'q yoki server javob bermadi')
  }
}

/** Yangi publishable kalit (sb_publishable_...) faqat apikey sarlavhasida yuboriladi; eski JWT anon kalit Bearer sifatida ham. */
const headers = (cfg: SyncConfig, token?: string, extra: Record<string, string> = {}) => ({
  apikey: cfg.key,
  ...(token ? { Authorization: `Bearer ${token}` } : cfg.key.startsWith('eyJ') ? { Authorization: `Bearer ${cfg.key}` } : {}),
  'Content-Type': 'application/json',
  ...extra,
})

function toSession(j: any, email: string): Session {
  return {
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    expires_at: Date.now() + (j.expires_in ?? 3600) * 1000,
    email,
  }
}

async function authMsg(r: Response) {
  const j = await r.json().catch(() => ({}))
  return (j.error_description || j.msg || j.message || j.error || `Xato ${r.status}`) as string
}

export async function signIn(email: string, password: string) {
  const cfg = getConfig()
  if (!cfg) throw new AuthError('Avval Supabase sozlamalarini kiriting')
  const r = await http(`${cfg.url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: headers(cfg),
    body: JSON.stringify({ email, password }),
  })
  if (!r.ok) throw new AuthError(await authMsg(r))
  setSession(toSession(await r.json(), email))
}

export async function signUp(email: string, password: string) {
  const cfg = getConfig()
  if (!cfg) throw new AuthError('Avval Supabase sozlamalarini kiriting')
  const r = await http(`${cfg.url}/auth/v1/signup`, {
    method: 'POST',
    headers: headers(cfg),
    body: JSON.stringify({ email, password }),
  })
  if (!r.ok) throw new AuthError(await authMsg(r))
  const j = await r.json()
  if (!j.access_token) {
    throw new AuthError("Hisob yaratildi, lekin email tasdiqlanishi kerak. Pochtani tekshiring yoki Supabase'da “Confirm email” ni o'chiring, so'ng “Kirish” ni bosing.")
  }
  setSession(toSession(j, email))
}

export const signOut = () => setSession(null)

async function freshToken(cfg: SyncConfig, force = false): Promise<string> {
  const s = getSession()
  if (!s) throw new AuthError('Kirilmagan')
  if (!force && s.expires_at - Date.now() > 60_000) return s.access_token
  const r = await http(`${cfg.url}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: headers(cfg),
    body: JSON.stringify({ refresh_token: s.refresh_token }),
  })
  if (!r.ok) {
    if (r.status >= 400 && r.status < 500) setSession(null)
    throw new AuthError('Sessiya tugadi, qayta kiring')
  }
  const next = toSession(await r.json(), s.email)
  setSession(next)
  return next.access_token
}

async function authed(path: string, init: RequestInit & { headers?: Record<string, string> } = {}) {
  const cfg = getConfig()
  if (!cfg) throw new AuthError('Sozlanmagan')
  const call = async (force: boolean) => {
    const token = await freshToken(cfg, force)
    return http(`${cfg.url}/rest/v1/${path}`, { ...init, headers: headers(cfg, token, init.headers) })
  }
  let r = await call(false)
  if (r.status === 401) r = await call(true)
  if (r.status === 401) throw new AuthError('Sessiya tugadi, qayta kiring')
  return r
}

export interface Remote {
  data: Snapshot
  version: number
}

/** Bulutdagi nusxani oladi; hali yo'q bo'lsa null. */
export async function fetchRemote(): Promise<Remote | null> {
  const r = await authed('sync_data?select=data,version')
  if (!r.ok) throw new Error(`Serverdan o'qishda xato (${r.status}). SQL jadval yaratilganmi?`)
  const rows = (await r.json()) as { data: Snapshot; version: number }[]
  return rows[0] ? { data: rows[0].data, version: rows[0].version } : null
}

/**
 * Optimistik yozish: faqat bulutdagi versiya biz o'qigan versiya bilan bir xil bo'lsa yoziladi.
 * false — boshqa qurilma oraliqda yozgan (qayta o'qib birlashtirish kerak).
 */
export async function pushRemote(data: Snapshot, version: number | null): Promise<boolean> {
  const prefer = { Prefer: 'return=representation' }
  if (version == null) {
    const r = await authed('sync_data', { method: 'POST', headers: prefer, body: JSON.stringify({ data, version: 1 }) })
    if (r.status === 409) return false // boshqa qurilma birinchi bo'lib yaratgan
    if (!r.ok) throw new Error(`Serverga yozishda xato (${r.status})`)
    return true
  }
  const r = await authed(`sync_data?version=eq.${version}`, {
    method: 'PATCH',
    headers: prefer,
    body: JSON.stringify({ data, version: version + 1, updated_at: new Date().toISOString() }),
  })
  if (!r.ok) throw new Error(`Serverga yozishda xato (${r.status})`)
  const rows = (await r.json()) as unknown[]
  return rows.length > 0
}
