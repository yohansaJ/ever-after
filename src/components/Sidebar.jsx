import { Users, CheckSquare, DollarSign, Heart, LayoutDashboard, Gem, LogIn, LogOut, Cloud, MailCheck } from 'lucide-react'
import { auth, googleProvider } from '../firebase'
import { signInWithPopup, signOut } from 'firebase/auth'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'guests', label: 'Guest List', icon: Users },
  { id: 'rsvps', label: 'RSVP Responses', icon: MailCheck },
  { id: 'todos', label: 'To-Do List', icon: CheckSquare },
  { id: 'budget', label: 'Budget', icon: DollarSign },
  { id: 'dresses', label: 'Mood Board', icon: Heart },
]

export default function Sidebar({ activeView, setActiveView, coupleNames, user }) {
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error('Sign-in error:', err)
      alert('Could not sign in with Google: ' + (err.message || 'Please try again.'))
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Sign-out error:', err)
    }
  }

  return (
    <aside style={{
      width: '240px',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0d1b2a 0%, #0a1520 100%)',
      borderRight: '1px solid rgba(201,168,76,0.15)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '2rem 1.5rem 1.25rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Gem size={18} color="#c9a84c" />
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: '#c9a84c', letterSpacing: '0.08em' }}>
            Ever After
          </span>
          <Gem size={18} color="#c9a84c" />
        </div>
        <div className="gold-divider" />
        <p style={{ fontSize: '0.7rem', color: '#8899aa', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '0.5rem' }}>
          {coupleNames?.bride || 'Bride'} & {coupleNames?.groom || 'Groom'}
        </p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeView === id
          return (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.08))'
                  : 'transparent',
                color: isActive ? '#c9a84c' : '#8899aa',
                fontFamily: 'Montserrat, sans-serif',
                fontSize: '0.82rem',
                fontWeight: isActive ? '600' : '400',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                borderLeft: isActive ? '2px solid #c9a84c' : '2px solid transparent',
                letterSpacing: '0.02em',
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Cloud & User Sync Status */}
      <div style={{ padding: '1rem', borderTop: '1px solid rgba(201,168,76,0.1)', background: 'rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem', fontSize: '0.68rem', color: '#48c78e' }}>
          <Cloud size={13} />
          <span>Cloud Sync Active</span>
        </div>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #c9a84c' }} />
              ) : (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#c9a84c', color: '#0d1b2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem' }}>
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem', color: '#f5f0e8' }}>
                {user.displayName || user.email?.split('@')[0]}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              style={{ background: 'none', border: 'none', color: '#8899aa', cursor: 'pointer', padding: '0.2rem' }}
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            className="btn-ghost"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.72rem', padding: '0.4rem 0.6rem' }}
          >
            <LogIn size={13} /> Sign in with Google
          </button>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <p style={{ fontSize: '0.62rem', color: '#4a5568', textAlign: 'center', letterSpacing: '0.08em', margin: 0 }}>
          YOUR PERFECT DAY ✦
        </p>
      </div>
    </aside>
  )
}
