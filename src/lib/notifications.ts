export const notificationsSupported = () => typeof Notification !== 'undefined'

export async function requestPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied'
  return Notification.requestPermission()
}

export async function notify(title: string, body: string, tag?: string): Promise<boolean> {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false
  const options: NotificationOptions = {
    body,
    tag,
    icon: import.meta.env.BASE_URL + 'pwa-192x192.png',
    badge: import.meta.env.BASE_URL + 'pwa-192x192.png',
  }
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) await reg.showNotification(title, options)
    else new Notification(title, options)
    return true
  } catch {
    return false
  }
}
