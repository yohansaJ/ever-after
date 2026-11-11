import { useState, useEffect } from 'react'
import { CheckSquare, Plus, Trash2, Check, Circle, Loader2, X, Edit2 } from 'lucide-react'
import { subscribeTodos, addTodo as dbAddTodo, updateTodo as dbUpdateTodo, toggleTodo as dbToggleTodo, deleteTodo as dbDeleteTodo } from '../services/db'

const CATEGORIES = ['All', 'Venue', 'Catering', 'Attire', 'Flowers', 'Photography', 'Music', 'Invitations', 'Other']
const PRIORITIES = ['High', 'Medium', 'Low']

const PRIORITY_COLORS = {
  High: '#f05050',
  Medium: '#f0b030',
  Low: '#48c78e',
}

export default function TodoList() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ text: '', category: 'Other', priority: 'Medium', deadline: '' })
  const [adding, setAdding] = useState(false)
  const [editingTodo, setEditingTodo] = useState(null)
  const [filterCat, setFilterCat] = useState('All')
  const [filterDone, setFilterDone] = useState('All')

  // Real-time Firestore sync
  useEffect(() => {
    const unsub = subscribeTodos((list) => {
      setTodos(list)
      setLoading(false)
    })
    return () => unsub && unsub()
  }, [])

  const handleStartAdd = () => {
    setEditingTodo(null)
    setForm({ text: '', category: 'Other', priority: 'Medium', deadline: '' })
    setAdding(true)
  }

  const handleStartEdit = (todo) => {
    setEditingTodo(todo)
    setForm({
      text: todo.text || '',
      category: todo.category || 'Other',
      priority: todo.priority || 'Medium',
      deadline: todo.deadline || ''
    })
    setAdding(true)
  }

  const handleSaveTodo = async () => {
    if (!form.text.trim()) return
    setSaving(true)
    try {
      if (editingTodo) {
        await dbUpdateTodo(editingTodo.id, {
          text: form.text.trim(),
          category: form.category,
          priority: form.priority,
          deadline: form.deadline
        })
      } else {
        await dbAddTodo(form)
      }
      setForm({ text: '', category: 'Other', priority: 'Medium', deadline: '' })
      setEditingTodo(null)
      setAdding(false)
    } catch (err) {
      console.error('Failed to save task:', err)
      alert('Could not save task to cloud: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id, currentDone) => {
    try {
      await dbToggleTodo(id, currentDone)
    } catch (err) {
      console.error('Failed to toggle task:', err)
    }
  }

  const handleRemove = async (id) => {
    try {
      await dbDeleteTodo(id)
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }

  const filtered = todos.filter(t => {
    const matchCat = filterCat === 'All' || t.category === filterCat
    const matchDone = filterDone === 'All' || (filterDone === 'Done' ? t.done : !t.done)
    return matchCat && matchDone
  })

  const doneCount = todos.filter(t => t.done).length
  const progress = todos.length ? Math.round((doneCount / todos.length) * 100) : 0

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckSquare size={22} color="#c9a84c" />
            <h2 className="font-serif" style={{ fontSize: '2rem', color: '#c9a84c', margin: 0 }}>To-Do List</h2>
          </div>
          <p style={{ color: '#8899aa', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
            {doneCount} of {todos.length} tasks completed
          </p>
        </div>
        <button className="btn-gold" onClick={() => (adding ? setAdding(false) : handleStartAdd())}>
          {adding && !editingTodo ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Add Task</>}
        </button>
      </div>

      <div className="gold-divider" style={{ marginBottom: '1.25rem' }} />

      {/* Progress bar */}
      {todos.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#8899aa', marginBottom: '0.4rem' }}>
            <span>Overall Progress</span>
            <span style={{ color: '#c9a84c' }}>{progress}%</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #c9a84c, #e8c97a)',
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
            {editingTodo ? '✦ Edit Task' : '✦ New Task'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Task *</label>
              <input className="input-base" placeholder="What needs to be done?" value={form.text}
                onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && !saving && handleSaveTodo()}
                autoFocus />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select className="input-base" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select className="input-base" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Deadline</label>
              <input type="date" className="input-base" value={form.deadline}
                onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button className="btn-gold" onClick={handleSaveTodo} disabled={!form.text.trim() || saving}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Check size={14} /> {editingTodo ? 'Update Task' : 'Add Task'}</>}
            </button>
            <button className="btn-ghost" onClick={() => { setAdding(false); setEditingTodo(null) }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {['All', 'Pending', 'Done'].map(opt => (
          <button key={opt} onClick={() => setFilterDone(opt)}
            style={filterPillStyle(filterDone === opt)}>
            {opt}
          </button>
        ))}
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 0.25rem' }} />
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            style={filterPillStyle(filterCat === cat)}>
            {cat}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#c9a84c' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontSize: '0.85rem', color: '#8899aa' }}>Syncing tasks...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#8899aa' }}>
          <CheckSquare size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <p className="font-serif" style={{ fontSize: '1.1rem' }}>No tasks here yet!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(t => (
            <div key={t.id} className="card animate-fade-in" style={{
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              opacity: t.done ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}>
              <button onClick={() => handleToggle(t.id, t.done)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: '0.1rem', color: t.done ? '#48c78e' : '#8899aa' }}>
                {t.done ? <Check size={18} /> : <Circle size={18} />}
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: '500', fontSize: '0.9rem', color: '#f5f0e8',
                  textDecoration: t.done ? 'line-through' : 'none',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{t.text}</div>
                <div style={{ fontSize: '0.72rem', color: '#8899aa', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                  <span>{t.category}</span>
                  {t.deadline && <span>· Due {new Date(t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                </div>
              </div>

              <span style={{
                padding: '0.15rem 0.6rem',
                borderRadius: '999px',
                fontSize: '0.65rem',
                fontWeight: '600',
                background: `${PRIORITY_COLORS[t.priority] || '#8899aa'}22`,
                color: PRIORITY_COLORS[t.priority] || '#8899aa',
                flexShrink: 0,
              }}>{t.priority}</span>

              {/* Edit button */}
              <button
                onClick={() => handleStartEdit(t)}
                title="Edit Task"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8899aa', padding: '0.25rem', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#c9a84c'}
                onMouseLeave={e => e.currentTarget.style.color = '#8899aa'}
              >
                <Edit2 size={14} />
              </button>

              {/* Delete button */}
              <button onClick={() => handleRemove(t.id)}
                title="Delete Task"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8899aa66', padding: '0.25rem', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#f05050'}
                onMouseLeave={e => e.currentTarget.style.color = '#8899aa66'}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
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

function filterPillStyle(active) {
  return {
    padding: '0.3rem 0.75rem',
    borderRadius: '999px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.72rem',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: active ? '600' : '400',
    background: active ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.05)',
    color: active ? '#c9a84c' : '#8899aa',
    transition: 'all 0.2s',
  }
}
