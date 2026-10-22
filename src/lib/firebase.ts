import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/**
 * Checks if Firebase environment variables are actively populated with real credentials.
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY' &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'YOUR_PROJECT_ID'
)

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let googleAuthProvider: GoogleAuthProvider | null = null

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
    googleAuthProvider = new GoogleAuthProvider()
    googleAuthProvider.setCustomParameters({ prompt: 'select_account' })
  } catch (err) {
    console.error('[OBOiFY Firebase] Initialization error:', err)
  }
} else {
  if (import.meta.env.VITE_DATA_PROVIDER === 'firebase') {
    console.warn(
      '[OBOiFY Firebase] VITE_DATA_PROVIDER is set to "firebase", but Firebase credentials in .env.local are placeholders. Running in fallback local mode.'
    )
  }
}

export { app, auth, db, googleAuthProvider }
