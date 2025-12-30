import { useState, useEffect } from 'react'
import { subscriptionService } from '../services/subscriptionService'
import { notificationService } from '../services/notificationService'
import { currencyService } from '../services/currencyService'
import { supabase } from '../lib/supabase'
import AddSubscriptionModal from './AddSubscriptionModal'
import EditSubscriptionModal from './EditSubscriptionModal'
import SubscriptionCard from './SubscriptionCard'
import NotificationSettings from './NotificationSettings'
import Sidebar from './Sidebar'
import './Dashboard.css'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('active')
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [user, setUser] = useState(null)
  const [displayCurrency, setDisplayCurrency] = useState('USD')
  const [stats, setStats] = useState({
    totalActive: 0,
    monthlyTotal: 0,
    yearlyTotal: 0,
    upcomingPayments: 0,
    overduePayments: 0
  })

  useEffect(() => {
    checkUser()
    // Initialize notifications
    initializeNotifications()
  }, [])

  useEffect(() => {
    if (user) {
      loadSubscriptions()
    }
  }, [activeTab, user])

  useEffect(() => {
    // Recalculate stats when display currency changes
    if (subscriptions.length > 0 && activeTab === 'active') {
      const activeSubscriptions = subscriptions.filter(sub => sub.is_active)
      calculateStats(activeSubscriptions)
    }
  }, [displayCurrency, subscriptions, activeTab])

  const initializeNotifications = async () => {
    // Request notification permission and start monitoring
    const granted = await notificationService.requestNotificationPermission()
    if (granted) {
      notificationService.startNotificationMonitoring()
    }
    
    // Register service worker for push notifications
    await notificationService.registerServiceWorker()
  }

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        console.error('Auth error:', error)
        return
      }
      console.log('Current user:', user?.email)
      setUser(user)
    } catch (error) {
      console.error('Error checking user:', error)
    }
  }

  const loadSubscriptions = async () => {
    try {
      setLoading(true)
      let data
      
      switch (activeTab) {
        case 'active':
          data = await subscriptionService.getActiveSubscriptions()
          break
        case 'history':
          data = await subscriptionService.getCancelledSubscriptions()
          break
        case 'upcoming':
          data = await subscriptionService.getUpcomingPayments()
          break
        case 'overdue':
          data = await subscriptionService.getOverduePayments()
          break
        default:
          data = await subscriptionService.getActiveSubscriptions()
      }
      
      setSubscriptions(data)
      
      // Calculate stats for active subscriptions
      if (activeTab === 'active') {
        calculateStats(data)
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (activeSubscriptions) => {
    const monthlyTotal = activeSubscriptions.reduce((total, sub) => {
      const amount = parseFloat(sub.amount)
      
      // Convert to display currency
      const convertedAmount = currencyService.convert(amount, sub.currency, displayCurrency)
      
      switch (sub.billing_cycle) {
        case 'weekly':
          return total + (convertedAmount * 4.33) // Average weeks per month
        case 'monthly':
          return total + convertedAmount
        case 'quarterly':
          return total + (convertedAmount / 3)
        case 'yearly':
          return total + (convertedAmount / 12)
        default:
          return total + convertedAmount
      }
    }, 0)

    setStats({
      totalActive: activeSubscriptions.length,
      monthlyTotal: monthlyTotal,
      yearlyTotal: monthlyTotal * 12,
      upcomingPayments: activeSubscriptions.filter(sub => {
        const nextPayment = new Date(sub.next_payment_date)
        const today = new Date()
        const diffTime = nextPayment - today
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays <= 7 && diffDays >= 0
      }).length,
      overduePayments: activeSubscriptions.filter(sub => {
        const nextPayment = new Date(sub.next_payment_date)
        const today = new Date()
        return nextPayment < today
      }).length
    })
  }

  const handleAddSubscription = async (subscriptionData) => {
    try {
      console.log('Attempting to add subscription:', subscriptionData)
      const result = await subscriptionService.addSubscription(subscriptionData)
      console.log('Subscription added successfully:', result)
      setShowAddModal(false)
      loadSubscriptions()
    } catch (error) {
      console.error('Error adding subscription:', error)
      
      // More specific error messages
      let errorMessage = 'Failed to add subscription'
      if (error.message?.includes('not authenticated')) {
        errorMessage = 'Please log in to add subscriptions'
      } else if (error.message?.includes('relation "subscriptions" does not exist')) {
        errorMessage = 'Database not set up. Please run the SQL setup in Supabase.'
      } else if (error.details) {
        errorMessage = `Database error: ${error.details}`
      }
      
      alert(errorMessage)
    }
  }

  const handleCancelSubscription = async (id) => {
    if (confirm('Are you sure you want to cancel this subscription?')) {
      try {
        await subscriptionService.cancelSubscription(id)
        loadSubscriptions()
      } catch (error) {
        console.error('Error cancelling subscription:', error)
        alert('Failed to cancel subscription')
      }
    }
  }

  const handleReactivateSubscription = async (id) => {
    try {
      await subscriptionService.reactivateSubscription(id)
      loadSubscriptions()
    } catch (error) {
      console.error('Error reactivating subscription:', error)
      alert('Failed to reactivate subscription')
    }
  }

  const handleMarkPaymentCompleted = async (subscription) => {
    if (confirm(`Mark payment as completed for ${subscription.name}?`)) {
      try {
        await subscriptionService.markPaymentCompleted(subscription)
        loadSubscriptions()
        alert('Payment marked as completed! Next payment date updated.')
      } catch (error) {
        console.error('Error marking payment as completed:', error)
        alert('Failed to mark payment as completed')
      }
    }
  }

  const handleEditSubscription = (subscription) => {
    setEditingSubscription(subscription)
    setShowEditModal(true)
  }

  const handleSaveEditedSubscription = async (id, subscriptionData) => {
    try {
      await subscriptionService.editSubscription(id, subscriptionData)
      setShowEditModal(false)
      setEditingSubscription(null)
      loadSubscriptions()
    } catch (error) {
      console.error('Error updating subscription:', error)
      throw error
    }
  }

  const handleRemoveSubscription = async (id) => {
    const subscription = subscriptions.find(sub => sub.id === id)
    if (confirm(`Permanently delete "${subscription?.name}"? This action cannot be undone and will remove it from history.`)) {
      try {
        await subscriptionService.deleteSubscription(id)
        loadSubscriptions()
      } catch (error) {
        console.error('Error removing subscription:', error)
        alert('Failed to remove subscription')
      }
    }
  }

  const renderCurrentPage = () => {
    if (currentPage === 'themes') {
      return (
        <div className="themes-page">
          <div className="page-header">
            <h1>Theme Settings</h1>
            <p>Choose your preferred color scheme</p>
          </div>
          <div className="themes-grid">
            {[
              { id: 'dark', name: 'Dark Blue', colors: ['#0f0f23', '#1a1a2e'] },
              { id: 'purple', name: 'Purple', colors: ['#1a0b2e', '#2d1b69'] },
              { id: 'green', name: 'Forest', colors: ['#0d1b2a', '#1b4332'] },
              { id: 'orange', name: 'Sunset', colors: ['#2d1b0b', '#8b4513'] }
            ].map(theme => (
              <div 
                key={theme.id}
                className="theme-card"
                onClick={() => {
                  document.documentElement.style.setProperty('--bg-primary', theme.colors[0])
                  document.documentElement.style.setProperty('--bg-secondary', theme.colors[1])
                  localStorage.setItem('subscout-theme', theme.id)
                }}
              >
                <div 
                  className="theme-preview-large"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})`
                  }}
                />
                <h3>{theme.name}</h3>
                <p>Click to apply</p>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (currentPage === 'notifications') {
      return <NotificationSettings />
    }

    // Default dashboard content
    return (
      <>
        {/* Stats Cards */}
        <div className="stats-header">
          <h2>Overview</h2>
          <div className="currency-selector">
            <label htmlFor="display-currency">Display in:</label>
            <select 
              id="display-currency"
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              className="currency-select"
            >
              {currencyService.getAvailableCurrencies().map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalActive}</div>
            <div className="stat-label">Active Subscriptions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{currencyService.format(stats.monthlyTotal, displayCurrency)}</div>
            <div className="stat-label">Monthly Total</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{currencyService.format(stats.yearlyTotal, displayCurrency)}</div>
            <div className="stat-label">Yearly Total</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.upcomingPayments}</div>
            <div className="stat-label">Due This Week</div>
          </div>
          <div className="stat-card overdue-card">
            <div className="stat-value overdue-value">{stats.overduePayments}</div>
            <div className="stat-label">Overdue Payments</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active Subscriptions
          </button>
          <button 
            className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming Payments
          </button>
          <button 
            className={`tab ${activeTab === 'overdue' ? 'active' : ''} ${stats.overduePayments > 0 ? 'overdue-tab' : ''}`}
            onClick={() => setActiveTab('overdue')}
          >
            Overdue ({stats.overduePayments})
          </button>
          <button 
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>

        {/* Subscriptions List */}
        <div className="subscriptions-container">
          {loading ? (
            <div className="loading">Loading subscriptions...</div>
          ) : subscriptions.length === 0 ? (
            <div className="empty-state">
              <h3>No subscriptions found</h3>
              <p>
                {activeTab === 'active' 
                  ? 'Add your first subscription to get started!'
                  : activeTab === 'history'
                  ? 'No cancelled subscriptions yet.'
                  : activeTab === 'overdue'
                  ? 'No overdue payments. Great job staying on top of your subscriptions!'
                  : 'No upcoming payments in the next 30 days.'
                }
              </p>
              {activeTab === 'active' && (
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="add-first-btn"
                >
                  Add Your First Subscription
                </button>
              )}
            </div>
          ) : (
            <div className="subscriptions-grid">
              {subscriptions.map(subscription => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  onCancel={handleCancelSubscription}
                  onReactivate={handleReactivateSubscription}
                  onMarkPaid={handleMarkPaymentCompleted}
                  onEdit={handleEditSubscription}
                  onRemove={handleRemoveSubscription}
                  showActions={activeTab !== 'upcoming'}
                />
              ))}
            </div>
          )}
        </div>
      </>
    )
  }

  return (
    <div className="dashboard">
      {/* Sidebar */}
      {showSidebar && (
        <Sidebar 
          currentPage={currentPage}
          onPageChange={(page) => {
            setCurrentPage(page)
            setShowSidebar(false)
          }}
          onClose={() => setShowSidebar(false)}
        />
      )}

      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="sidebar-toggle-integrated"
              onClick={() => setShowSidebar(true)}
            >
              ☰
            </button>
            <div className="header-text">
              <h1>
                {currentPage === 'dashboard' ? 'SubScout Dashboard' : 
                 currentPage === 'themes' ? 'Theme Settings' : 
                 currentPage === 'notifications' ? 'Notification Settings' : 'SubScout'}
              </h1>
              {user && currentPage === 'dashboard' && (
                <span className="user-email">Welcome, {user.email}</span>
              )}
            </div>
          </div>
          {currentPage === 'dashboard' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="add-subscription-btn"
            >
              + Add Subscription
            </button>
          )}
        </div>
      </header>

      {renderCurrentPage()}

      {/* Add Subscription Modal */}
      {showAddModal && (
        <AddSubscriptionModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddSubscription}
        />
      )}

      {/* Edit Subscription Modal */}
      {showEditModal && (
        <EditSubscriptionModal
          subscription={editingSubscription}
          onClose={() => {
            setShowEditModal(false)
            setEditingSubscription(null)
          }}
          onSave={handleSaveEditedSubscription}
        />
      )}
    </div>
  )
}