import { supabase } from '../lib/supabase'

export const notificationService = {
  // Request permission for browser notifications
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  },

  // Show browser notification
  showBrowserNotification(title, options = {}) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      })

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

      return notification
    }
  },

  // Check for upcoming payments and send notifications
  async checkUpcomingPayments() {
    try {
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('is_active', true)

      if (error) throw error

      const today = new Date()
      const notifications = []

      subscriptions.forEach(subscription => {
        const nextPayment = new Date(subscription.next_payment_date)
        const diffTime = nextPayment - today
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        // Check notification preference
        let shouldNotify = false
        if (subscription.notification_preference === '1day' && diffDays <= 1) {
          shouldNotify = true
        } else if (subscription.notification_preference === '3days' && diffDays <= 3) {
          shouldNotify = true
        } else if (subscription.notification_preference === '1week' && diffDays <= 7) {
          shouldNotify = true
        }

        if (shouldNotify && diffDays >= 0) {
          notifications.push({
            subscription,
            daysUntil: diffDays,
            message: diffDays === 0 
              ? `${subscription.name} payment is due today!`
              : `${subscription.name} payment is due in ${diffDays} day${diffDays > 1 ? 's' : ''}!`
          })
        }
      })

      return notifications
    } catch (error) {
      console.error('Error checking upcoming payments:', error)
      return []
    }
  },

  // Send email notification via Supabase Edge Function
  async sendEmailNotification(subscription, daysUntil) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          to: user.email,
          subscription: subscription,
          daysUntil: daysUntil
        }
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error sending email notification:', error)
    }
  },

  // Register service worker for push notifications
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered:', registration)
        return registration
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }
  },

  // Subscribe to push notifications
  async subscribeToPushNotifications() {
    try {
      console.log('🔔 Subscribing to push notifications...')
      
      const registration = await this.registerServiceWorker()
      if (!registration) {
        console.error('❌ Service worker registration failed')
        return null
      }

      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
      console.log('🔑 VAPID key available:', !!vapidKey)
      
      if (!vapidKey) {
        console.error('❌ VAPID public key not found in environment variables')
        return null
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidKey)
      })

      console.log('✅ Push subscription created:', subscription)
      return subscription
    } catch (error) {
      console.error('❌ Error subscribing to push notifications:', error)
      return null
    }
  },

  // Helper function to convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  },

  // Start notification monitoring
  startNotificationMonitoring() {
    // Check every hour
    const checkInterval = setInterval(async () => {
      const notifications = await this.checkUpcomingPayments()
      
      notifications.forEach(({ subscription, daysUntil, message }) => {
        // Show browser notification
        this.showBrowserNotification('SubScout Payment Reminder', {
          body: message,
          icon: '/favicon.ico',
          tag: `payment-${subscription.id}`,
          data: { subscriptionId: subscription.id }
        })

        // Send email notification (optional - you can make this configurable)
        this.sendEmailNotification(subscription, daysUntil)
      })
    }, 60 * 60 * 1000) // 1 hour

    return checkInterval
  }
}