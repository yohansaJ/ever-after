import { useState, useEffect, useRef } from 'react'
import { Heart, Plus, Trash2, Check, Upload, ImagePlus, X, Loader2, Edit2 } from 'lucide-react'
import { uploadToCloudinary } from '../services/cloudinary'
import { subscribeMoodBoard, addMoodBoardItem, updateMoodBoardItem, toggleMoodBoardLike, deleteMoodBoardItem } from '../services/db'

const CATEGORIES = ['Bride Dress', 'Groom Outfit', 'Bridesmaid', 'Groomsmen', 'Accessories', 'Shoes', 'Flowers & Decor', 'Cake Design', 'Venue Inspiration', 'Other']

const TAG_COLORS = {
  'Bride Dress':        '#ff6b9d',
  'Groom Outfit':       '#3273dc',
  'Bridesmaid':         '#f06292',
  'Groomsmen':          '#5c6bc0',
  'Accessories':        '#c9a84c',
  'Shoes':              '#a855f7',
  'Flowers & Decor':    '#48c78e',
  'Cake Design':        '#f0b030',
  'Venue Inspiration':  '#20c997',
  'Other':              '#8899aa',
}

const CATEGORY_EMOJI = {
  'Bride Dress': '👗', 'Groom Outfit': '🤵', 'Bridesmaid': '💐',
  'Groomsmen': '🎩', 'Accessories': '💍', 'Shoes': '👠',
  'Flowers & Decor': '🌸', 'Cake Design': '🎂', 'Venue Inspiration': '🏛️', 'Other': '✨',
}

