import { useState } from 'react'
import { Users, UserPlus, X, Trash2, Check, ShieldCheck, Mail, Loader2 } from 'lucide-react'
import { addAllowedMember, removeAllowedMember } from '../services/db'

export default function FamilyAccessModal({ isOpen, onClose, weddingDetails, currentUser }) {
  const [newEmail, setNewEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const allowedMembers = weddingDetails?.allowedMembers || []
  const ownerEmail = (weddingDetails?.ownerEmail || '').toLowerCase()
  const isOwner = currentUser?.email && (currentUser.email.toLowerCase() === ownerEmail || !ownerEmail)

  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    const cleanEmail = newEmail.trim().toLowerCase()

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    if (allowedMembers.includes(cleanEmail)) {
      setError('This email is already in the access list.')
      return
    }

    setSaving(true)
    try {
      await addAllowedMember(cleanEmail)
      setNewEmail('')
    } catch (err) {
      console.error('Failed to add member:', err)
      setError(err.message || 'Failed to add member.')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (email) => {
    if (email === ownerEmail) {
      alert('Cannot remove the wedding owner.')
      return
    }
    if (!window.confirm(`Are you sure you want to revoke access for ${email}?`)) return

    try {
      await removeAllowedMember(email)
    } catch (err) {
      console.error('Failed to remove member:', err)
      alert(err.message || 'Failed to remove member.')
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
    }}>
      <div className="card animate-fade-in" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '1.75rem',
        borderColor: 'rgba(201, 168, 76, 0.4)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(201,168,76,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Users size={18} color="#c9a84c" />
            </div>
            <div>
              <h3 className="font-serif" style={{ fontSize: '1.4rem', color: '#c9a84c', margin: 0 }}>
                Family & Team Access
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#8899aa', margin: '0.15rem 0 0' }}>
                Only Gmail accounts listed here can view this wedding space 🔒
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#8899aa', cursor: 'pointer', padding: '0.2rem' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="gold-divider" style={{ margin: '0 0 1.25rem 0' }} />

        {/* Add Member Form */}
        <form onSubmit={handleAdd} style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.7rem', color: '#8899aa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
            Invite by Gmail (Brother, Mother, Sister, etc.)
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Mail size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#8899aa' }} />
              <input
                className="input-base"
                type="email"
                placeholder="e.g. brother@gmail.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                style={{ paddingLeft: '2.2rem', fontSize: '0.82rem' }}
                disabled={saving}
              />
            </div>
            <button
              type="submit"
              className="btn-gold"
              disabled={saving || !newEmail.trim()}
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <><UserPlus size={14} /> Add</>}
            </button>
          </div>
          {error && <p style={{ color: '#f05050', fontSize: '0.72rem', margin: '0.4rem 0 0' }}>{error}</p>}
        </form>

        {/* Members List */}
        <div>
          <div style={{ fontSize: '0.7rem', color: '#8899aa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
            Authorized Members ({allowedMembers.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
            {allowedMembers.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: '#8899aa', textAlign: 'center', padding: '1rem' }}>
                No members added yet.
              </p>
            ) : allowedMembers.map(email => {
              const isThisOwner = email === ownerEmail
              const isCurrentUser = currentUser?.email && currentUser.email.toLowerCase() === email

              return (
                <div
                  key={email}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(201,168,76,0.15)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    <div style={{
                      width: '26px', height: '26px', borderRadius: '50%',
                      background: isThisOwner ? 'rgba(201,168,76,0.2)' : 'rgba(72,199,142,0.15)',
                      color: isThisOwner ? '#c9a84c' : '#48c78e',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0,
                    }}>
                      {email[0].toUpperCase()}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.8rem', color: '#f5f0e8', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {email}
                      </div>
                      {isCurrentUser && (
                        <div style={{ fontSize: '0.65rem', color: '#c9a84c' }}>You (Current Session)</div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <span style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      background: isThisOwner ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.06)',
                      color: isThisOwner ? '#c9a84c' : '#8899aa',
                    }}>
                      {isThisOwner ? '👑 Owner' : 'Member'}
                    </span>

                    {!isThisOwner && isOwner && (
                      <button
                        onClick={() => handleRemove(email)}
                        title="Remove Access"
                        style={{ background: 'none', border: 'none', color: '#8899aa', cursor: 'pointer', padding: '0.2rem' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#f05050'}
                        onMouseLeave={e => e.currentTarget.style.color = '#8899aa'}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }}>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
