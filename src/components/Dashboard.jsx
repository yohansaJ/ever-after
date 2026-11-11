import { useState, useEffect } from 'react'
import { Users, CheckSquare, DollarSign, Heart, Edit2, Check, X, CalendarHeart, MailCheck } from 'lucide-react'
import { subscribeGuests, subscribeTodos, subscribeBudget, subscribeMoodBoard, subscribeRsvps } from '../services/db'

function CountdownTimer({ weddingDate }) {
  const [timeLeft, setTimeLeft] = useState({})

  useEffect(() => {
    const calc = () => {
      if (!weddingDate) return
      const target = new Date(weddingDate)
      const now = new Date()
      const diff = target - now
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [weddingDate])

  if (!weddingDate) return null

  return (
    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
      {Object.entries(timeLeft).map(([unit, val]) => (
        <div key={unit} style={{ textAlign: 'center' }}>
          <div style={{
            background: 'rgba(201,168,76,0.12)',
            border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: '10px',
            padding: '0.75rem 1.25rem',
            minWidth: '70px',
          }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.2rem', color: '#c9a84c', lineHeight: 1 }}>
              {String(val).padStart(2, '0')}
            </div>
            <div style={{ fontSize: '0.6rem', color: '#8899aa', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.25rem' }}>
              {unit}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color = '#c9a84c', onClick }) {
  return (
    <div
      className="card animate-fade-in"
      onClick={onClick}
      style={{
        padding: '1.25rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, border-color 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)' }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div style={{
          background: `${color}22`,
          borderRadius: '8px',
          padding: '0.5rem',
          display: 'flex',
        }}>
          <Icon size={18} color={color} />
        </div>
        <span style={{ fontSize: '0.75rem', color: '#8899aa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', color: '#f5f0e8' }}>{value}</div>
    </div>
  )
}

export default function Dashboard({ weddingDate, setWeddingDate, coupleNames, setCoupleNames, setActiveView }) {
  const [editingDate, setEditingDate] = useState(false)
  const [editingNames, setEditingNames] = useState(false)
  const [tempDate, setTempDate] = useState(weddingDate || '')
  const [tempNames, setTempNames] = useState(coupleNames || { bride: 'Bride', groom: 'Groom' })

  const [guestCount, setGuestCount] = useState(0)
  const [todoCount, setTodoCount] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)
  const [moodCount, setMoodCount] = useState(0)
  const [rsvpCount, setRsvpCount] = useState(0)

  // Real-time Firestore counters
  useEffect(() => {
    const unsubG = subscribeGuests((list) => setGuestCount(list.length))
    const unsubT = subscribeTodos((list) => setTodoCount(list.filter(t => !t.done).length))
    const unsubB = subscribeBudget((list) => {
      const spent = list.reduce((s, b) => s + (Number(b.amount) || 0), 0)
      setTotalSpent(spent)
    })
    const unsubM = subscribeMoodBoard((list) => setMoodCount(list.length))
    const unsubR = subscribeRsvps((list) => setRsvpCount(list.length))

    return () => {
      unsubG && unsubG()
      unsubT && unsubT()
      unsubB && unsubB()
      unsubM && unsubM()
      unsubR && unsubR()
    }
  }, [])

  useEffect(() => {
    if (weddingDate) setTempDate(weddingDate)
  }, [weddingDate])

  useEffect(() => {
    if (coupleNames) setTempNames(coupleNames)
  }, [coupleNames])

  const stats = [
    { icon: Users, label: 'Guests', value: guestCount, view: 'guests' },
    { icon: MailCheck, label: 'RSVPs Received', value: rsvpCount, view: 'rsvps', color: '#48c78e' },
    { icon: CheckSquare, label: 'Tasks Pending', value: todoCount, view: 'todos' },
    { icon: DollarSign, label: 'Total Spent', value: `Rs. ${totalSpent.toLocaleString()}`, view: 'budget' },
    { icon: Heart, label: 'Mood Board Items', value: moodCount, view: 'dresses' },
  ]

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        {editingNames ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input className="input-base" style={{ maxWidth: '160px' }} value={tempNames.bride}
              onChange={e => setTempNames(p => ({ ...p, bride: e.target.value }))} placeholder="Bride's name" />
            <span style={{ color: '#c9a84c', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem' }}>&</span>
            <input className="input-base" style={{ maxWidth: '160px' }} value={tempNames.groom}
              onChange={e => setTempNames(p => ({ ...p, groom: e.target.value }))} placeholder="Groom's name" />
            <button className="btn-gold" onClick={() => { setCoupleNames(tempNames); setEditingNames(false) }}><Check size={14} /></button>
            <button className="btn-ghost" onClick={() => setEditingNames(false)}><X size={14} /></button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <h1 className="font-serif" style={{ fontSize: '3rem', color: '#c9a84c', margin: 0, fontWeight: 300 }}>
              {coupleNames?.bride || 'Bride'} <span style={{ color: '#8899aa' }}>&</span> {coupleNames?.groom || 'Groom'}
            </h1>
            <button onClick={() => { setTempNames(coupleNames); setEditingNames(true) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8899aa', padding: '0.25rem' }}>
              <Edit2 size={14} />
            </button>
          </div>
        )}

        <p style={{ color: '#8899aa', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0.5rem 0 1.5rem' }}>
          Wedding Planner ✦ Your Personal Space
        </p>
        <div className="gold-divider" />
      </div>

      {/* Countdown */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <CalendarHeart size={16} color="#c9a84c" />
          <span className="font-serif" style={{ fontSize: '1.2rem', color: '#c9a84c' }}>
            {weddingDate ? `The Big Day — ${new Date(weddingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : 'Set Your Wedding Date'}
          </span>
        </div>

        {editingDate ? (
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', alignItems: 'center' }}>
            <input type="date" className="input-base" style={{ maxWidth: '200px' }} value={tempDate}
              onChange={e => setTempDate(e.target.value)} />
            <button className="btn-gold" onClick={() => { setWeddingDate(tempDate); setEditingDate(false) }}><Check size={14} /> Save</button>
            <button className="btn-ghost" onClick={() => setEditingDate(false)}><X size={14} /></button>
          </div>
        ) : (
          <div>
            {weddingDate
              ? <CountdownTimer weddingDate={weddingDate} />
              : <p style={{ color: '#8899aa', fontSize: '0.85rem' }}>Set your wedding date to see the countdown</p>
            }
            <button className="btn-ghost" style={{ margin: '1rem auto 0', display: 'flex' }}
              onClick={() => { setTempDate(weddingDate); setEditingDate(true) }}>
              <Edit2 size={12} /> {weddingDate ? 'Change Date' : 'Set Date'}
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map(s => (
          <StatCard key={s.label} {...s} onClick={() => setActiveView(s.view)} />
        ))}
      </div>

      {/* Quick note */}
      <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
        <p className="font-serif" style={{ fontSize: '1.1rem', color: '#8899aa', fontStyle: 'italic', margin: 0 }}>
          "Every love story is beautiful, but ours is my favourite."
        </p>
      </div>
    </div>
  )
}
