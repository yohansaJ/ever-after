import { useState, useEffect } from 'react'
import { MailCheck, Check, X, Trash2, FileSpreadsheet, UserPlus, Search, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { subscribeRsvps, deleteRsvp, markRsvpAdded, addGuest, subscribeGuests } from '../services/db'

export default function RSVPResponses() {
  const [rsvps, setRsvps] = useState([])
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All') // 'All' | 'Accepted' | 'Declined'
  const [deleteId, setDeleteId] = useState(null)
  const [addingId, setAddingId] = useState(null)

  // Real-time Firestore sync
  useEffect(() => {
    const unsubR = subscribeRsvps((list) => {
      setRsvps(list)
      setLoading(false)
    })
    const unsubG = subscribeGuests((list) => {
      setGuests(list)
    })
    return () => {
      unsubR && unsubR()
      unsubG && unsubG()
    }
  }, [])

  // Stats calculation
  const total = rsvps.length
  const accepted = rsvps.filter(r => r.status === 'Accepted' || r.attending === true).length
  const declined = rsvps.filter(r => r.status === 'Declined' || r.attending === false).length
  const totalHeadcount = rsvps
    .filter(r => r.status === 'Accepted' || r.attending === true)
    .reduce((sum, r) => sum + (Number(r.guestCount) || 1), 0)

  // Filter & Search
  const filtered = rsvps.filter(r => {
    const matchesSearch = (r.name || '').toLowerCase().includes(search.toLowerCase())
    const isAccepted = r.status === 'Accepted' || r.attending === true
    if (filterStatus === 'Accepted') return matchesSearch && isAccepted
    if (filterStatus === 'Declined') return matchesSearch && !isAccepted
    return matchesSearch
  })

  // Handle adding an RSVP directly into the Guest List
  const handleAddToGuestList = async (rsvp) => {
    setAddingId(rsvp.id)
    try {
      const isAccepted = rsvp.status === 'Accepted' || rsvp.attending === true
      await addGuest({
        name: rsvp.name,
        notes: `RSVP via Web (${rsvp.guestCount || 1} guest[s])`,
        status: isAccepted ? 'Confirmed' : 'Declined',
        addedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      })
      await markRsvpAdded(rsvp.id, true)
    } catch (err) {
      console.error('Failed to add to guest list:', err)
      alert('Could not add to guest list: ' + err.message)
    } finally {
      setAddingId(null)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteRsvp(id)
      setDeleteId(null)
    } catch (err) {
      console.error('Failed to delete RSVP:', err)
    }
  }

  // Check if guest already exists in guest list
  const isAlreadyInGuests = (rsvp) => {
    if (rsvp.addedToGuestList) return true
    return guests.some(g => (g.name || '').trim().toLowerCase() === (rsvp.name || '').trim().toLowerCase())
  }

  const exportExcel = () => {
    const rows = rsvps.map((r, i) => ({
      '#': i + 1,
      'Guest Name': r.name,
      'Decision': (r.status === 'Accepted' || r.attending === true) ? 'Accepted (Attending)' : 'Declined',
      'Total Headcount': r.guestCount || 1,
      'Submitted At': r.submittedAt || '',
      'Status in Planner': isAlreadyInGuests(r) ? 'Added to Guest List' : 'Pending Review'
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 4 }, { wch: 28 }, { wch: 22 }, { wch: 16 }, { wch: 20 }, { wch: 22 }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'RSVP Responses')
    XLSX.writeFile(wb, 'Wedding_RSVP_Responses.xlsx')
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <MailCheck size={24} color="#c9a84c" />
            <h2 className="font-serif" style={{ fontSize: '2rem', color: '#c9a84c', margin: 0 }}>RSVP Responses</h2>
          </div>
          <p style={{ color: '#8899aa', fontSize: '0.78rem', margin: '0.3rem 0 0', letterSpacing: '0.03em' }}>
            Live responses submitted by guests from your Web Invitation 💌
          </p>
        </div>

        {total > 0 && (
          <button className="btn-ghost" onClick={exportExcel}>
            <FileSpreadsheet size={14} /> Download RSVPs
          </button>
        )}
      </div>

      <div className="gold-divider" style={{ marginBottom: '1.5rem' }} />

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        {[
          { label: 'Total Responses', value: total,          color: '#c9a84c', emoji: '📬' },
          { label: 'Accepted',        value: accepted,       color: '#48c78e', emoji: '🎉' },
          { label: 'Declined',        value: declined,       color: '#f05050', emoji: '💌' },
          { label: 'Total Headcount', value: totalHeadcount, color: '#e8c97a', emoji: '👥' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '1.1rem 1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>{s.emoji}</div>
            <div className="font-serif" style={{ fontSize: '2rem', color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.65rem', color: '#8899aa', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.3rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Search & Filter Tabs ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '340px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#8899aa' }} />
          <input
            className="input-base"
            placeholder="Search by guest name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.2rem' }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[
            { id: 'All', label: `All (${total})` },
            { id: 'Accepted', label: `Accepted (${accepted})` },
            { id: 'Declined', label: `Declined (${declined})` },
          ].map(tab => {
            const active = filterStatus === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: active ? '600' : '400',
                  background: active ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.05)',
                  color: active ? '#c9a84c' : '#8899aa',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Table & List ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#c9a84c' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontSize: '0.85rem', color: '#8899aa' }}>Syncing RSVP responses...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#8899aa' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem', opacity: 0.4 }}>📬</div>
          <p className="font-serif" style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#a0aaba' }}>
            {search ? 'No responses match your search' : 'No RSVPs received yet'}
          </p>
          <p style={{ fontSize: '0.8rem', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
            When guests confirm on the Web Invitation website, their decision and headcount will automatically appear right here!
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(201,168,76,0.2)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(201,168,76,0.08)', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
                {['#', 'Guest Name', 'Response', 'Guests', 'Received On', 'Actions'].map((h, i) => (
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
              {filtered.map((r, idx) => {
                const isAccepted = r.status === 'Accepted' || r.attending === true
                const inGuests = isAlreadyInGuests(r)

                return (
                  <tr key={r.id}
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

                    {/* Guest Name */}
                    <td style={{ padding: '0.85rem 1rem', minWidth: '180px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                          background: isAccepted ? 'rgba(72,199,142,0.15)' : 'rgba(240,80,80,0.15)',
                          border: `1px solid ${isAccepted ? '#48c78e44' : '#f0505044'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: isAccepted ? '#48c78e' : '#f05050',
                          fontSize: '0.85rem',
                        }}>
                          {isAccepted ? '✓' : '✕'}
                        </div>
                        <div>
                          <div style={{ fontWeight: '500', color: '#f5f0e8' }}>{r.name}</div>
                          {inGuests && (
                            <div style={{ fontSize: '0.65rem', color: '#48c78e', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <span>✓ In Guest List</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        background: isAccepted ? 'rgba(72,199,142,0.15)' : 'rgba(240,80,80,0.15)',
                        color: isAccepted ? '#48c78e' : '#f05050',
                        border: `1px solid ${isAccepted ? '#48c78e44' : '#f0505044'}`,
                      }}>
                        {isAccepted ? '🎉 Joyfully Accepts' : 'Regretfully Declines'}
                      </span>
                    </td>

                    {/* Guests count */}
                    <td style={{ padding: '0.85rem 1rem', color: '#f5f0e8', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      {isAccepted ? `${r.guestCount || 1} guest${(r.guestCount || 1) > 1 ? 's' : ''}` : '—'}
                    </td>

                    {/* Date & Source */}
                    <td style={{ padding: '0.85rem 1rem', color: '#8899aa', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      <div>{r.submittedAt || '—'}</div>
                      <div style={{ fontSize: '0.65rem', marginTop: '0.2rem' }}>
                        {r.submittedVia === 'WhatsApp' ? (
                          <span style={{ color: '#25D366', background: 'rgba(37,211,102,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                            via WhatsApp
                          </span>
                        ) : (
                          <span style={{ color: '#8899aa', background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                            via Website
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                        {!inGuests && (
                          <button
                            onClick={() => handleAddToGuestList(r)}
                            disabled={addingId === r.id}
                            className="btn-gold"
                            style={{ fontSize: '0.7rem', padding: '0.3rem 0.7rem' }}
                            title="Add to Official Guest List"
                          >
                            {addingId === r.id ? <Loader2 size={12} className="animate-spin" /> : <><UserPlus size={12} /> Add to Guests</>}
                          </button>
                        )}

                        {deleteId === r.id ? (
                          <div style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}>
                            <button onClick={() => handleDelete(r.id)}
                              style={{ background: 'rgba(240,80,80,0.2)', border: '1px solid #f0505044', color: '#f05050', borderRadius: '6px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.68rem', fontFamily: 'Montserrat, sans-serif' }}>
                              Yes
                            </button>
                            <button onClick={() => setDeleteId(null)}
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#8899aa', borderRadius: '6px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.68rem', fontFamily: 'Montserrat, sans-serif' }}>
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteId(r.id)}
                            title="Delete RSVP"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8899aa66', padding: '0.25rem', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#f05050'}
                            onMouseLeave={e => e.currentTarget.style.color = '#8899aa66'}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
