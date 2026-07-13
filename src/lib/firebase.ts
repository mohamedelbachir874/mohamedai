import { initializeApp, getApps, cert } from "firebase/app"
import { getFirestore } from "firebase/firestore"

// Use environment variables in production, fallback to hardcoded for dev
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBg-xHPwRzrfVs33Knx5kmv5fBur4n4ZL8",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "mohamedai-1ebe1.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "mohamedai-1ebe1",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "mohamedai-1ebe1.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "739373312268",
  appId: process.env.FIREBASE_APP_ID || "1:739373312268:web:e7f44fcb69850b07bc4129",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-P3G109XN26",
}

// Initialize Firebase (avoid double-init in dev)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Firestore
export const db = getFirestore(app)
export { app }
