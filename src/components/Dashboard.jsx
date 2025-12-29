import { useAuth } from '../contexts/AuthContext'
import './Dashboard.css'

export default function Dashboard() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>SubScout Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.email}</span>
          <button onClick={handleSignOut} className="sign-out-btn">
            Sign Out
          </button>
        </div>
      </header>
      
      <main className="dashboard-main">
        <div className="welcome-card">
          <h2>Welcome to SubScout! 🎉</h2>
          <p>Start managing your subscriptions by adding your first one.</p>
          <button className="add-subscription-btn">
            Add Your First Subscription
          </button>
        </div>
      </main>
    </div>
  )
}