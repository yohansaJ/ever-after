import { useState, useEffect } from 'react'
import { Users, CheckSquare, DollarSign, Heart, Edit2, Check, X, CalendarHeart, MailCheck, Anchor, Compass, Waves } from 'lucide-react'
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
            background: 'linear-gradient(180deg, rgba(212,175,55,0.14) 0%, rgba(9,21,36,0.85) 100%)',
            border: '1px solid rgba(212,175,55,0.35)',
            borderRadius: '12px',
            padding: '0.85rem 1.4rem',
            minWidth: '76px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(244,226,161,0.2)',
          }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.4rem', color: '#f4e2a1', lineHeight: 1, fontWeight: 600 }}>
              {String(val).padStart(2, '0')}
            </div>
            <div style={{ fontSize: '0.62rem', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: '0.35rem', fontWeight: 500 }}>
              {unit}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color = '#d4af37', onClick }) {
  return (
    <div
      className="card animate-fade-in"
      onClick={onClick}
      style={{
        padding: '1.35rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.borderColor = 'rgba(212,175,55,0.55)'
          e.currentTarget.style.transform = 'translateY(-3px)'
          e.currentTarget.style.boxShadow = '0 12px 28px -5px rgba(212,175,55,0.2)'
        }
      }}
      onMouseLeave={e => {
        if (onClick) {
          e.currentTarget.style.borderColor = 'rgba(212,175,55,0.18)'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <div style={{
          background: `${color}18`,
          border: `1px solid ${color}33`,
          borderRadius: '10px',
          padding: '0.55rem',
          display: 'flex',
        }}>
          <Icon size={18} color={color} />
        </div>
        <span style={{ fontSize: '0.72rem', color: '#8a9eb5', textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 500 }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.1rem', color: '#f8f5ee', fontWeight: 500, lineHeight: 1.1 }}>
        {value}
      </div>
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
    { icon: Users, label: 'Guests', value: guestCount, view: 'guests', color: '#d4af37' },
    { icon: MailCheck, label: 'RSVPs Received', value: rsvpCount, view: 'rsvps', color: '#48c78e' },
    { icon: CheckSquare, label: 'Tasks Pending', value: todoCount, view: 'todos', color: '#e8c97a' },
    { icon: DollarSign, label: 'Total Spent', value: `Rs. ${totalSpent.toLocaleString()}`, view: 'budget', color: '#f0b030' },
    { icon: Heart, label: 'Mood Board Items', value: moodCount, view: 'dresses', color: '#ff6b9d' },
  ]

  return (
    <div className="animate-fade-in" style={{ maxWidth: '940px', margin: '0 auto' }}>
      
      {/* ── Maritime Luxury Header ── */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        
        {/* Emblem Crest */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
          <div style={{ height: '1px', width: '40px', background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.6))' }} />
          <div style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(10,25,47,0.8) 100%)',
            border: '1px solid rgba(212,175,55,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(212,175,55,0.25)',
          }}>
            <Anchor size={18} color="#d4af37" />
          </div>
          <div style={{ height: '1px', width: '40px', background: 'linear-gradient(90deg, rgba(212,175,55,0.6), transparent)' }} />
        </div>

        {editingNames ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input className="input-base" style={{ maxWidth: '170px' }} value={tempNames.bride}
              onChange={e => setTempNames(p => ({ ...p, bride: e.target.value }))} placeholder="Bride's name" />
            <span style={{ color: '#d4af37', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem' }}>&</span>
            <input className="input-base" style={{ maxWidth: '170px' }} value={tempNames.groom}
              onChange={e => setTempNames(p => ({ ...p, groom: e.target.value }))} placeholder="Groom's name" />
            <button className="btn-gold" onClick={() => { setCoupleNames(tempNames); setEditingNames(false) }}><Check size={14} /></button>
            <button className="btn-ghost" onClick={() => setEditingNames(false)}><X size={14} /></button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <h1 className="font-serif" style={{ fontSize: '3.3rem', color: '#f4e2a1', margin: 0, fontWeight: 400, letterSpacing: '0.03em', textShadow: '0 2px 20px rgba(212,175,55,0.3)' }}>
              {coupleNames?.bride || 'Bride'} <span style={{ color: '#d4af37', fontStyle: 'italic', fontWeight: 300 }}>&</span> {coupleNames?.groom || 'Groom'}
            </h1>
            <button onClick={() => { setTempNames(coupleNames); setEditingNames(true) }}
              title="Edit Names"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a9eb5', padding: '0.25rem' }}>
              <Edit2 size={15} />
            </button>
          </div>
        )}

        <p style={{ color: '#8a9eb5', fontSize: '0.75rem', letterSpacing: '0.22em', textTransform: 'uppercase', margin: '0.6rem 0 1.25rem', fontWeight: 500 }}>
          Navigating Eternal Love ✦ Wedding Planner
        </p>

        <div className="gold-divider" style={{ maxWidth: '420px', margin: '0 auto' }} />
      </div>

      {/* ── Chronometer Countdown ── */}
      <div className="card" style={{ padding: '2.25rem 2rem', marginBottom: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        
        {/* Decorative corner emblems */}
        <div style={{ position: 'absolute', top: '12px', left: '16px', opacity: 0.25 }}>
          <Compass size={22} color="#d4af37" />
        </div>
        <div style={{ position: 'absolute', top: '12px', right: '16px', opacity: 0.25 }}>
          <Anchor size={22} color="#d4af37" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.55rem', marginBottom: '1.25rem' }}>
          <CalendarHeart size={18} color="#d4af37" />
          <span className="font-serif" style={{ fontSize: '1.35rem', color: '#f4e2a1', letterSpacing: '0.04em' }}>
            {weddingDate ? `The Voyage Begins — ${new Date(weddingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : 'Set Your Wedding Date'}
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
            {weddingDate ? (
              <CountdownTimer weddingDate={weddingDate} />
            ) : (
              <p style={{ color: '#8a9eb5', fontSize: '0.85rem' }}>Set your wedding date to see the captain's chronometer countdown</p>
            )}
            
            <button className="btn-ghost" style={{ margin: '1.25rem auto 0', display: 'inline-flex' }}
              onClick={() => { setTempDate(weddingDate); setEditingDate(true) }}>
              <Edit2 size={12} /> {weddingDate ? 'Change Date' : 'Set Date'}
            </button>
          </div>
        )}
      </div>

      {/* ── Stats Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map(s => (
          <StatCard key={s.label} {...s} onClick={() => setActiveView(s.view)} />
        ))}
      </div>

      {/* ── Seaman's Romantic Quote Card ── */}
      <div className="card" style={{
        padding: '2rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(28, 59, 99, 0.25) 0%, rgba(7, 17, 30, 0.8) 100%)',
        borderColor: 'rgba(212, 175, 55, 0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '0.75rem', color: '#d4af37' }}>
          <Waves size={16} />
          <Anchor size={16} />
          <Waves size={16} />
        </div>
        
        <p className="font-serif" style={{
          fontSize: '1.3rem',
          color: '#f8f5ee',
          fontStyle: 'italic',
          margin: '0 0 0.6rem',
          lineHeight: 1.6,
          fontWeight: 400,
        }}>
          "No matter how wide the oceans or how distant the horizon, love is the anchor that always guides us home."
        </p>
        
        <p style={{ fontSize: '0.72rem', color: '#d4af37', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0, fontWeight: 500 }}>
          Fair Winds & Eternal Love · Ever After
        </p>
      </div>

    </div>
  )
}
