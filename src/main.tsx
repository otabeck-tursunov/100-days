import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'
import { initDb } from './db/db'
import { installSyncHooks } from './sync/engine'

// Yangi versiya chiqsa tez topiladi va ilova o'zi qayta yuklanadi
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return
    const check = () => void reg.update().catch(() => {})
    setInterval(check, 5 * 60_000)
    document.addEventListener('visibilitychange', () => !document.hidden && check())
  },
})

// Ilova eski versiya bilan ochilgan bo'lsa, yangi service worker nazoratni olganda qayta yuklaymiz
if (navigator.serviceWorker?.controller) {
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    reloading = true
    location.reload()
  })
}

installSyncHooks()

initDb().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
