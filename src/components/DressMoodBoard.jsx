import { useState, useEffect, useRef } from 'react'
import {
  Heart, Plus, Trash2, Check, Upload, ImagePlus, X, Loader2,
  Edit2, Maximize2, ChevronLeft, ChevronRight, ExternalLink, Film, Eye
} from 'lucide-react'
import { uploadToCloudinary } from '../services/cloudinary'
import {
  subscribeMoodBoard,
  addMoodBoardItem,
  updateMoodBoardItem,
  toggleMoodBoardLike,
  deleteMoodBoardItem
} from '../services/db'

const CATEGORIES = [
  'Bride Dress', 'Groom Outfit', 'Bridesmaid', 'Groomsmen',
  'Accessories', 'Shoes', 'Flowers & Decor', 'Cake Design',
  'Venue Inspiration', 'Other'
]

const TAG_COLORS = {
  'Bride Dress':        '#ff6b9d',
  'Groom Outfit':       '#4da6ff',
  'Bridesmaid':         '#f06292',
  'Groomsmen':          '#7c8cfc',
  'Accessories':        '#d4af37',
  'Shoes':              '#c084fc',
  'Flowers & Decor':    '#4ade80',
  'Cake Design':        '#fbbf24',
  'Venue Inspiration':  '#2dd4bf',
  'Other':              '#94a3b8',
}

const CATEGORY_EMOJI = {
  'Bride Dress': '👗', 'Groom Outfit': '🤵', 'Bridesmaid': '💐',
  'Groomsmen': '🎩', 'Accessories': '💍', 'Shoes': '👠',
  'Flowers & Decor': '🌸', 'Cake Design': '🎂', 'Venue Inspiration': '🏛️', 'Other': '✨',
}

