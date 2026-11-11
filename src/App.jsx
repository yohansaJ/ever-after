import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import GuestList from './components/GuestList'
import TodoList from './components/TodoList'
import BudgetTracker from './components/BudgetTracker'
import DressMoodBoard from './components/DressMoodBoard'
import RSVPResponses from './components/RSVPResponses'
import FamilyAccessModal from './components/FamilyAccessModal'
import { auth, googleProvider } from './firebase'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { subscribeWeddingDetails, saveWeddingDetails, addAllowedMember } from './services/db'
import { Gem, Lock, LogIn, LogOut, ShieldAlert } from 'lucide-react'
import './index.css'

function App() {
  const [activeView, setActiveView] = useState('dashboard')
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [weddingDetails, setWeddingDetails] = useState(null)
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false)
  
  const [weddingDate, setWeddingDateState] = useState(() => {
    return localStorage.getItem('weddingDate') || ''
  })
  const [coupleNames, setCoupleNamesState] = useState(() => {
    const saved = localStorage.getItem('coupleNames')
    return saved ? JSON.parse(saved) : { bride: 'Bride', groom: 'Groom' }
  })

  // Listen to Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
    })
    return () => unsub()
  }, [])

  // Listen to Firestore Wedding Settings
  useEffect(() => {
    const unsub = subscribeWeddingDetails((data) => {
      if (data) {
        setWeddingDetails(data)
        if (data.weddingDate) {
          setWeddingDateState(data.weddingDate)
          localStorage.setItem('weddingDate', data.weddingDate)
        }
        if (data.coupleNames) {
          setCoupleNamesState(data.coupleNames)
          localStorage.setItem('coupleNames', JSON.stringify(data.coupleNames))
        }
      } else {
        setWeddingDetails(null)
      }
    })
    return () => unsub && unsub()
  }, [])

  // Auto-initialize first user / owner
  useEffect(() => {
    if (user?.email && weddingDetails) {
      const userEmail = user.email.toLowerCase()
      const allowed = weddingDetails.allowedMembers || []

      // If no owner or no allowed members exist yet, make the first signed-in user the owner
      if (!weddingDetails.ownerEmail || allowed.length === 0) {
        saveWeddingDetails({
          ownerEmail: userEmail,
          allowedMembers: [userEmail]
        })
      }
    }
  }, [user, weddingDetails])

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error('Sign-in error:', err)
      alert('Sign-in failed: ' + (err.message || 'Please try again.'))
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Sign-out error:', err)
    }
  }

  const updateWeddingDate = async (newDate) => {
    setWeddingDateState(newDate)
    localStorage.setItem('weddingDate', newDate)
    try {
      await saveWeddingDetails({ weddingDate: newDate, coupleNames })
    } catch (err) {
      console.warn('Could not sync wedding date to cloud:', err)
    }
  }

  const updateCoupleNames = async (newNames) => {
    setCoupleNamesState(newNames)
    localStorage.setItem('coupleNames', JSON.stringify(newNames))
    try {
      await saveWeddingDetails({ coupleNames: newNames, weddingDate })
    } catch (err) {
      console.warn('Could not sync couple names to cloud:', err)
    }
  }

  // Check Authorization
  const currentUserEmail = user?.email ? user.email.toLowerCase() : null
  const allowedMembers = (weddingDetails?.allowedMembers || []).map(e => e.toLowerCase())
  const ownerEmail = weddingDetails?.ownerEmail ? weddingDetails.ownerEmail.toLowerCase() : null

  // Is authorized if: user email is owner or in allowedMembers, or wedding details not initialized yet
  const isAuthorized = currentUserEmail && (
    allowedMembers.includes(currentUserEmail) ||
    currentUserEmail === ownerEmail ||
    (!ownerEmail && allowedMembers.length === 0)
  )

  // 1. Loading State
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1b2a', color: '#c9a84c' }}>
        <p className="font-serif" style={{ fontSize: '1.2rem' }}>Loading Ever After...</p>
      </div>
    )
  }

  // 2. Unauthenticated State: Show Luxury Login Gateway
  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #142236 0%, #0d1b2a 100%)',
        padding: '1.5rem',
      }}>
        <div className="card animate-fade-in" style={{
          maxWidth: '440px',
          width: '100%',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          borderColor: 'rgba(201, 168, 76, 0.3)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <Gem size={22} color="#c9a84c" />
            <h1 className="font-serif" style={{ fontSize: '2.4rem', color: '#c9a84c', margin: 0, letterSpacing: '0.05em' }}>
              Ever After
            </h1>
            <Gem size={22} color="#c9a84c" />
          </div>

          <div className="gold-divider" style={{ margin: '1rem 0 1.5rem' }} />

          <p className="font-serif" style={{ fontSize: '1.15rem', color: '#f5f0e8', margin: '0 0 0.5rem' }}>
            {coupleNames.bride} & {coupleNames.groom}
          </p>
          <p style={{ fontSize: '0.78rem', color: '#8899aa', margin: '0 0 2rem', lineHeight: 1.6 }}>
            Private Wedding Planning Space. Please sign in with an authorized Google account to continue.
          </p>

          <button
            onClick={handleSignIn}
            className="btn-gold"
            style={{ width: '100%', justifyContent: 'center', padding: '0.8rem 1rem', fontSize: '0.9rem' }}
          >
            <LogIn size={16} /> Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  // 3. Authenticated but Unauthorized State: Access Denied
  if (!isAuthorized) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #142236 0%, #0d1b2a 100%)',
        padding: '1.5rem',
      }}>
        <div className="card animate-fade-in" style={{
          maxWidth: '460px',
          width: '100%',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          borderColor: 'rgba(240, 80, 80, 0.4)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'rgba(240,80,80,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <Lock size={26} color="#f05050" />
          </div>

          <h2 className="font-serif" style={{ fontSize: '1.8rem', color: '#f5f0e8', margin: '0 0 0.5rem' }}>
            Access Restricted
          </h2>

          <p style={{ fontSize: '0.8rem', color: '#8899aa', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
            You are signed in as <strong style={{ color: '#f5f0e8' }}>{user.email}</strong>, but this account has not been added to this private wedding planner yet.
          </p>

          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.75rem', fontSize: '0.75rem', color: '#c9a84c' }}>
            💡 Ask the wedding owner to add your Gmail address from their <strong>"Family Access"</strong> settings.
          </div>

          <button
            onClick={handleSignOut}
            className="btn-ghost"
            style={{ width: '100%', justifyContent: 'center', padding: '0.65rem 1rem' }}
          >
            <LogOut size={15} /> Switch Google Account
          </button>
        </div>
      </div>
    )
  }

  // 4. Authorized: Render Full Wedding Planner
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <Dashboard
            weddingDate={weddingDate}
            setWeddingDate={updateWeddingDate}
            coupleNames={coupleNames}
            setCoupleNames={updateCoupleNames}
            setActiveView={setActiveView}
          />
        )
      case 'guests':
        return <GuestList />
      case 'rsvps':
        return <RSVPResponses />
      case 'todos':
        return <TodoList />
      case 'budget':
        return <BudgetTracker />
      case 'dresses':
        return <DressMoodBoard />
      default:
        return <Dashboard />
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        coupleNames={coupleNames}
        user={user}
        onOpenFamilyAccess={() => setIsFamilyModalOpen(true)}
      />
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxHeight: '100vh' }}>
        {renderView()}
      </main>

      {/* Family & Team Access Modal */}
      <FamilyAccessModal
        isOpen={isFamilyModalOpen}
        onClose={() => setIsFamilyModalOpen(false)}
        weddingDetails={weddingDetails}
        currentUser={user}
      />
    </div>
  )
}

export default App
