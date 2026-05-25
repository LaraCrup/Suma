// Workbox throws this when a navigation MessageChannel port disconnects mid-flight
// during SPA client-side routing. Benign — navigation still completes correctly.
self.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('disconnected port object')) {
    event.preventDefault()
  }
})

self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((c) => c.url.includes(self.location.origin))
      if (existing) return existing.focus().then((c) => c.navigate(url))
      return clients.openWindow(url)
    })
  )
})