function isVideoUrl(url = '') {
  if (!url) return false
  const lower = url.toLowerCase()
  return (
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.m4v') ||
    lower.includes('/video/upload/')
  )
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
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const fileInputRef = useRef()

  // Real-time Firestore sync
  useEffect(() => {
    const unsub = subscribeMoodBoard((list) => {
      setItems(list)
      setLoading(false)
    })
    return () => unsub && unsub()
  }, [])

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowRight') handleNextLightbox()
      if (e.key === 'ArrowLeft') handlePrevLightbox()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex, items, filterCat])

  // ── Media file picker (Image & Video) ─────────────────────
  const handleMediaFile = (file) => {
    if (!file) return
    const isImg = file.type.startsWith('image/')
    const isVid = file.type.startsWith('video/')
    if (!isImg && !isVid) {
      alert('Please select an image or video file.')
      return
    }
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = e => setPreviewUrl(e.target.result)
    reader.readAsDataURL(file)
  }

  const onFileChange = e => handleMediaFile(e.target.files[0])

  const onDrop = e => {
    e.preventDefault()
    setDragOver(false)
    handleMediaFile(e.dataTransfer.files[0])
  }

  const clearMedia = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleStartAdd = () => {
    setEditingItem(null)
    setForm({ title: '', category: 'Bride Dress', notes: '', liked: false })
    clearMedia()
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

  // ── Add / Edit item ──────────────────────────────────────
  const handleSaveItem = async () => {
    if (!form.title.trim()) return
    setUploading(true)

    try {
      let imageUrl = editingItem ? (editingItem.imageUrl || '') : ''
      if (selectedFile) {
        // Upload new file (image or video) to Cloudinary
        imageUrl = await uploadToCloudinary(selectedFile)
      } else if (!previewUrl) {
        imageUrl = ''
      }

      const isVideo = selectedFile
        ? selectedFile.type.startsWith('video/')
        : isVideoUrl(imageUrl)

      const payload = {
        title: form.title.trim(),
        category: form.category,
        imageUrl,
        isVideo,
        notes: form.notes.trim(),
        liked: form.liked,
      }

      if (editingItem) {
        await updateMoodBoardItem(editingItem.id, payload)
      } else {
        await addMoodBoardItem(payload)
      }

      setForm({ title: '', category: 'Bride Dress', notes: '', liked: false })
      clearMedia()
      setEditingItem(null)
      setAdding(false)
    } catch (err) {
      console.error('Failed to save mood board item:', err)
      alert('Could not save: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this mood board item?')) return
    try {
      await deleteMoodBoardItem(id)
      if (lightboxIndex !== null) setLightboxIndex(null)
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

  // Lightbox handlers
  const openLightbox = (item) => {
    const idx = filtered.findIndex(i => i.id === item.id)
    if (idx !== -1) setLightboxIndex(idx)
  }

  const handleNextLightbox = () => {
    if (lightboxIndex === null || filtered.length === 0) return
    setLightboxIndex((lightboxIndex + 1) % filtered.length)
  }

  const handlePrevLightbox = () => {
    if (lightboxIndex === null || filtered.length === 0) return
    setLightboxIndex((lightboxIndex - 1 + filtered.length) % filtered.length)
  }

  const activeLightboxItem = lightboxIndex !== null ? filtered[lightboxIndex] : null

  const isFormPreviewVideo = selectedFile
    ? selectedFile.type.startsWith('video/')
    : isVideoUrl(previewUrl)

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Heart size={22} color="#d4af37" />
            <h2 className="font-serif" style={{ fontSize: '2rem', color: '#f4e2a1', margin: 0, letterSpacing: '0.02em' }}>
              Mood Board
            </h2>
          </div>
          <p style={{ color: '#8899aa', fontSize: '0.8rem', margin: '0.3rem 0 0' }}>
            Outfits, decor, colors & wedding inspiration
          </p>
        </div>
        <button className="btn-gold" onClick={() => (adding ? setAdding(false) : handleStartAdd())}>
          {adding && !editingItem ? <><X size={15} /> Cancel</> : <><Plus size={16} /> Add Inspiration</>}
        </button>
      </div>

      <div className="gold-divider" style={{ marginBottom: '1.25rem' }} />

      {/* ── Add / Edit Form ── */}
      {adding && (
        <div className="card animate-fade-in" style={{ padding: '1.5rem', marginBottom: '1.75rem', borderColor: 'rgba(212,175,55,0.4)', background: 'linear-gradient(145deg, rgba(16,32,54,0.9), rgba(7,17,30,0.95))' }}>
          <h3 className="font-serif" style={{ color: '#f4e2a1', fontSize: '1.2rem', margin: '0 0 1.25rem' }}>
            {editingItem ? '✦ Edit Inspiration' : '✦ Add to Mood Board'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>

            {/* Left column: image/video picker */}
            <div>
              <label style={labelStyle}>Photo or Video from Device</label>

              {previewUrl ? (
                <div style={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid rgba(212,175,55,0.4)',
                  background: '#050c17',
                  minHeight: '230px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {isFormPreviewVideo ? (
                    <video src={previewUrl} controls style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', display: 'block' }} />
                  ) : (
                    <img src={previewUrl} alt="preview" style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', display: 'block' }} />
                  )}

                  {/* Remove button */}
                  <button onClick={clearMedia} title="Remove media" style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: 'rgba(7,17,30,0.85)', border: '1px solid rgba(212,175,55,0.4)',
                    borderRadius: '50%', width: '30px', height: '30px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#f4e2a1', zIndex: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  }}>
                    <X size={15} />
                  </button>
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(transparent, rgba(7,17,30,0.9))',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.72rem', color: '#d4af37',
                  }}>
                    {selectedFile ? '✓ Ready to upload file' : '✓ Current media — click × to change'}
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  style={{
                    height: '230px',
                    border: `2px dashed ${dragOver ? '#d4af37' : 'rgba(212,175,55,0.35)'}`,
                    borderRadius: '12px',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                    cursor: 'pointer',
                    background: dragOver ? 'rgba(212,175,55,0.08)' : 'rgba(10,22,39,0.5)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '14px',
                    background: 'rgba(212,175,55,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(212,175,55,0.25)',
                  }}>
                    <ImagePlus size={24} color="#d4af37" />
                  </div>
                  <div style={{ textAlign: 'center', padding: '0 1rem' }}>
                    <p style={{ color: '#f4e2a1', fontSize: '0.85rem', fontWeight: '600', margin: '0 0 0.2rem' }}>
                      Click to choose photo or video
                    </p>
                    <p style={{ color: '#8899aa', fontSize: '0.72rem', margin: 0 }}>
                      Supports PNG, JPG, WEBP, MP4, MOV (unlimited cloud storage)
                    </p>
                  </div>
                  <button className="btn-ghost" style={{ fontSize: '0.75rem', padding: '0.35rem 1rem' }}
                    onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}>
                    <Upload size={13} /> Select File
                  </button>
                </div>
              )}

              {/* Hidden file input supporting images and videos */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={onFileChange}
                style={{ display: 'none' }}
              />
            </div>

            {/* Right column: details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={labelStyle}>Title *</label>
                <input className="input-base" placeholder="e.g. Traditional Kandyan Saree" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} autoFocus />
              </div>

              <div>
                <label style={labelStyle}>Category</label>
                <select className="input-base" value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Notes & Details</label>
                <textarea className="input-base"
                  placeholder="Style notes, designer/store details, fabric color codes…"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  style={{ resize: 'vertical', minHeight: '90px' }} />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={form.liked}
                  onChange={e => setForm(p => ({ ...p, liked: e.target.checked }))}
                  style={{ accentColor: '#ff6b9d', width: '16px', height: '16px' }} />
                <span style={{ fontSize: '0.82rem', color: '#f4e2a1' }}>💝 Mark as Favourite</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button className="btn-gold" onClick={handleSaveItem} disabled={!form.title.trim() || uploading}>
              {uploading ? <><Loader2 size={15} className="animate-spin" /> Uploading...</> : <><Check size={15} /> {editingItem ? 'Update Inspiration' : 'Save to Mood Board'}</>}
            </button>
            <button className="btn-ghost" onClick={() => { setAdding(false); setEditingItem(null); clearMedia() }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Category filter pills ── */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {['All', ...CATEGORIES].map(cat => {
          const color = TAG_COLORS[cat] || '#d4af37'
          const active = filterCat === cat
          return (
            <button key={cat} onClick={() => setFilterCat(cat)} style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              border: active ? `1px solid ${color}` : '1px solid rgba(212,175,55,0.15)',
              cursor: 'pointer',
              fontSize: '0.74rem',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: active ? '600' : '400',
              background: active ? `${color}25` : 'rgba(10,22,39,0.5)',
              color: active ? '#f4e2a1' : '#8899aa',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}>
              {cat !== 'All' && <span>{CATEGORY_EMOJI[cat]}</span>}
              {cat}
            </button>
          )
        })}
      </div>

      {/* ── Loading & Grid ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', color: '#d4af37' }}>
          <Loader2 size={34} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontSize: '0.88rem', color: '#8899aa' }}>Loading inspirations...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#8899aa' }} className="card">
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.6 }}>⚓</div>
          <p className="font-serif" style={{ fontSize: '1.25rem', color: '#f4e2a1', marginBottom: '0.5rem' }}>
            {filterCat === 'All' ? 'Start building your dream mood board!' : `No items in ${filterCat} yet`}
          </p>
          <p style={{ fontSize: '0.82rem', color: '#8899aa' }}>Upload high-resolution photos and videos from your device</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {filtered.map(item => {
            const color = TAG_COLORS[item.category] || '#d4af37'
            const isVideo = item.isVideo || isVideoUrl(item.imageUrl)

            return (
              <div
                key={item.id}
                className="card animate-fade-in group"
                style={{
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'linear-gradient(155deg, rgba(16,32,54,0.7), rgba(7,17,30,0.85))',
                  border: '1px solid rgba(212,175,55,0.22)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.45)'
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.45)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.22)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >

                {/* ── Media Preview Container (Shows FULL image, uncropped, with tap to enlarge) ── */}
                {item.imageUrl ? (
                  <div
                    onClick={() => openLightbox(item)}
                    title="Tap to view full size"
                    style={{
                      height: '270px',
                      overflow: 'hidden',
                      position: 'relative',
                      cursor: 'pointer',
                      background: 'radial-gradient(circle at center, rgba(16,32,54,0.95), rgba(7,17,30,0.98))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* Atmospheric blurred backdrop so aspect ratios fit seamlessly without empty black voids */}
                    {!isVideo && (
                      <img
                        src={item.imageUrl}
                        alt=""
                        aria-hidden="true"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: 'blur(18px) brightness(0.35)',
                          transform: 'scale(1.25)',
                          pointerEvents: 'none',
                        }}
                      />
                    )}

                    {/* Foreground FULL uncropped media */}
                    {isVideo ? (
                      <video
                        src={item.imageUrl}
                        muted
                        playsInline
                        preload="metadata"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain',
                          display: 'block',
                          position: 'relative',
                          zIndex: 1,
                        }}
                      />
                    ) : (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain',
                          display: 'block',
                          position: 'relative',
                          zIndex: 1,
                          transition: 'transform 0.3s ease',
                        }}
                      />
                    )}

                    {/* Video badge */}
                    {isVideo && (
                      <div style={{
                        position: 'absolute', bottom: '10px', left: '10px', zIndex: 2,
                        background: 'rgba(7,17,30,0.85)',
                        border: '1px solid rgba(212,175,55,0.4)',
                        color: '#f4e2a1',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '999px',
                        fontSize: '0.68rem',
                        fontWeight: '600',
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                      }}>
                        <Film size={12} /> Video
                      </div>
                    )}

                    {/* Tap to expand overlay button */}
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      zIndex: 2,
                      background: 'rgba(7,17,30,0.85)',
                      border: '1px solid rgba(212,175,55,0.4)',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#f4e2a1',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      transition: 'transform 0.2s',
                    }}>
                      <Maximize2 size={14} />
                    </div>

                    {/* Favourite heart on top right */}
                    {item.liked && (
                      <div style={{
                        position: 'absolute', top: '10px', right: '10px', zIndex: 2,
                        background: 'rgba(7,17,30,0.85)',
                        border: '1px solid rgba(255,107,157,0.4)',
                        borderRadius: '50%', width: '30px', height: '30px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      }}>
                        <Heart size={14} fill="#ff6b9d" color="#ff6b9d" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onClick={() => openLightbox(item)}
                    style={{
                      height: '160px',
                      background: `linear-gradient(135deg, ${color}20, rgba(7,17,30,0.9))`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '3.2rem', cursor: 'pointer',
                    }}>
                    {CATEGORY_EMOJI[item.category] || '✨'}
                  </div>
                )}

                {/* ── Card body ── */}
                <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.4rem' }}>
                    <span
                      onClick={() => openLightbox(item)}
                      style={{
                        fontWeight: '600',
                        fontSize: '0.94rem',
                        color: '#f5f0e8',
                        lineHeight: 1.3,
                        cursor: 'pointer',
                      }}>
                      {item.title}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleLike(item.id, item.liked)
                      }}
                      title={item.liked ? 'Remove from favourites' : 'Add to favourites'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: '0.15rem' }}>
                      <Heart size={16} fill={item.liked ? '#ff6b9d' : 'none'} color={item.liked ? '#ff6b9d' : '#8899aa'} />
                    </button>
                  </div>

                  <span style={{
                    padding: '0.15rem 0.65rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: '600',
                    background: `${color}25`, color: color, alignSelf: 'flex-start',
                    border: `1px solid ${color}40`,
                  }}>
                    {CATEGORY_EMOJI[item.category]} {item.category}
                  </span>

                  {item.notes && (
                    <p style={{ fontSize: '0.78rem', color: '#8899aa', margin: 0, lineHeight: 1.5 }}>
                      {item.notes}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.6rem', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
                    {/* View full / Edit button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <button
                        onClick={() => openLightbox(item)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', color: '#d4af37',
                          padding: 0, display: 'flex', alignItems: 'center', gap: '0.3rem',
                          fontSize: '0.72rem', fontWeight: '500',
                        }}>
                        <Eye size={13} /> View Full
                      </button>
                      <button
                        onClick={() => handleStartEdit(item)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', color: '#8899aa',
                          padding: 0, display: 'flex', alignItems: 'center', gap: '0.3rem',
                          fontSize: '0.72rem', transition: 'color 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#f4e2a1'}
                        onMouseLeave={e => e.currentTarget.style.color = '#8899aa'}>
                        <Edit2 size={12} /> Edit
                      </button>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: '#8899aa55',
                        padding: 0, display: 'flex', alignItems: 'center', gap: '0.3rem',
                        fontSize: '0.72rem', transition: 'color 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#f05050'}
                      onMouseLeave={e => e.currentTarget.style.color = '#8899aa55'}>
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Lightbox / Zoom Modal (Full resolution uncropped view) ── */}
      {activeLightboxItem && (
        <div
          onClick={() => setLightboxIndex(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(3, 8, 16, 0.94)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {/* Top Bar inside Lightbox */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '1000px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              color: '#f5f0e8',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span className="font-serif" style={{ fontSize: '1.25rem', color: '#f4e2a1' }}>
                {activeLightboxItem.title}
              </span>
              <span style={{
                padding: '0.2rem 0.65rem',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: '600',
                background: `${TAG_COLORS[activeLightboxItem.category] || '#d4af37'}25`,
                color: TAG_COLORS[activeLightboxItem.category] || '#d4af37',
                border: `1px solid ${TAG_COLORS[activeLightboxItem.category] || '#d4af37'}50`,
              }}>
                {CATEGORY_EMOJI[activeLightboxItem.category]} {activeLightboxItem.category}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#8899aa' }}>
                ({lightboxIndex + 1} of {filtered.length})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {activeLightboxItem.imageUrl && (
                <a
                  href={activeLightboxItem.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open original file in new tab"
                  style={{
                    background: 'rgba(212,175,55,0.15)',
                    border: '1px solid rgba(212,175,55,0.3)',
                    color: '#f4e2a1',
                    borderRadius: '8px',
                    padding: '0.4rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.75rem',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={13} /> Original
                </a>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleLike(activeLightboxItem.id, activeLightboxItem.liked)
                }}
                title={activeLightboxItem.liked ? 'Remove like' : 'Like'}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Heart size={18} fill={activeLightboxItem.liked ? '#ff6b9d' : 'none'} color={activeLightboxItem.liked ? '#ff6b9d' : '#f5f0e8'} />
              </button>

              <button
                onClick={() => setLightboxIndex(null)}
                title="Close (Esc)"
                style={{
                  background: 'rgba(212,175,55,0.2)',
                  border: '1px solid rgba(212,175,55,0.4)',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#f4e2a1',
                  transition: 'background 0.2s',
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Central Media Viewer with Prev / Next Navigation */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '76vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Previous button */}
            {filtered.length > 1 && (
              <button
                onClick={handlePrevLightbox}
                title="Previous (Left arrow)"
                style={{
                  position: 'fixed',
                  left: '1.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(7,17,30,0.85)',
                  border: '1px solid rgba(212,175,55,0.4)',
                  borderRadius: '50%',
                  width: '46px',
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#f4e2a1',
                  zIndex: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                }}
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Media element */}
            {activeLightboxItem.imageUrl ? (
              activeLightboxItem.isVideo || isVideoUrl(activeLightboxItem.imageUrl) ? (
                <video
                  src={activeLightboxItem.imageUrl}
                  controls
                  autoPlay
                  playsInline
                  style={{
                    maxHeight: '76vh',
                    maxWidth: '88vw',
                    objectFit: 'contain',
                    borderRadius: '12px',
                    border: '1px solid rgba(212,175,55,0.45)',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
                    background: '#030810',
                  }}
                />
              ) : (
                <img
                  src={activeLightboxItem.imageUrl}
                  alt={activeLightboxItem.title}
                  style={{
                    maxHeight: '76vh',
                    maxWidth: '88vw',
                    objectFit: 'contain',
                    borderRadius: '12px',
                    border: '1px solid rgba(212,175,55,0.45)',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
                    background: '#030810',
                  }}
                />
              )
            ) : (
              <div style={{
                width: '320px',
                height: '320px',
                background: 'rgba(16,32,54,0.8)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '5rem',
                border: '1px solid rgba(212,175,55,0.3)',
              }}>
                {CATEGORY_EMOJI[activeLightboxItem.category] || '✨'}
              </div>
            )}

            {/* Next button */}
            {filtered.length > 1 && (
              <button
                onClick={handleNextLightbox}
                title="Next (Right arrow)"
                style={{
                  position: 'fixed',
                  right: '1.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(7,17,30,0.85)',
                  border: '1px solid rgba(212,175,55,0.4)',
                  borderRadius: '50%',
                  width: '46px',
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#f4e2a1',
                  zIndex: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                }}
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Bottom Notes Caption */}
          {activeLightboxItem.notes && (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                marginTop: '1rem',
                maxWidth: '750px',
                textAlign: 'center',
                background: 'rgba(7,17,30,0.85)',
                border: '1px solid rgba(212,175,55,0.25)',
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                color: '#e2e8f0',
                fontSize: '0.85rem',
                lineHeight: 1.5,
              }}
            >
              {activeLightboxItem.notes}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '0.7rem',
  color: '#d4af37',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '0.4rem',
  fontWeight: '600',
}
