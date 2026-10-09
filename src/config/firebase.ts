import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBmvsvkKUshYukRUqSvrIBIZn_dSrNbN4E",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "familystores.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "familystores",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "familystores.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "173806021350",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:173806021350:web:b81f6feaf76cd850f9a927",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-PBHYXW22Z6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);