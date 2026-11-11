import { Users, CheckSquare, DollarSign, Heart, LayoutDashboard, LogIn, LogOut, MailCheck, Anchor, Compass } from 'lucide-react'
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

export default function Sidebar({ activeView, setActiveView, coupleNames, user, onOpenFamilyAccess }) {
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
      width: '250px',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #091524 0%, #050d18 100%)',
      borderRight: '1px solid rgba(212, 175, 55, 0.16)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'relative',
      zIndex: 20,
    }}>
      {/* Nautical Crest / Logo */}
      <div style={{ padding: '2rem 1.5rem 1.25rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <Anchor size={18} color="#d4af37" />
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.45rem', color: '#d4af37', letterSpacing: '0.08em', fontWeight: 500 }}>
            Ever After
          </span>
          <Compass size={18} color="#d4af37" />
        </div>
        
        <div className="gold-divider" style={{ margin: '0.6rem 0' }} />
        
        <p style={{ fontSize: '0.72rem', color: '#f8f5ee', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '0.4rem', fontWeight: 500 }}>
          {coupleNames?.bride || 'Bride'} & {coupleNames?.groom || 'Groom'}
        </p>

        <p style={{ fontSize: '0.62rem', color: '#d4af37', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0.25rem 0 0', opacity: 0.85 }}>
          Two Souls · One Anchor ⚓
        </p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeView === id
          return (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.7rem 1.1rem',
                borderRadius: '10px',
                border: 'none',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.18) 0%, rgba(28, 59, 99, 0.3) 100%)'
                  : 'transparent',
                color: isActive ? '#f4e2a1' : '#8a9eb5',
                fontFamily: 'Montserrat, sans-serif',
                fontSize: '0.84rem',
                fontWeight: isActive ? '600' : '400',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                borderLeft: isActive ? '3px solid #d4af37' : '3px solid transparent',
                boxShadow: isActive ? '0 4px 15px rgba(0, 0, 0, 0.3)' : 'none',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.color = '#f8f5ee'
                  e.currentTarget.style.background = 'rgba(212, 175, 55, 0.06)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.color = '#8a9eb5'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <Icon size={17} color={isActive ? '#d4af37' : 'currentColor'} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* User & Family Access Section */}
      <div style={{ padding: '1rem', borderTop: '1px solid rgba(212, 175, 55, 0.12)', background: 'rgba(0, 0, 0, 0.25)' }}>
        {user ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', overflow: 'hidden' }}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #d4af37' }} />
                ) : (
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #d4af37, #997825)', color: '#07111e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem' }}>
                    {user.displayName?.[0] || 'U'}
                  </div>
                )}
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.76rem', color: '#f8f5ee' }}>
                  {user.displayName || user.email?.split('@')[0]}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                style={{ background: 'none', border: 'none', color: '#8a9eb5', cursor: 'pointer', padding: '0.25rem' }}
                onMouseEnter={e => e.currentTarget.style.color = '#f05050'}
                onMouseLeave={e => e.currentTarget.style.color = '#8a9eb5'}
              >
                <LogOut size={15} />
              </button>
            </div>

            <button
              onClick={onOpenFamilyAccess}
              className="btn-ghost"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.72rem', padding: '0.4rem 0.5rem' }}
            >
              <Users size={13} /> Family Access
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            className="btn-ghost"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', padding: '0.45rem 0.6rem' }}
          >
            <LogIn size={13} /> Sign in with Google
          </button>
        )}
      </div>

      {/* Maritime Footer */}
      <div style={{ padding: '0.85rem 1rem', borderTop: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' }}>
        <p style={{ fontSize: '0.62rem', color: '#566a82', letterSpacing: '0.12em', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
          <span>NAVIGATING FOREVER</span>
          <Compass size={11} color="#d4af37" />
        </p>
      </div>
    </aside>
  )
}