export default function DressMoodBoard() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'Bride Dress', notes: '', liked: false })
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [adding, setAdding] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [filterCat, setFilterCat] = useState('All')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef()

  // Real-time Firestore sync
  useEffect(() => {
    const unsub = subscribeMoodBoard((list) => {
      setItems(list)
      setLoading(false)
    })
    return () => unsub && unsub()
  }, [])

  // ── Image picker ──────────────────────────────────────────
  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = e => setPreviewUrl(e.target.result)
    reader.readAsDataURL(file)
  }

  const onFileChange = e => handleImageFile(e.target.files[0])

  const onDrop = e => {
    e.preventDefault()
    setDragOver(false)
    handleImageFile(e.dataTransfer.files[0])
  }

  const clearImage = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleStartAdd = () => {
    setEditingItem(null)
    setForm({ title: '', category: 'Bride Dress', notes: '', liked: false })
    clearImage()
    setAdding(true)
  }

  const handleStartEdit = (item) => {
    setEditingItem(item)
    setForm({
      title: item.title || '',
      category: item.category || 'Bride Dress',
      notes: item.notes || '',
      liked: Boolean(item.liked),
    })
    setSelectedFile(null)
    setPreviewUrl(item.imageUrl || null)
    setAdding(true)
  }

  // ── Add / Edit item ──────────────────────────────────────────────
  const handleSaveItem = async () => {
    if (!form.title.trim()) return
    setUploading(true)

    try {
      let imageUrl = editingItem ? (editingItem.imageUrl || '') : ''
      if (selectedFile) {
        // Upload new file to Cloudinary
        imageUrl = await uploadToCloudinary(selectedFile)
      } else if (!previewUrl) {
        imageUrl = ''
      }

      if (editingItem) {
        await updateMoodBoardItem(editingItem.id, {
          title: form.title.trim(),
          category: form.category,
          imageUrl,
          notes: form.notes.trim(),
          liked: form.liked,
        })
      } else {
        await addMoodBoardItem({
          title: form.title.trim(),
          category: form.category,
          imageUrl,
          notes: form.notes.trim(),
          liked: form.liked,
        })
      }

      setForm({ title: '', category: 'Bride Dress', notes: '', liked: false })
      clearImage()
      setEditingItem(null)
      setAdding(false)
    } catch (err) {
      console.error('Failed to save mood board item:', err)
      alert('Could not save to cloud: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveItem = async (id) => {
    try {
      await deleteMoodBoardItem(id)
    } catch (err) {
      console.error('Error removing item:', err)
    }
  }

  const handleToggleLike = async (id, currentLiked) => {
    try {
      await toggleMoodBoardLike(id, currentLiked)
    } catch (err) {
      console.error('Error toggling like:', err)
    }
  }

  const filtered = filterCat === 'All' ? items : items.filter(i => i.category === filterCat)

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Heart size={22} color="#c9a84c" />
            <h2 className="font-serif" style={{ fontSize: '2rem', color: '#c9a84c', margin: 0 }}>Mood Board</h2>
          </div>
          <p style={{ color: '#8899aa', fontSize: '0.78rem', margin: '0.3rem 0 0' }}>
            Outfits, decor & inspiration
          </p>
        </div>
        <button className="btn-gold" onClick={() => (adding ? setAdding(false) : handleStartAdd())}>
          {adding && !editingItem ? <><X size={14} /> Cancel</> : <><Plus size={15} /> Add Inspiration</>}
        </button>
      </div>

      <div className="gold-divider" style={{ marginBottom: '1.25rem' }} />

      {/* ── Add / Edit Form ── */}
      {adding && (
        <div className="card animate-fade-in" style={{ padding: '1.5rem', marginBottom: '1.75rem', borderColor: 'rgba(201,168,76,0.4)' }}>
          <h3 className="font-serif" style={{ color: '#e8c97a', fontSize: '1.15rem', margin: '0 0 1.25rem' }}>
            {editingItem ? '✦ Edit Inspiration' : '✦ Add to Mood Board'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>

            {/* Left column: image picker */}
            <div>
              <label style={labelStyle}>Photo from Device</label>

              {previewUrl ? (
                <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(201,168,76,0.3)' }}>
                  <img src={previewUrl} alt="preview"
                    style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} />
                  {/* Remove image */}
                  <button onClick={clearImage} style={{
                    position: 'absolute', top: '8px', right: '8px',
                    background: 'rgba(13,27,42,0.85)', border: '1px solid rgba(201,168,76,0.3)',
                    borderRadius: '50%', width: '28px', height: '28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#f5f0e8',
                  }}>
                    <X size={13} />
                  </button>
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(transparent, rgba(13,27,42,0.8))',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.7rem', color: '#c9a84c',
                  }}>
                    {selectedFile ? '✓ Ready to upload new photo' : '✓ Current photo — click × to change'}
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  style={{
                    height: '200px',
                    border: `2px dashed ${dragOver ? '#c9a84c' : 'rgba(201,168,76,0.3)'}`,
                    borderRadius: '10px',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                    cursor: 'pointer',
                    background: dragOver ? 'rgba(201,168,76,0.07)' : 'rgba(13,27,42,0.4)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: 'rgba(201,168,76,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ImagePlus size={22} color="#c9a84c" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#c9a84c', fontSize: '0.82rem', fontWeight: '600', margin: '0 0 0.2rem' }}>
                      Click to browse or drag & drop
                    </p>
                    <p style={{ color: '#8899aa', fontSize: '0.72rem', margin: 0 }}>
                      Uploaded to Cloudinary (Unlimited storage)
                    </p>
                  </div>
                  <button className="btn-ghost" style={{ fontSize: '0.75rem', padding: '0.35rem 1rem' }}
                    onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}>
                    <Upload size={12} /> Choose File
                  </button>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                style={{ display: 'none' }}
              />
            </div>

            {/* Right column: details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={labelStyle}>Title *</label>
                <input className="input-base" placeholder="e.g. Princess ball gown" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} autoFocus />
              </div>

              <div>
                <label style={labelStyle}>Category</label>
                <select className="input-base" value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Notes</label>
                <textarea className="input-base"
                  placeholder="Style notes, where to buy, fabric preferences…"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  style={{ resize: 'vertical', minHeight: '80px' }} />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.liked}
                  onChange={e => setForm(p => ({ ...p, liked: e.target.checked }))}
                  style={{ accentColor: '#ff6b9d', width: '15px', height: '15px' }} />
                <span style={{ fontSize: '0.8rem', color: '#8899aa' }}>💝 Add to Favourites</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button className="btn-gold" onClick={handleSaveItem} disabled={!form.title.trim() || uploading}>
              {uploading ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Check size={14} /> {editingItem ? 'Update Item' : 'Add Item'}</>}
            </button>
            <button className="btn-ghost" onClick={() => { setAdding(false); setEditingItem(null); clearImage() }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Category filter pills ── */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {['All', ...CATEGORIES].map(cat => {
          const color = TAG_COLORS[cat] || '#c9a84c'
          const active = filterCat === cat
          return (
            <button key={cat} onClick={() => setFilterCat(cat)} style={{
              padding: '0.3rem 0.8rem',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.72rem',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: active ? '600' : '400',
              background: active ? `${color}30` : 'rgba(255,255,255,0.05)',
              color: active ? color : '#8899aa',
              transition: 'all 0.2s',
            }}>
              {cat !== 'All' && CATEGORY_EMOJI[cat] + ' '}{cat}
            </button>
          )
        })}
      </div>

      {/* ── Loading & Grid ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#c9a84c' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontSize: '0.85rem', color: '#8899aa' }}>Loading mood board...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#8899aa' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.4 }}>🌸</div>
          <p className="font-serif" style={{ fontSize: '1.2rem', color: '#a0aaba', marginBottom: '0.5rem' }}>
            {filterCat === 'All' ? 'Start pinning your dream inspirations!' : `No ${filterCat} items yet`}
          </p>
          <p style={{ fontSize: '0.8rem' }}>Upload photos from your device — saved safely to Cloudinary</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1rem' }}>
          {filtered.map(item => {
            const color = TAG_COLORS[item.category] || '#8899aa'
            return (
              <div key={item.id} className="card animate-fade-in"
                style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                {/* Cloudinary Image or placeholder */}
                {item.imageUrl ? (
                  <div style={{ height: '190px', overflow: 'hidden', background: '#0d1b2a', position: 'relative' }}>
                    <img src={item.imageUrl} alt={item.title}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    {item.liked && (
                      <div style={{
                        position: 'absolute', top: '8px', right: '8px',
                        background: 'rgba(13,27,42,0.75)',
                        borderRadius: '50%', width: '28px', height: '28px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Heart size={13} fill="#ff6b9d" color="#ff6b9d" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    height: '130px',
                    background: `linear-gradient(135deg, ${color}22, ${color}08)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '3rem',
                  }}>
                    {CATEGORY_EMOJI[item.category] || '✨'}
                  </div>
                )}

                {/* Card body */}
                <div style={{ padding: '0.9rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.4rem' }}>
                    <span style={{ fontWeight: '500', fontSize: '0.88rem', color: '#f5f0e8', lineHeight: 1.3 }}>{item.title}</span>
                    <button onClick={() => handleToggleLike(item.id, item.liked)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: '0.1rem' }}>
                      <Heart size={15} fill={item.liked ? '#ff6b9d' : 'none'} color={item.liked ? '#ff6b9d' : '#8899aa'} />
                    </button>
                  </div>

                  <span style={{
                    padding: '0.1rem 0.55rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: '600',
                    background: `${color}22`, color: color, alignSelf: 'flex-start',
                  }}>
                    {CATEGORY_EMOJI[item.category]} {item.category}
                  </span>

                  {item.notes && (
                    <p style={{ fontSize: '0.76rem', color: '#8899aa', margin: 0, lineHeight: 1.5 }}>{item.notes}</p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.4rem' }}>
                    {/* Edit button */}
                    <button onClick={() => handleStartEdit(item)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: '#8899aa',
                      padding: 0, display: 'flex', alignItems: 'center', gap: '0.3rem',
                      fontSize: '0.7rem', transition: 'color 0.2s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.color = '#c9a84c'}
                      onMouseLeave={e => e.currentTarget.style.color = '#8899aa'}>
                      <Edit2 size={12} /> Edit
                    </button>

                    {/* Remove button */}
                    <button onClick={() => handleRemoveItem(item.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: '#8899aa66',
                      padding: 0, display: 'flex', alignItems: 'center', gap: '0.3rem',
                      fontSize: '0.7rem', transition: 'color 0.2s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.color = '#f05050'}
                      onMouseLeave={e => e.currentTarget.style.color = '#8899aa66'}>
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
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
  fontSize: '0.68rem',
  color: '#8899aa',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '0.35rem',
}
