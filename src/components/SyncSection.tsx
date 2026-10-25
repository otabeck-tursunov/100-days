import { useState } from 'react'
import { syncNow, useSyncStatus } from '../sync/engine'
import { getConfig, getSession, hasEnvConfig, saveConfig, signIn, signOut, signUp } from '../sync/remote'

const SQL = `create table if not exists sync_data (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  data jsonb not null,
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);
alter table sync_data enable row level security;
create policy "own row" on sync_data for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);`

const STATE_TEXT: Record<string, string> = {
  unconfigured: 'Sozlanmagan',
  signedout: 'Kirilmagan',
  idle: 'Tayyor',
  syncing: 'Sinxronlanmoqda…',
  ok: 'Sinxronlangan',
  offline: "Oflayn (internet qaytganda o'zi davom etadi)",
  error: 'Xato',
}

export function SyncSection() {
  const st = useSyncStatus()
  const [, bump] = useState(0)
  const rerender = () => bump((n) => n + 1)
  const cfg = getConfig()
  const session = getSession()

  const [url, setUrl] = useState(cfg?.url ?? '')
  const [key, setKey] = useState(cfg?.key ?? '')
  const [email, setEmail] = useState(session?.email ?? '')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async (fn: () => Promise<void>) => {
    setErr('')
    setBusy(true)
    try {
      await fn()
      setPassword('')
      await syncNow()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
      rerender()
    }
  }

  const stateLabel = !cfg ? STATE_TEXT.unconfigured : !session ? STATE_TEXT.signedout : STATE_TEXT[st.state]
  const last = st.lastSync ? new Date(st.lastSync).toLocaleString('uz') : null

  return (
    <section className="card space-y-4">
      <div>
        <h2 className="font-semibold">Bulutli sinxronlash</h2>
        <p className="mt-1 text-sm text-muted">
          Barcha qurilmada bir xil ma'lumot. Ilova oflayn ishlashda davom etadi, internet bo'lganda o'zgarishlar avtomatik almashadi.
          Ma'lumot yo'qolmasligi uchun ham bulutda nusxa saqlanadi.
        </p>
      </div>

      {!hasEnvConfig() && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="label">Supabase URL</span>
            <input className="input" placeholder="https://xxxx.supabase.co" value={url} onChange={(e) => setUrl(e.target.value)} />
          </label>
          <label>
            <span className="label">Anon (public) kalit</span>
            <input className="input" value={key} onChange={(e) => setKey(e.target.value)} />
          </label>
          <div className="sm:col-span-2">
            <button
              className="btn"
              disabled={!url || !key}
              onClick={() => {
                saveConfig({ url, key })
                rerender()
                void syncNow()
              }}
            >
              Ulanishni saqlash
            </button>
          </div>
        </div>
      )}

      {cfg && !session && (
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            void run(() => signIn(email.trim(), password))
          }}
        >
          <label>
            <span className="label">Email</span>
            <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            <span className="label">Parol (kamida 6 belgi)</span>
            <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button className="btn btn-primary" type="submit" disabled={busy || !email || password.length < 6}>Kirish</button>
            <button className="btn" type="button" disabled={busy || !email || password.length < 6} onClick={() => run(() => signUp(email.trim(), password))}>
              Ro'yxatdan o'tish (birinchi marta)
            </button>
          </div>
        </form>
      )}

      {cfg && session && (
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn btn-primary" disabled={st.state === 'syncing'} onClick={() => void syncNow()}>Hozir sinxronlash</button>
          <button className="btn" onClick={() => { signOut(); rerender(); void syncNow() }}>Chiqish ({session.email})</button>
        </div>
      )}

      <p className="text-sm" role="status">
        <span className="text-muted">Holat: </span>
        {stateLabel}
        {last && cfg && session ? <span className="text-muted"> · oxirgi: {last}</span> : null}
        {st.message && cfg && st.state !== 'offline' ? <span className="text-red-500"> · {st.message}</span> : null}
      </p>
      {err && <p className="text-sm text-red-500" role="alert">{err}</p>}

      <details className="rounded-xl bg-surface2 p-3 text-sm">
        <summary className="cursor-pointer font-medium">Birinchi marta sozlash (bepul, 3 daqiqa)</summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted">
          <li>supabase.com da bepul loyiha yarating.</li>
          <li><b>SQL Editor</b> da quyidagi kodni ishga tushiring.</li>
          <li><b>Authentication → Providers → Email</b> da “Confirm email” ni o'chiring.</li>
          <li><b>Project Settings → API</b> dan URL va <b>anon public</b> kalitni yuqoriga kiriting.</li>
          <li>Birinchi qurilmada “Ro'yxatdan o'tish”, boshqalarida shu email/parol bilan “Kirish”.</li>
        </ol>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-bg p-3 text-xs text-fg">{SQL}</pre>
        <button className="btn mt-3 !min-h-9" onClick={() => void navigator.clipboard?.writeText(SQL)}>SQL ni nusxalash</button>
      </details>
    </section>
  )
}
