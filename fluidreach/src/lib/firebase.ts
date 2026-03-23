import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey:            "AIzaSyDdh_Z4UnlpqwwQBbEKo-0q6L1iv6TUO1U",
  authDomain:        "fluidreach-ee001.firebaseapp.com",
  projectId:         "fluidreach-ee001",
  storageBucket:     "fluidreach-ee001.firebasestorage.app",
  messagingSenderId: "800007618585",
  appId:             "1:800007618585:web:94354ce97c1e6211c62a88"
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth    = getAuth(app)
export const db      = getFirestore(app)
export const storage = getStorage(app)
export default app