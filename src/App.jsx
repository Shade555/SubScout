import { useAuth } from './contexts/AuthContext'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const { user, loading } = useAuth()
  
  console.log('App component rendering', { user: user?.email, loading })
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }
  
  return user ? <Dashboard /> : <Auth />
}

export default App
