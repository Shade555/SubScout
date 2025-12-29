import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './Auth.css'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const { signIn, signUp } = useAuth()

  const handleDemoLogin = () => {
    // For development - simulate a logged in user
    setEmail('demo@subscout.com')
    setPassword('demo123')
    setMessage('Demo mode - using test credentials')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data, error } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password)

      if (error) {
        setMessage(error.message)
      } else if (!isLogin && data.user && !data.session) {
        setMessage('Account created! If email confirmation is enabled, check your email. Otherwise, try logging in.')
      } else if (!isLogin && data.session) {
        setMessage('Account created and logged in successfully!')
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>SubScout</h1>
          <p>Manage your subscriptions with ease</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              minLength={6}
            />
          </div>

          {message && (
            <div className={`message ${message.includes('error') || message.includes('Invalid') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="auth-switch">
          <button 
            type="button" 
            onClick={handleDemoLogin}
            className="demo-button"
          >
            🚀 Quick Demo Login
          </button>
          
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="switch-button"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}