import { useState, useEffect } from 'react'
import { DollarSign, Plus, Trash2, Check, TrendingUp, Loader2, X, Edit2 } from 'lucide-react'
import {
  subscribeBudget,
  subscribeBudgetSettings,
  saveTotalBudget as dbSaveTotalBudget,
  addBudgetItem as dbAddBudgetItem,
  updateBudgetItem as dbUpdateBudgetItem,
  toggleBudgetPaid as dbToggleBudgetPaid,
  deleteBudgetItem as dbDeleteBudgetItem,
} from '../services/db'

const BUDGET_CATEGORIES = [
  { name: 'Venue', color: '#c9a84c', emoji: '🏛️' },
  { name: 'Catering', color: '#48c78e', emoji: '🍽️' },
  { name: 'Photography', color: '#3273dc', emoji: '📸' },
  { name: 'Attire', color: '#ff6b9d', emoji: '👗' },
  { name: 'Flowers', color: '#f05050', emoji: '🌸' },
  { name: 'Music & DJ', color: '#a855f7', emoji: '🎵' },
  { name: 'Cake', color: '#f0b030', emoji: '🎂' },
  { name: 'Invitations', color: '#20c997', emoji: '📬' },
  { name: 'Honeymoon', color: '#fd7e14', emoji: '✈️' },
  { name: 'Other', color: '#8899aa', emoji: '📋' },
]

