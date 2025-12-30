import { useState, useEffect } from 'react'
import './AddSubscriptionModal.css' // Reuse the same styles

export default function EditSubscriptionModal({ subscription, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    currency: 'USD',
    billing_cycle: 'monthly',
    category: '',
    description: '',
    website_url: '',
    notification_preference: '1week'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (subscription) {
      setFormData({
        name: subscription.name || '',
        amount: subscription.amount || '',
        currency: subscription.currency || 'USD',
        billing_cycle: subscription.billing_cycle || 'monthly',
        category: subscription.category || '',
        description: subscription.description || '',
        website_url: subscription.website_url || '',
        notification_preference: subscription.notification_preference || '1week'
      })
    }
  }, [subscription])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.name || !formData.amount) {
        throw new Error('Name and amount are required')
      }

      if (parseFloat(formData.amount) <= 0) {
        throw new Error('Amount must be greater than 0')
      }

      await onSave(subscription.id, {
        ...formData,
        amount: parseFloat(formData.amount)
      })

      onClose()
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (!subscription) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Subscription</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="subscription-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Service Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Netflix, Spotify"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select Category</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Video Streaming">Video Streaming</option>
                <option value="Music">Music</option>
                <option value="Software">Software</option>
                <option value="Gaming">Gaming</option>
                <option value="Productivity">Productivity</option>
                <option value="News">News</option>
                <option value="Fitness">Fitness</option>
                <option value="Food">Food</option>
                <option value="Shopping">Shopping</option>
                <option value="Cloud Storage">Cloud Storage</option>
                <option value="Communication">Communication</option>
                <option value="Education">Education</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="amount">Amount *</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="currency">Currency</label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="CAD">CAD (C$)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="billing_cycle">Billing Cycle</label>
              <select
                id="billing_cycle"
                name="billing_cycle"
                value={formData.billing_cycle}
                onChange={handleChange}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Optional description or notes"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="website_url">Website URL</label>
            <input
              type="url"
              id="website_url"
              name="website_url"
              value={formData.website_url}
              onChange={handleChange}
              placeholder="https://example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="notification_preference">Notification Timing</label>
            <select
              id="notification_preference"
              name="notification_preference"
              value={formData.notification_preference}
              onChange={handleChange}
            >
              <option value="1day">1 day before</option>
              <option value="3days">3 days before</option>
              <option value="1week">1 week before</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}