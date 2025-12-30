// Service Worker for push notifications
self.addEventListener('push', function(event) {
  console.log('Push received:', event)
  
  let notificationData = {}
  
  if (event.data) {
    try {
      notificationData = event.data.json()
    } catch (e) {
      notificationData = {
        title: 'SubScout Notification',
        body: event.data.text() || 'You have a payment reminder'
      }
    }
  }

  const options = {
    body: notificationData.body || 'Payment reminder',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: notificationData.data || {},
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/favicon.ico'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/favicon.ico'
      }
    ],
    tag: notificationData.tag || 'payment-reminder',
    requireInteraction: true
  }

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'SubScout Payment Reminder',
      options
    )
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event)
  
  event.notification.close()

  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event)
})