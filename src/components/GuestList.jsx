import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Check, FileSpreadsheet, X, Loader2, Edit2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { subscribeGuests, addGuest as dbAddGuest, updateGuest as dbUpdateGuest, updateGuestStatus as dbUpdateGuestStatus, deleteGuest as dbDeleteGuest } from '../services/db'

const STATUS_OPTIONS = ['Invited', 'Confirmed', 'Declined']

const STATUS_STYLES = {
  Invited:   { bg: 'rgba(255,180,0,0.15)',    text: '#f0b030', dot: '#f0b030' },
  Confirmed: { bg: 'rgba(72,199,142,0.15)',   text: '#48c78e', dot: '#48c78e' },
  Declined:  { bg: 'rgba(240,80,80,0.15)',    text: '#f05050', dot: '#f05050' },
}

export default function GuestList() {
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('Invited')
  const [adding, setAdding] = useState(false)
  const [editingGuest, setEditingGuest] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  // Real-time Firestore sync
  useEffect(() => {
    const unsub = subscribeGuests((list) => {
      setGuests(list)
      setLoading(false)
    })
    return () => unsub && unsub()
  }, [])

  // Counts
  const total     = guests.length
  const invited   = guests.filter(g => g.status === 'Invited').length
  const confirmed = guests.filter(g => g.status === 'Confirmed').length
  const declined  = guests.filter(g => g.status === 'Declined').length

  const handleStartAdd = () => {
    setEditingGuest(null)
    setName('')
    setNotes('')
    setStatus('Invited')
    setAdding(true)
  }

  const handleStartEdit = (guest) => {
    setEditingGuest(guest)
    setName(guest.name || '')
    setNotes(guest.notes || '')
    setStatus(guest.status || 'Invited')
    setAdding(true)
  }

  const handleSaveGuest = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      if (editingGuest) {
        // Update existing guest
        await dbUpdateGuest(editingGuest.id, {
          name: name.trim(),
          notes: notes.trim(),
          status: status
        })
      } else {
        // Add new guest
        await dbAddGuest({
          name: name.trim(),
          notes: notes.trim(),
          status: status || 'Invited',
          addedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        })
      }
      setName('')
      setNotes('')
      setEditingGuest(null)
      setAdding(false)
    } catch (err) {
      console.error('Failed to save guest:', err)
      alert('Could not save guest to cloud: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveGuest = async (id) => {
    try {
      await dbDeleteGuest(id)
      setDeleteId(null)
    } catch (err) {
      console.error('Failed to delete guest:', err)
      alert('Could not delete guest: ' + err.message)
    }
  }

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await dbUpdateGuestStatus(id, newStatus)
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const exportExcel = () => {
    const rows = guests.map((g, i) => ({
      '#': i + 1,
      'Guest Name': g.name,
      'Status': g.status,
      'Notes': g.notes || '',
      'Added On': g.addedAt || '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 4 }, { wch: 28 }, { wch: 14 }, { wch: 36 }, { wch: 16 }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Guest List')
    XLSX.writeFile(wb, 'Wedding_Guest_List.xlsx')
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={22} color="#c9a84c" />
            <h2 className="font-serif" style={{ fontSize: '2rem', color: '#c9a84c', margin: 0 }}>Guest List</h2>
          </div>
          <p style={{ color: '#8899aa', fontSize: '0.78rem', margin: '0.3rem 0 0', letterSpacing: '0.03em' }}>
            Manage and edit your wedding guests
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {total > 0 && (
            <button className="btn-ghost" onClick={exportExcel}>
              <FileSpreadsheet size={14} /> Export Excel
            </button>
          )}
          <button className="btn-gold" onClick={() => (adding ? setAdding(false) : handleStartAdd())}>
            {adding && !editingGuest ? <><X size={14} /> Cancel</> : <><Plus size={15} /> Add Guest</>}
          </button>
        </div>
      </div>

      <div className="gold-divider" style={{ marginBottom: '1.5rem' }} />

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        {[
          { label: 'Total Guests', value: total,     color: '#c9a84c', emoji: '👥' },
          { label: 'Invited',      value: invited,   color: '#f0b030', emoji: '💌' },
          { label: 'Confirmed',    value: confirmed, color: '#48c78e', emoji: '✅' },
          { label: 'Declined',     value: declined,  color: '#f05050', emoji: '❌' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '1.1rem 1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>{s.emoji}</div>
            <div className="font-serif" style={{ fontSize: '2rem', color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.65rem', color: '#8899aa', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.3rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Add/Edit Guest Form ── */}
      {adding && (
        <div className="card animate-fade-in" style={{ padding: '1.25rem', marginBottom: '1.5rem', borderColor: 'rgba(201,168,76,0.4)' }}>
          <h3 className="font-serif" style={{ color: '#e8c97a', fontSize: '1.15rem', margin: '0 0 1rem' }}>
            {editingGuest ? '✦ Edit Guest Details' : '✦ Add New Guest'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Guest Name *</label>
              <input
                className="input-base"
                placeholder="e.g. Sanduni Perera"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !saving && handleSaveGuest()}
                autoFocus
              />
            </div>
            <div>
              <label style={labelStyle}>Notes</label>
              <input
                className="input-base"
                placeholder="e.g. Vegetarian, bringing +1, needs wheelchair access…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !saving && handleSaveGuest()}
              />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                className="input-base"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button className="btn-gold" onClick={handleSaveGuest} disabled={!name.trim() || saving}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Check size={14} /> {editingGuest ? 'Update Guest' : 'Add to List'}</>}
            </button>
            <button className="btn-ghost" onClick={() => { setAdding(false); setEditingGuest(null); setName(''); setNotes('') }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Loading & Table ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#c9a84c' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontSize: '0.85rem', color: '#8899aa' }}>Syncing guests with cloud...</p>
        </div>
      ) : guests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#8899aa' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem', opacity: 0.4 }}>👰🤵</div>
          <p className="font-serif" style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#a0aaba' }}>
            No guests added yet
          </p>
          <p style={{ fontSize: '0.8rem' }}>Click "Add Guest" to start building your guest list</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(201,168,76,0.2)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(201,168,76,0.08)', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
                {['#', 'Guest Name', 'Notes', 'Status', 'Added On', 'Actions'].map((h, i) => (
                  <th key={i} style={{
                    padding: '0.9rem 1rem',
                    textAlign: i === 0 ? 'center' : i === 5 ? 'right' : 'left',
                    fontSize: '0.65rem',
                    fontWeight: '600',
                    color: '#c9a84c',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    whiteSpace: 'nowrap',
                    fontFamily: 'Montserrat, sans-serif',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guests.map((g, idx) => (
                <tr key={g.id}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'}
                >
                  {/* # */}
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: '#8899aa', fontSize: '0.75rem', width: '48px' }}>
                    {idx + 1}
                  </td>

                  {/* Name */}
                  <td style={{ padding: '0.85rem 1rem', minWidth: '160px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #c9a84c55, #7a5c2055)',
                        border: '1px solid rgba(201,168,76,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Cormorant Garamond, serif', fontSize: '0.95rem', color: '#c9a84c',
                      }}>
                        {g.name[0]?.toUpperCase() || 'G'}
                      </div>
                      <span style={{ fontWeight: '500', color: '#f5f0e8' }}>{g.name}</span>
                    </div>
                  </td>

                  {/* Notes */}
                  <td style={{ padding: '0.85rem 1rem', color: '#8899aa', fontSize: '0.8rem', maxWidth: '280px' }}>
                    {g.notes
                      ? <span style={{ fontStyle: 'italic' }}>{g.notes}</span>
                      : <span style={{ opacity: 0.3 }}>—</span>
                    }
                  </td>

                  {/* Status */}
                  <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                    <select
                      value={g.status || 'Invited'}
                      onChange={e => handleUpdateStatus(g.id, e.target.value)}
                      style={{
                        background: (STATUS_STYLES[g.status] || STATUS_STYLES.Invited).bg,
                        color: (STATUS_STYLES[g.status] || STATUS_STYLES.Invited).text,
                        border: `1px solid ${(STATUS_STYLES[g.status] || STATUS_STYLES.Invited).text}44`,
                        borderRadius: '999px',
                        padding: '0.25rem 0.8rem',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        fontFamily: 'Montserrat, sans-serif',
                        cursor: 'pointer',
                        outline: 'none',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        textAlign: 'center',
                      }}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s} style={{ background: '#1a2d42', color: '#f5f0e8' }}>{s}</option>
                      ))}
                    </select>
                  </td>

                  {/* Added on */}
                  <td style={{ padding: '0.85rem 1rem', color: '#8899aa', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    {g.addedAt || '—'}
                  </td>

                  {/* Edit & Delete Actions */}
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {deleteId === g.id ? (
                      <div style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}>
                        <button onClick={() => handleRemoveGuest(g.id)}
                          style={{ background: 'rgba(240,80,80,0.2)', border: '1px solid #f0505044', color: '#f05050', borderRadius: '6px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.68rem', fontFamily: 'Montserrat, sans-serif' }}>
                          Yes
                        </button>
                        <button onClick={() => setDeleteId(null)}
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#8899aa', borderRadius: '6px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.68rem', fontFamily: 'Montserrat, sans-serif' }}>
                          No
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          onClick={() => handleStartEdit(g)}
                          title="Edit Guest"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8899aa', padding: '0.25rem', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#c9a84c'}
                          onMouseLeave={e => e.currentTarget.style.color = '#8899aa'}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(g.id)}
                          title="Delete Guest"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8899aa66', padding: '0.25rem', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#f05050'}
                          onMouseLeave={e => e.currentTarget.style.color = '#8899aa66'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Footer row */}
            {guests.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: '1px solid rgba(201,168,76,0.2)', background: 'rgba(201,168,76,0.04)' }}>
                  <td colSpan={2} style={{ padding: '0.65rem 1rem', fontSize: '0.72rem', color: '#c9a84c', fontWeight: '600', fontFamily: 'Montserrat, sans-serif' }}>
                    Total: {total} guest{total !== 1 ? 's' : ''}
                  </td>
                  <td colSpan={4} style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>
                    <button className="btn-ghost" onClick={exportExcel} style={{ fontSize: '0.72rem', padding: '0.3rem 0.8rem' }}>
                      <FileSpreadsheet size={12} /> Download Excel
                    </button>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '0.68rem',
  color: '#8899aa',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '0.3rem',
}
