import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './Sidebar.css'

export default function Sidebar({ currentPage, onPageChange, onClose }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    setIsVisible(true)
  }, [])

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      active: currentPage === 'dashboard'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: '🔔',
      active: currentPage === 'notifications'
    },
    {
      id: 'themes',
      label: 'Themes',
      icon: '🎨',
      active: currentPage === 'themes'
    }
  ]

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 300) // Match animation duration
  }

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      try {
        await supabase.auth.signOut()
        handleClose()
      } catch (error) {
        console.error('Error signing out:', error)
      }
    }
  }

  const handleMenuClick = (itemId) => {
    onPageChange(itemId)
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className={`sidebar-overlay ${isVisible ? 'visible' : ''} ${isClosing ? 'closing' : ''}`}
        onClick={handleClose} 
      />
      
      {/* Sidebar */}
      <div className={`sidebar sidebar-overlay-mode ${isVisible ? 'visible' : ''} ${isClosing ? 'closing' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🎯</span>
            <span className="logo-text">SubScout</span>
          </div>
          <button 
            className="sidebar-toggle-btn"
            onClick={handleClose}
          >
            ☰
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
            <div key={item.id} className="nav-item-container" style={{ '--item-index': index }}>
              <button
                className={`nav-item ${item.active ? 'active' : ''}`}
                onClick={() => handleMenuClick(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item sign-out" onClick={handleSignOut}>
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  )
}