export default function BudgetTracker() {
  const [items, setItems] = useState([])
  const [totalBudget, setTotalBudget] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'Other', amount: '', paid: false })
  const [adding, setAdding] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [editingBudget, setEditingBudget] = useState(false)
  const [tempBudget, setTempBudget] = useState('')

  // Real-time Firestore sync
  useEffect(() => {
    const unsubBudget = subscribeBudget((list) => {
      setItems(list)
      setLoading(false)
    })
    const unsubSettings = subscribeBudgetSettings((budget) => {
      setTotalBudget(budget)
    })
    return () => {
      unsubBudget && unsubBudget()
      unsubSettings && unsubSettings()
    }
  }, [])

  const handleStartAdd = () => {
    setEditingItem(null)
    setForm({ name: '', category: 'Other', amount: '', paid: false })
    setAdding(true)
  }

  const handleStartEdit = (item) => {
    setEditingItem(item)
    setForm({
      name: item.name || '',
      category: item.category || 'Other',
      amount: item.amount || '',
      paid: Boolean(item.paid)
    })
    setAdding(true)
  }

  const handleSaveItem = async () => {
    if (!form.name.trim() || !form.amount) return
    setSaving(true)
    try {
      if (editingItem) {
        await dbUpdateBudgetItem(editingItem.id, {
          name: form.name.trim(),
          category: form.category,
          amount: parseFloat(form.amount),
          paid: Boolean(form.paid)
        })
      } else {
        await dbAddBudgetItem({
          name: form.name.trim(),
          category: form.category,
          amount: parseFloat(form.amount),
          paid: Boolean(form.paid)
        })
      }
      setForm({ name: '', category: 'Other', amount: '', paid: false })
      setEditingItem(null)
      setAdding(false)
    } catch (err) {
      console.error('Failed to save expense:', err)
      alert('Could not save expense: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBudget = async () => {
    const amount = parseFloat(tempBudget) || 0
    try {
      await dbSaveTotalBudget(amount)
      setEditingBudget(false)
    } catch (err) {
      console.error('Failed to save budget:', err)
    }
  }

  const handleRemoveItem = async (id) => {
    try {
      await dbDeleteBudgetItem(id)
    } catch (err) {
      console.error('Failed to delete expense:', err)
    }
  }

  const handleTogglePaid = async (id, currentPaid) => {
    try {
      await dbToggleBudgetPaid(id, currentPaid)
    } catch (err) {
      console.error('Failed to toggle paid status:', err)
    }
  }

  const totalSpent = items.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const totalPaid = items.filter(i => i.paid).reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const remaining = totalBudget - totalSpent
  const progress = totalBudget ? Math.min((totalSpent / totalBudget) * 100, 100) : 0

  // Per category totals
  const catTotals = {}
  items.forEach(i => {
    catTotals[i.category] = (catTotals[i.category] || 0) + (Number(i.amount) || 0)
  })

  return (
    <div className="animate-fade-in" style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <DollarSign size={22} color="#c9a84c" />
          <div>
            <h2 className="font-serif" style={{ fontSize: '2rem', color: '#c9a84c', margin: 0 }}>Budget Tracker</h2>
            <p style={{ color: '#8899aa', fontSize: '0.78rem', margin: '0.2rem 0 0' }}>
              Track expenses & manage your wedding budget
            </p>
          </div>
        </div>
        <button className="btn-gold" onClick={() => (adding ? setAdding(false) : handleStartAdd())}>
          {adding && !editingItem ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Add Expense</>}
        </button>
      </div>

      <div className="gold-divider" style={{ marginBottom: '1.5rem' }} />

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Total Budget */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.68rem', color: '#8899aa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Total Budget</div>
          {editingBudget ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input className="input-base" type="number" placeholder="Amount" value={tempBudget}
                onChange={e => setTempBudget(e.target.value)} style={{ fontSize: '0.85rem' }} />
              <button className="btn-gold" style={{ padding: '0.4rem 0.6rem' }} onClick={handleSaveBudget}>
                <Check size={12} />
              </button>
            </div>
          ) : (
            <div>
              <div className="font-serif" style={{ fontSize: '1.6rem', color: '#f5f0e8' }}>
                Rs. {Number(totalBudget).toLocaleString()}
              </div>
              <button className="btn-ghost" style={{ marginTop: '0.5rem', fontSize: '0.68rem', padding: '0.25rem 0.6rem' }}
                onClick={() => { setTempBudget(totalBudget || ''); setEditingBudget(true) }}>
                Set Budget
              </button>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.68rem', color: '#8899aa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Total Spent</div>
          <div className="font-serif" style={{ fontSize: '1.6rem', color: '#f05050' }}>Rs. {totalSpent.toLocaleString()}</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.68rem', color: '#8899aa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Remaining</div>
          <div className="font-serif" style={{ fontSize: '1.6rem', color: remaining >= 0 ? '#48c78e' : '#f05050' }}>
            Rs. {Math.abs(remaining).toLocaleString()}{remaining < 0 ? ' over!' : ''}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.68rem', color: '#8899aa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Paid</div>
          <div className="font-serif" style={{ fontSize: '1.6rem', color: '#c9a84c' }}>Rs. {totalPaid.toLocaleString()}</div>
        </div>
      </div>

      {/* Progress bar */}
      {totalBudget > 0 && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#8899aa', marginBottom: '0.5rem' }}>
            <span>Budget Used</span>
            <span style={{ color: progress > 90 ? '#f05050' : '#c9a84c' }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: progress > 90 ? 'linear-gradient(90deg, #f05050, #ff6b6b)' : 'linear-gradient(90deg, #c9a84c, #e8c97a)',
              borderRadius: '999px',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      )}

      {/* Add / Edit form */}
      {adding && (
        <div className="card animate-fade-in" style={{ padding: '1.25rem', marginBottom: '1.5rem', borderColor: 'rgba(201,168,76,0.4)' }}>
          <h3 className="font-serif" style={{ color: '#c9a84c', fontSize: '1.1rem', margin: '0 0 1rem' }}>
            {editingItem ? '✦ Edit Expense' : '✦ New Expense'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Description *</label>
              <input className="input-base" placeholder="e.g. Venue deposit" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                autoFocus />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select className="input-base" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {BUDGET_CATEGORIES.map(c => <option key={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Amount (Rs.) *</label>
              <input className="input-base" type="number" placeholder="0" value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.3rem' }}>
              <input type="checkbox" id="paid-cb" checked={form.paid}
                onChange={e => setForm(p => ({ ...p, paid: e.target.checked }))}
                style={{ accentColor: '#c9a84c' }} />
              <label htmlFor="paid-cb" style={{ fontSize: '0.8rem', color: '#8899aa', cursor: 'pointer' }}>Already Paid</label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button className="btn-gold" onClick={handleSaveItem} disabled={!form.name.trim() || !form.amount || saving}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Check size={14} /> {editingItem ? 'Update Expense' : 'Add Expense'}</>}
            </button>
            <button className="btn-ghost" onClick={() => { setAdding(false); setEditingItem(null) }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {Object.keys(catTotals).length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {BUDGET_CATEGORIES.filter(c => catTotals[c.name]).map(c => (
            <div key={c.name} style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '999px',
              background: `${c.color}18`,
              border: `1px solid ${c.color}44`,
              fontSize: '0.72rem',
              color: c.color,
              display: 'flex', gap: '0.35rem', alignItems: 'center',
            }}>
              <span>{c.emoji}</span>
              <span>{c.name}: Rs. {catTotals[c.name].toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Item list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#c9a84c' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontSize: '0.85rem', color: '#8899aa' }}>Syncing budget items...</p>
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#8899aa' }}>
          <TrendingUp size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <p className="font-serif" style={{ fontSize: '1.1rem' }}>No expenses yet — start tracking your budget!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map(item => {
            const cat = BUDGET_CATEGORIES.find(c => c.name === item.category) || BUDGET_CATEGORIES.at(-1)
            return (
              <div key={item.id} className="card animate-fade-in" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{
                  fontSize: '1.4rem', flexShrink: 0,
                  width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${cat.color}18`, borderRadius: '8px',
                }}>{cat.emoji}</div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', fontSize: '0.9rem', color: '#f5f0e8' }}>{item.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#8899aa' }}>{item.category}</div>
                </div>

                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: '#f5f0e8' }}>
                  Rs. {Number(item.amount).toLocaleString()}
                </div>

                <button onClick={() => handleTogglePaid(item.id, item.paid)} style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  border: 'none',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  fontFamily: 'Montserrat, sans-serif',
                  cursor: 'pointer',
                  background: item.paid ? 'rgba(72,199,142,0.2)' : 'rgba(255,255,255,0.08)',
                  color: item.paid ? '#48c78e' : '#8899aa',
                }}>
                  {item.paid ? '✓ Paid' : 'Mark Paid'}
                </button>

                {/* Edit Button */}
                <button
                  onClick={() => handleStartEdit(item)}
                  title="Edit Expense"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8899aa', padding: '0.25rem', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#c9a84c'}
                  onMouseLeave={e => e.currentTarget.style.color = '#8899aa'}
                >
                  <Edit2 size={14} />
                </button>

                {/* Delete Button */}
                <button onClick={() => handleRemoveItem(item.id)}
                  title="Delete Expense"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8899aa66', padding: '0.25rem', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#f05050'}
                  onMouseLeave={e => e.currentTarget.style.color = '#8899aa66'}>
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '0.7rem',
  color: '#8899aa',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '0.3rem',
}
