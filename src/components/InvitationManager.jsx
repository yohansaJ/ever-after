import { useState } from 'react'
import { Mail, Plus, Trash2, Check, Copy, Send } from 'lucide-react'

const TEMPLATES = {
  formal: {
    name: 'Formal & Traditional',
    text: (bride, groom, date, venue) =>
      `Dear [Guest Name],\n\nWith great joy and heartfelt love, we cordially invite you to celebrate the union of\n\n${bride} & ${groom}\n\nas they exchange their vows of eternal love.\n\n📅 Date: ${date || '[Wedding Date]'}\n📍 Venue: ${venue || '[Venue Name]'}\n\nYour presence would be the greatest gift to us on this beautiful day. Kindly RSVP by [RSVP Date].\n\nWith love & gratitude,\n${bride} & ${groom}`,
  },
  casual: {
    name: 'Casual & Warm',
    text: (bride, groom, date, venue) =>
      `Hey there! 🎉\n\nWe are SO excited to share that ${bride} & ${groom} are getting married!\n\nWe'd absolutely love for you to celebrate with us:\n\n📅 ${date || '[Wedding Date]'}\n📍 ${venue || '[Venue Name]'}\n\nExpect lots of love, laughter, and dancing! Please let us know if you can make it. 💌\n\nAll our love,\n${bride} & ${groom}`,
  },
  poetic: {
    name: 'Poetic & Romantic',
    text: (bride, groom, date, venue) =>
      `"Two souls, one heart" ✨\n\nIn the garden of love, two hearts have found each other.\n\nWith joy that knows no bounds, we invite you to witness the beginning of forever:\n\n${bride}\n&\n${groom}\n\nAs they promise each other a lifetime of love.\n\n🌹 ${date || '[Wedding Date]'}\n🌹 ${venue || '[Venue Name]'}\n\nPlease grace us with your presence and your blessings.\n\nForever yours,\n${bride} & ${groom}`,
  },
}

function useLocalStorage(key, defaultVal) {
  const [val, setVal] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) || defaultVal } catch { return defaultVal }
  })
  const save = v => { setVal(v); localStorage.setItem(key, JSON.stringify(v)) }
  return [val, save]
}

