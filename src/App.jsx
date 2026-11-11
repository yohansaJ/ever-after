import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import GuestList from './components/GuestList'
import TodoList from './components/TodoList'
import BudgetTracker from './components/BudgetTracker'
import DressMoodBoard from './components/DressMoodBoard'
import RSVPResponses from './components/RSVPResponses'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { subscribeWeddingDetails, saveWeddingDetails } from './services/db'
import './index.css'

function App() {
  const [activeView, setActiveView] = useState('dashboard')
  const [user, setUser] = useState(null)
  
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
    })
    return () => unsub()
  }, [])

  // Listen to Firestore Wedding Settings (sync across all devices)
  useEffect(() => {
    const unsub = subscribeWeddingDetails((data) => {
      if (data) {
        if (data.weddingDate) {
          setWeddingDateState(data.weddingDate)
          localStorage.setItem('weddingDate', data.weddingDate)
        }
        if (data.coupleNames) {
          setCoupleNamesState(data.coupleNames)
          localStorage.setItem('coupleNames', JSON.stringify(data.coupleNames))
        }
      }
    })
    return () => unsub && unsub()
  }, [])

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
      />
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxHeight: '100vh' }}>
        {renderView()}
      </main>
    </div>
  )
}

export default App
