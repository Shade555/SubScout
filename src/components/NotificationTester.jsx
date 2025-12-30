import { useState } from 'react'
import { notificationService } from '../services/notificationService'
import { subscriptionService } from '../services/subscriptionService'
import './NotificationTester.css'

export default function NotificationTester() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState([])

  const addResult = (type, success, message) => {
    setResults(prev => [...prev, {
      id: Date.now(),
      type,
      success,
      message,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const clearResults = () => {
    setResults([])
  }

  const testAllNotifications = async () => {
    setTesting(true)
    clearResults()

    // Test browser notifications
    try {
      if (Notification.permission === 'granted') {
        notificationService.showBrowserNotification('🔔 Browser Test', {
          body: 'Browser notification test successful!',
          icon: '/favicon.ico'
        })
        addResult('Browser', true, 'Browser notification sent successfully')
      } else {
        addResult('Browser', false, 'Browser notifications not permitted')
      }
    } catch (error) {
      addResult('Browser', false, `Browser notification failed: ${error.message}`)
    }

    // Test push notifications
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification('📱 Push Test', {
          body: 'Push notification test successful!',
          icon: '/favicon.ico',
          tag: 'test-push'
        })
        addResult('Push', true, 'Push notification sent successfully')
      } else {
        addResult('Push', false, 'Service worker not supported')
      }
    } catch (error) {
      addResult('Push', false, `Push notification failed: ${error.message}`)
    }

    // Test email notifications
    try {
      const testSub = {
        name: 'Test Subscription',
        amount: 9.99,
        currency: 'USD',
        billing_cycle: 'monthly'
      }
      await notificationService.sendEmailNotification(testSub, 1)
      addResult('Email', true, 'Email notification sent successfully')
    } catch (error) {
      addResult('Email', false, `Email notification failed: ${error.message}`)
    }

    setTesting(false)
  }

  const createTestSubscription = async () => {
    setTesting(true)
    
    try {
      // Create a subscription with payment due tomorrow for testing
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const testSubscription = {
        name: 'Test Notification Service',
        amount: 5.99,
        currency: 'USD',
        billing_cycle: 'monthly',
        category: 'Software',
        start_date: new Date().toISOString().split('T')[0],
        next_payment_date: tomorrow.toISOString().split('T')[0],
        notification_preference: '1day',
        description: 'Test subscription for notification testing'
      }

      await subscriptionService.addSubscription(testSubscription)
      addResult('Test Sub', true, 'Test subscription created with payment due tomorrow')
    } catch (error) {
      addResult('Test Sub', false, `Failed to create test subscription: ${error.message}`)
    }

    setTesting(false)
  }

  const simulateNotificationCheck = async () => {
    setTesting(true)
    
    try {
      const notifications = await notificationService.checkUpcomingPayments()
      
      if (notifications.length > 0) {
        addResult('Check', true, `Found ${notifications.length} upcoming payment(s)`)
        
        // Send notifications for each upcoming payment
        notifications.forEach(({ subscription, message }) => {
          notificationService.showBrowserNotification('💰 Payment Reminder', {
            body: message,
            icon: '/favicon.ico',
            tag: `payment-${subscription.id}`
          })
        })
      } else {
        addResult('Check', true, 'No upcoming payments found')
      }
    } catch (error) {
      addResult('Check', false, `Notification check failed: ${error.message}`)
    }

    setTesting(false)
  }

  return (
    <div className="notification-tester">
      <div className="tester-header">
        <h3>🧪 Notification Testing Panel</h3>
        <p>Test all notification types and simulate payment reminders</p>
      </div>

      <div className="test-actions">
        <button 
          onClick={testAllNotifications}
          disabled={testing}
          className="test-action-btn primary"
        >
          {testing ? 'Testing...' : 'Test All Notifications'}
        </button>

        <button 
          onClick={createTestSubscription}
          disabled={testing}
          className="test-action-btn secondary"
        >
          {testing ? 'Creating...' : 'Create Test Subscription'}
        </button>

        <button 
          onClick={simulateNotificationCheck}
          disabled={testing}
          className="test-action-btn secondary"
        >
          {testing ? 'Checking...' : 'Check Upcoming Payments'}
        </button>

        <button 
          onClick={clearResults}
          disabled={testing}
          className="test-action-btn clear"
        >
          Clear Results
        </button>
      </div>

      {results.length > 0 && (
        <div className="test-results">
          <h4>Test Results:</h4>
          <div className="results-list">
            {results.map(result => (
              <div 
                key={result.id} 
                className={`result-item ${result.success ? 'success' : 'error'}`}
              >
                <div className="result-header">
                  <span className="result-type">{result.type}</span>
                  <span className="result-time">{result.timestamp}</span>
                </div>
                <div className="result-message">{result.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="testing-instructions">
        <h4>📱 How to Test on Your Phone:</h4>
        <ol>
          <li><strong>Open this website on your phone</strong> using Chrome or Safari</li>
          <li><strong>Enable push notifications</strong> in the notification settings</li>
          <li><strong>Add to home screen</strong> (optional but recommended)</li>
          <li><strong>Click "Test All Notifications"</strong> above</li>
          <li><strong>Check your phone</strong> - you should see notifications even if you close the browser</li>
          <li><strong>Create a test subscription</strong> with payment due tomorrow</li>
          <li><strong>Wait or manually trigger</strong> the notification check</li>
        </ol>

        <div className="pro-tips">
          <h5>💡 Pro Tips:</h5>
          <ul>
            <li>Push notifications work best when the site is added to your home screen</li>
            <li>Make sure your phone's "Do Not Disturb" mode is off</li>
            <li>Check your browser's notification settings if you don't see notifications</li>
            <li>Email notifications require the Supabase Edge Function to be deployed</li>
          </ul>
        </div>
      </div>
    </div>
  )
}