export default function InvitationManager() {
  const coupleNames = JSON.parse(localStorage.getItem('coupleNames') || '{"bride":"Bride","groom":"Groom"}')
  const weddingDate = localStorage.getItem('weddingDate') || ''

  const [selectedTemplate, setSelectedTemplate] = useState('formal')
  const [venue, setVenue] = useState(() => localStorage.getItem('invVenue') || '')
  const [customText, setCustomText] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [copied, setCopied] = useState(false)

  const [invitations, setInvitations] = useLocalStorage('invitations', [])
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')

  const dateStr = weddingDate ? new Date(weddingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''

  const template = TEMPLATES[selectedTemplate]
  const generatedText = isCustom ? customText : template.text(coupleNames.bride, coupleNames.groom, dateStr, venue)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText.replace('[Guest Name]', guestName || '[Guest Name]'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const addInvitation = () => {
    if (!guestName.trim()) return
    setInvitations([...invitations, {
      id: Date.now(),
      name: guestName,
      email: guestEmail,
      status: 'Drafted',
      sentAt: null,
      template: selectedTemplate,
    }])
    setGuestName('')
    setGuestEmail('')
  }

  const updateStatus = (id, status) => setInvitations(invitations.map(i => i.id === id ? { ...i, status, sentAt: status === 'Sent' ? new Date().toLocaleDateString() : i.sentAt } : i))
  const removeInvitation = id => setInvitations(invitations.filter(i => i.id !== id))

  const statuses = { Drafted: 0, Sent: 0, Responded: 0 }
  invitations.forEach(i => statuses[i.status]++)

  return (
    <div className="animate-fade-in" style={{ maxWidth: '880px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
        <Mail size={22} color="#c9a84c" />
        <h2 className="font-serif" style={{ fontSize: '2rem', color: '#c9a84c', margin: 0 }}>Invitation Manager</h2>
      </div>

      <div className="gold-divider" style={{ marginBottom: '1.5rem' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left: Template builder */}
        <div>
          <h3 className="font-serif" style={{ color: '#e8c97a', fontSize: '1.2rem', margin: '0 0 1rem' }}>✦ Craft Your Invitation</h3>

          {/* Template selector */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Choose Style</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {Object.entries(TEMPLATES).map(([key, t]) => (
                <button key={key} onClick={() => { setSelectedTemplate(key); setIsCustom(false) }}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '8px',
                    border: `1px solid ${selectedTemplate === key && !isCustom ? '#c9a84c' : 'rgba(201,168,76,0.2)'}`,
                    background: selectedTemplate === key && !isCustom ? 'rgba(201,168,76,0.15)' : 'transparent',
                    color: selectedTemplate === key && !isCustom ? '#c9a84c' : '#8899aa',
                    fontSize: '0.75rem',
                    fontFamily: 'Montserrat, sans-serif',
                    cursor: 'pointer',
                  }}>
                  {t.name}
                </button>
              ))}
              <button onClick={() => setIsCustom(true)}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '8px',
                  border: `1px solid ${isCustom ? '#c9a84c' : 'rgba(201,168,76,0.2)'}`,
                  background: isCustom ? 'rgba(201,168,76,0.15)' : 'transparent',
                  color: isCustom ? '#c9a84c' : '#8899aa',
                  fontSize: '0.75rem',
                  fontFamily: 'Montserrat, sans-serif',
                  cursor: 'pointer',
                }}>
                ✏️ Custom
              </button>
            </div>
          </div>

          {/* Venue */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Venue Name</label>
            <input className="input-base" placeholder="e.g. The Grand Ballroom, Colombo" value={venue}
              onChange={e => { setVenue(e.target.value); localStorage.setItem('invVenue', e.target.value) }} />
          </div>

          {/* Preview / Editor */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>{isCustom ? 'Write Your Message' : 'Preview'}</label>
            <textarea
              className="input-base"
              value={isCustom ? customText : generatedText}
              onChange={e => isCustom && setCustomText(e.target.value)}
              readOnly={!isCustom}
              style={{ resize: 'vertical', minHeight: '220px', fontFamily: 'Cormorant Garamond, serif', fontSize: '0.95rem', lineHeight: '1.7' }}
            />
          </div>

          <button className="btn-gold" onClick={copyToClipboard}>
            {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Invitation</>}
          </button>
        </div>

        {/* Right: Guest tracker */}
        <div>
          <h3 className="font-serif" style={{ color: '#e8c97a', fontSize: '1.2rem', margin: '0 0 1rem' }}>✦ Track Sent Invitations</h3>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {Object.entries(statuses).map(([status, count]) => (
              <div key={status} style={{
                flex: 1, minWidth: '80px', textAlign: 'center',
                padding: '0.75rem 0.5rem',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '10px',
                border: '1px solid rgba(201,168,76,0.1)',
              }}>
                <div className="font-serif" style={{ fontSize: '1.6rem', color: '#c9a84c' }}>{count}</div>
                <div style={{ fontSize: '0.65rem', color: '#8899aa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{status}</div>
              </div>
            ))}
          </div>

          {/* Add guest */}
          <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <label style={labelStyle}>Add Guest</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input className="input-base" placeholder="Guest name *" value={guestName}
                onChange={e => setGuestName(e.target.value)} />
              <input className="input-base" placeholder="Email (optional)" value={guestEmail}
                onChange={e => setGuestEmail(e.target.value)} />
              <button className="btn-gold" onClick={addInvitation}><Plus size={14} /> Add</button>
            </div>
          </div>

          {/* Invitation list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '340px', overflowY: 'auto' }}>
            {invitations.length === 0 ? (
              <p style={{ color: '#8899aa', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>No invitations tracked yet</p>
            ) : invitations.map(inv => (
              <div key={inv.id} className="card animate-fade-in" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '500', color: '#f5f0e8' }}>{inv.name}</div>
                  {inv.email && <div style={{ fontSize: '0.68rem', color: '#8899aa' }}>{inv.email}</div>}
                  {inv.sentAt && <div style={{ fontSize: '0.65rem', color: '#8899aa' }}>Sent: {inv.sentAt}</div>}
                </div>

                <select
                  value={inv.status}
                  onChange={e => updateStatus(inv.id, e.target.value)}
                  style={{
                    background: inv.status === 'Sent' ? 'rgba(72,199,142,0.15)' : inv.status === 'Responded' ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.08)',
                    color: inv.status === 'Sent' ? '#48c78e' : inv.status === 'Responded' ? '#c9a84c' : '#8899aa',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.68rem',
                    fontWeight: '600',
                    fontFamily: 'Montserrat, sans-serif',
                    cursor: 'pointer',
                    outline: 'none',
                  }}>
                  <option value="Drafted" style={{ background: '#1a2d42', color: '#f5f0e8' }}>Drafted</option>
                  <option value="Sent" style={{ background: '#1a2d42', color: '#f5f0e8' }}>Sent</option>
                  <option value="Responded" style={{ background: '#1a2d42', color: '#f5f0e8' }}>Responded</option>
                </select>

                <button onClick={() => removeInvitation(inv.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8899aa', padding: '0.1rem' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '0.7rem',
  color: '#8899aa',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '0.4rem',
}
