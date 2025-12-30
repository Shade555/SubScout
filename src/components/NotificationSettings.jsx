import { useState, useEffect } from 'react'
import { notificationService } from '../services/notificationService'
import { userPreferencesService } from '../services/userPreferencesService'
import NotificationTester from './NotificationTester'
import './NotificationSettings.css'

export default function NotificationSettings() {
  const [browserNotifications, setBrowserNotifications] = useState(false)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [testNotification, setTestNotification] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadUserPreferences()
  }, [])

  const loadUserPreferences = async () => {
    try {
      setLoading(true)
      
      // Load user preferences from database
      const preferences = await userPreferencesService.getUserPreferences()
      
      if (preferences) {
        setBrowserNotifications(preferences.browser_notifications || false)
        setPushNotifications(preferences.push_notifications || false)
        setEmailNotifications(preferences.email_notifications !== false) // Default to true
        
        // Check current browser notification permission
        if (preferences.browser_notifications && 'Notification' in window) {
          const permission = Notification.permission
          if (permission !== 'granted') {
            setBrowserNotifications(false)
            await userPreferencesService.updatePreference('browser_notifications', false)
          }
        }
        
        // Check if push notifications are actually subscribed
        if (preferences.push_notifications) {
          const pushSubscription = await userPreferencesService.getPushSubscription()
          if (!pushSubscription) {
            setPushNotifications(false)
            await userPreferencesService.updatePreference('push_notifications', false)
          }
        }
      }
      
    } catch (error) {
      console.error('Error loading user preferences:', error)
      setError('Failed to load notification settings. Please refresh the page.')
      // Set default values if loading fails
      setBrowserNotifications(false)
      setPushNotifications(false)
      setEmailNotifications(true)
    } finally {
      setLoading(false)
    }
  }

  const handleBrowserNotifications = async (enabled) => {
    try {
      setSaving(true)
      
      if (enabled) {
        const granted = await notificationService.requestNotificationPermission()
        setBrowserNotifications(granted)
        await userPreferencesService.updatePreference('browser_notifications', granted)
        
        if (granted) {
          // Start monitoring for notifications
          notificationService.startNotificationMonitoring()
        }
      } else {
        setBrowserNotifications(false)
        await userPreferencesService.updatePreference('browser_notifications', false)
      }
    } catch (error) {
      console.error('Error updating browser notifications:', error)
      setError('Failed to update browser notification settings')
      setBrowserNotifications(!enabled) // Revert on error
    } finally {
      setSaving(false)
    }
  }

  const handlePushNotifications = async (enabled) => {
    try {
      setSaving(true)
      console.log('🔔 Handling push notifications:', enabled)
      
      if (enabled) {
        // Check if service worker is supported
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          setError('Push notifications are not supported in this browser')
          return
        }

        const subscription = await notificationService.subscribeToPushNotifications()
        if (subscription) {
          console.log('✅ Push subscription successful, saving to database...')
          await userPreferencesService.savePushSubscription(subscription)
          setPushNotifications(true)
          await userPreferencesService.updatePreference('push_notifications', true)
          console.log('✅ Push notifications enabled successfully')
        } else {
          console.log('❌ Push subscription failed')
          setPushNotifications(false)
          await userPreferencesService.updatePreference('push_notifications', false)
          setError('Failed to enable push notifications. Please check your browser settings.')
        }
      } else {
        console.log('🔕 Disabling push notifications...')
        
        // Unsubscribe from push notifications
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(async (registration) => {
            const subscription = await registration.pushManager.getSubscription()
            if (subscription) {
              await subscription.unsubscribe()
              console.log('✅ Unsubscribed from push notifications')
            }
          })
        }
        
        await userPreferencesService.removePushSubscription()
        setPushNotifications(false)
        await userPreferencesService.updatePreference('push_notifications', false)
        console.log('✅ Push notifications disabled successfully')
      }
    } catch (error) {
      console.error('❌ Error updating push notifications:', error)
      setError('Failed to update push notification settings')
      setPushNotifications(!enabled) // Revert on error
    } finally {
      setSaving(false)
    }
  }

  const handleEmailNotifications = async (enabled) => {
    try {
      setSaving(true)
      setEmailNotifications(enabled)
      await userPreferencesService.updatePreference('email_notifications', enabled)
    } catch (error) {
      console.error('Error updating email notifications:', error)
      setError('Failed to update email notification settings')
      // Revert on error
      setEmailNotifications(!enabled)
    } finally {
      setSaving(false)
    }
  }

  const sendTestBrowserNotification = async () => {
    setTestNotification(true)
    
    try {
      notificationService.showBrowserNotification('🔔 SubScout Test', {
        body: 'Browser notifications are working! You\'ll receive payment reminders like this.',
        icon: '/favicon.ico',
        tag: 'test-browser'
      })
      
      setTimeout(() => setTestNotification(false), 2000)
    } catch (error) {
      console.error('Test browser notification failed:', error)
      setError('Failed to send test browser notification')
      setTestNotification(false)
    }
  }

  const sendTestPushNotification = async () => {
    setTestNotification(true)
    
    try {
      // Send a test push notification via service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        
        // Simulate a push notification by directly showing it
        registration.showNotification('📱 SubScout Push Test', {
          body: 'Push notifications are working! You\'ll get these even when the browser is closed.',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          vibrate: [200, 100, 200],
          tag: 'test-push',
          requireInteraction: true,
          actions: [
            {
              action: 'view',
              title: 'View App',
              icon: '/favicon.ico'
            }
          ]
        })
      }
      
      setTimeout(() => setTestNotification(false), 2000)
    } catch (error) {
      console.error('Test push notification failed:', error)
      setError('Failed to send test push notification')
      setTestNotification(false)
    }
  }

  const sendTestEmailNotification = async () => {
    setTestNotification(true)
    
    try {
      await notificationService.sendTestEmail()
      alert('✅ Test email sent successfully! Check your inbox (and spam folder).')
      
      setTimeout(() => setTestNotification(false), 2000)
    } catch (error) {
      console.error('Test email notification failed:', error)
      
      let errorMessage = error.message
      
      if (errorMessage.includes('not found') || errorMessage.includes('Failed to send a request')) {
        errorMessage = `❌ Edge Function not deployed yet!\n\nPlease follow these steps:\n1. Install Supabase CLI: npm install -g supabase\n2. Login: supabase login\n3. Link project: supabase link --project-ref qjulzbbwfdqwrybkhpoj\n4. Deploy function: supabase functions deploy send-notification-email\n\nSee deploy-edge-function.md for detailed instructions.`
      } else if (errorMessage.includes('RESEND_API_KEY')) {
        errorMessage = `❌ Resend API key not configured!\n\nPlease add RESEND_API_KEY to your Supabase environment variables:\n1. Go to Supabase Dashboard > Functions > Environment Variables\n2. Add: RESEND_API_KEY = re_h64eVn47_NBKh3CjYCn6HjUbEubNDfadi`
      }
      
      setError(errorMessage)
      setTestNotification(false)
    }
  }

  const sendTestNotification = async () => {
    // This is the old function, keeping for backward compatibility
    await sendTestBrowserNotification()
  }

  if (loading) {
    return (
      <div className="notification-settings">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading notification settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="notification-settings">
      <div className="settings-header">
        <h2>Notification Settings</h2>
        <p>Configure how you want to receive payment reminders</p>
        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
      </div>

      <div className="settings-grid">
        <div className="setting-card">
          <div className="setting-info">
            <h3>🔔 Browser Notifications</h3>
            <p>Get instant notifications in your browser when payments are due</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={browserNotifications}
              onChange={(e) => handleBrowserNotifications(e.target.checked)}
              disabled={saving}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-card">
          <div className="setting-info">
            <h3>📱 Push Notifications</h3>
            <p>Receive notifications even when the browser is closed (mobile & desktop)</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={pushNotifications}
              onChange={(e) => handlePushNotifications(e.target.checked)}
              disabled={saving}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-card">
          <div className="setting-info">
            <h3>📧 Email Notifications</h3>
            <p>Get email reminders for upcoming payments</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => handleEmailNotifications(e.target.checked)}
              disabled={saving}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-card test-card">
          <div className="setting-info">
            <h3>🧪 Test Notifications</h3>
            <p>Send test notifications to verify your settings work</p>
          </div>
          <div className="test-buttons">
            <button 
              className="test-btn"
              onClick={sendTestBrowserNotification}
              disabled={testNotification || saving || !browserNotifications}
            >
              {testNotification ? 'Sending...' : 'Test Browser'}
            </button>
            <button 
              className="test-btn"
              onClick={sendTestPushNotification}
              disabled={testNotification || saving || !pushNotifications}
            >
              {testNotification ? 'Sending...' : 'Test Push'}
            </button>
            <button 
              className="test-btn"
              onClick={sendTestEmailNotification}
              disabled={testNotification || saving || !emailNotifications}
            >
              {testNotification ? 'Sending...' : 'Test Email'}
            </button>
          </div>
        </div>
      </div>

      {saving && (
        <div className="saving-indicator">
          <span>Saving preferences...</span>
        </div>
      )}

      <div className="notification-info">
        <h3>How it works:</h3>
        <ul>
          <li><strong>Browser Notifications:</strong> Appear while you're using the browser</li>
          <li><strong>Push Notifications:</strong> Work even when browser is closed (requires permission)</li>
          <li><strong>Email Notifications:</strong> Sent to your registered email address</li>
          <li><strong>Timing:</strong> Based on your notification preference for each subscription (1 day, 3 days, or 1 week before)</li>
          <li><strong>Saved Automatically:</strong> Your preferences are saved to your profile and synced across devices</li>
        </ul>
      </div>

      <NotificationTester />
    </div>
  )
}