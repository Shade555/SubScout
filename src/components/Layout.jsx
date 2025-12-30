import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Dashboard from './Dashboard'
import './Layout.css'

export default function Layout() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    // Load saved theme on component mount
    const savedTheme = localStorage.getItem('subscout-theme')
    if (savedTheme) {
      applyTheme(savedTheme)
    }

    // Check if sidebar should be collapsed on mobile
    const checkMobile = () => {
      if (window.innerWidth <= 768) {
        setSidebarCollapsed(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const applyTheme = (themeId) => {
    const themes = {
      dark: ['#0f0f23', '#1a1a2e'],
      purple: ['#1a0b2e', '#2d1b69'],
      green: ['#0d1b2a', '#1b4332'],
      orange: ['#2d1b0b', '#8b4513']
    }

    const theme = themes[themeId] || themes.dark
    document.documentElement.style.setProperty('--bg-primary', theme[0])
    document.documentElement.style.setProperty('--bg-secondary', theme[1])
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'themes':
        return (
          <div className="page-content">
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
                  onClick={() => applyTheme(theme.id)}
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
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="layout">
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
      />
      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {renderCurrentPage()}
      </main>
    </div>
  )
}