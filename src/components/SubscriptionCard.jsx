import './SubscriptionCard.css'

export default function SubscriptionCard({ subscription, onCancel, onReactivate, showActions = true }) {
  const formatAmount = (amount, currency) => {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹',
      CAD: 'C$'
    }
    return `${symbols[currency] || currency} ${parseFloat(amount).toFixed(2)}`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysUntilPayment = (nextPaymentDate) => {
    const today = new Date()
    const paymentDate = new Date(nextPaymentDate)
    const diffTime = paymentDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Overdue'
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    return `${diffDays} days`
  }

  const getPaymentStatus = (nextPaymentDate) => {
    const today = new Date()
    const paymentDate = new Date(nextPaymentDate)
    const diffTime = paymentDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'overdue'
    if (diffDays <= 3) return 'urgent'
    if (diffDays <= 7) return 'soon'
    return 'normal'
  }

  const getCategoryIcon = (category) => {
    const icons = {
      'Entertainment': '🎬',
      'Software': '💻',
      'Music': '🎵',
      'Video Streaming': '📺',
      'Gaming': '🎮',
      'Productivity': '⚡',
      'News': '📰',
      'Fitness': '💪',
      'Food': '🍕',
      'Shopping': '🛒',
      'Cloud Storage': '☁️',
      'Communication': '💬',
      'Education': '📚',
      'Finance': '💰'
    }
    return icons[category] || '📱'
  }

  return (
    <div className={`subscription-card ${!subscription.is_active ? 'inactive' : ''}`}>
      <div className="card-header">
        <div className="service-info">
          <div className="service-icon">
            {getCategoryIcon(subscription.category)}
          </div>
          <div className="service-details">
            <h3 className="service-name">{subscription.name}</h3>
            {subscription.category && (
              <span className="service-category">{subscription.category}</span>
            )}
          </div>
        </div>
        <div className="amount">
          {formatAmount(subscription.amount, subscription.currency)}
          <span className="billing-cycle">/{subscription.billing_cycle}</span>
        </div>
      </div>

      {subscription.description && (
        <p className="description">{subscription.description}</p>
      )}

      <div className="card-details">
        <div className="detail-item">
          <span className="label">Start Date:</span>
          <span className="value">{formatDate(subscription.start_date)}</span>
        </div>
        
        {subscription.is_active && (
          <div className="detail-item">
            <span className="label">Next Payment:</span>
            <span className={`value payment-${getPaymentStatus(subscription.next_payment_date)}`}>
              {formatDate(subscription.next_payment_date)}
              <span className="days-until">
                ({getDaysUntilPayment(subscription.next_payment_date)})
              </span>
            </span>
          </div>
        )}

        {subscription.website_url && (
          <div className="detail-item">
            <span className="label">Website:</span>
            <a 
              href={subscription.website_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="website-link"
            >
              Visit Site
            </a>
          </div>
        )}
      </div>

      {showActions && (
        <div className="card-actions">
          {subscription.is_active ? (
            <button 
              onClick={() => onCancel(subscription.id)}
              className="cancel-btn"
            >
              Cancel
            </button>
          ) : (
            <button 
              onClick={() => onReactivate(subscription.id)}
              className="reactivate-btn"
            >
              Reactivate
            </button>
          )}
        </div>
      )}

      {!subscription.is_active && (
        <div className="inactive-badge">Cancelled</div>
      )}
    </div>
  )
}