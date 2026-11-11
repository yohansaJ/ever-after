import { db } from '../firebase'
import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'

// ==========================================
// WEDDING INFO (Couple names, wedding date)
// ==========================================
export function subscribeWeddingDetails(callback) {
  const docRef = doc(db, 'wedding_settings', 'details')
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data())
    } else {
      callback(null)
    }
  }, (err) => {
    console.error('Error fetching wedding details:', err)
  })
}

export async function saveWeddingDetails(details) {
  const docRef = doc(db, 'wedding_settings', 'details')
  await setDoc(docRef, { ...details, updatedAt: serverTimestamp() }, { merge: true })
}

// ==========================================
// GUEST LIST
// ==========================================
export function subscribeGuests(callback) {
  const q = query(collection(db, 'guests'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(list)
  }, (err) => {
    console.error('Error fetching guests:', err)
  })
}

export async function addGuest(data) {
  return await addDoc(collection(db, 'guests'), {
    name: data.name,
    notes: data.notes || '',
    status: data.status || 'Invited',
    addedAt: data.addedAt || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    createdAt: serverTimestamp()
  })
}

export async function updateGuestStatus(id, status) {
  const docRef = doc(db, 'guests', id)
  await updateDoc(docRef, { status })
}

export async function updateGuest(id, data) {
  const docRef = doc(db, 'guests', id)
  await updateDoc(docRef, data)
}

export async function deleteGuest(id) {
  const docRef = doc(db, 'guests', id)
  await deleteDoc(docRef)
}

// ==========================================
// TO-DO LIST
// ==========================================
export function subscribeTodos(callback) {
  const q = query(collection(db, 'todos'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(list)
  }, (err) => {
    console.error('Error fetching todos:', err)
  })
}

export async function addTodo(data) {
  return await addDoc(collection(db, 'todos'), {
    text: data.text,
    category: data.category || 'Other',
    priority: data.priority || 'Medium',
    deadline: data.deadline || '',
    done: false,
    createdAt: serverTimestamp()
  })
}

export async function toggleTodo(id, currentDone) {
  const docRef = doc(db, 'todos', id)
  await updateDoc(docRef, { done: !currentDone })
}

export async function updateTodo(id, data) {
  const docRef = doc(db, 'todos', id)
  await updateDoc(docRef, data)
}

export async function deleteTodo(id) {
  const docRef = doc(db, 'todos', id)
  await deleteDoc(docRef)
}

// ==========================================
// BUDGET TRACKER
// ==========================================
export function subscribeBudget(callback) {
  const q = query(collection(db, 'budget'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(list)
  }, (err) => {
    console.error('Error fetching budget items:', err)
  })
}

export function subscribeBudgetSettings(callback) {
  const docRef = doc(db, 'wedding_settings', 'budget')
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data().totalBudget || 0)
    } else {
      callback(0)
    }
  }, (err) => {
    console.error('Error fetching budget settings:', err)
  })
}

export async function saveTotalBudget(amount) {
  const docRef = doc(db, 'wedding_settings', 'budget')
  await setDoc(docRef, { totalBudget: Number(amount) || 0, updatedAt: serverTimestamp() }, { merge: true })
}

export async function addBudgetItem(data) {
  return await addDoc(collection(db, 'budget'), {
    name: data.name,
    category: data.category || 'Other',
    amount: Number(data.amount) || 0,
    paid: Boolean(data.paid),
    createdAt: serverTimestamp()
  })
}

export async function toggleBudgetPaid(id, currentPaid) {
  const docRef = doc(db, 'budget', id)
  await updateDoc(docRef, { paid: !currentPaid })
}

export async function updateBudgetItem(id, data) {
  const docRef = doc(db, 'budget', id)
  await updateDoc(docRef, data)
}

export async function deleteBudgetItem(id) {
  const docRef = doc(db, 'budget', id)
  await deleteDoc(docRef)
}

// ==========================================
// MOOD BOARD (with Cloudinary URLs)
// ==========================================
export function subscribeMoodBoard(callback) {
  const q = query(collection(db, 'moodboard'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(list)
  }, (err) => {
    console.error('Error fetching mood board items:', err)
  })
}

export async function addMoodBoardItem(data) {
  return await addDoc(collection(db, 'moodboard'), {
    title: data.title,
    category: data.category || 'Bride Dress',
    imageUrl: data.imageUrl || '',
    notes: data.notes || '',
    liked: Boolean(data.liked),
    createdAt: serverTimestamp()
  })
}

export async function toggleMoodBoardLike(id, currentLiked) {
  const docRef = doc(db, 'moodboard', id)
  await updateDoc(docRef, { liked: !currentLiked })
}

export async function updateMoodBoardItem(id, data) {
  const docRef = doc(db, 'moodboard', id)
  await updateDoc(docRef, data)
}

export async function deleteMoodBoardItem(id) {
  const docRef = doc(db, 'moodboard', id)
  await deleteDoc(docRef)
}

// ==========================================
// INCOMING RSVPS (from Web Invitation)
// ==========================================
export function subscribeRsvps(callback) {
  const q = query(collection(db, 'rsvps'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(list)
  }, (err) => {
    console.error('Error fetching RSVPs:', err)
  })
}

export async function deleteRsvp(id) {
  const docRef = doc(db, 'rsvps', id)
  await deleteDoc(docRef)
}

export async function markRsvpAdded(id, added = true) {
  const docRef = doc(db, 'rsvps', id)
  await updateDoc(docRef, { addedToGuestList: added })
}
