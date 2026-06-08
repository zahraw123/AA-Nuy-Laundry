import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDdSHCmbq20Br0C29-AZaKcKcgRAj23foY",
  authDomain: "laundry-aa-nuy.firebaseapp.com",
  projectId: "laundry-aa-nuy",
  storageBucket: "laundry-aa-nuy.firebasestorage.app",
  messagingSenderId: "560256977023",
  appId: "1:560256977023:web:c508355afece2ac81c174a",
  measurementId: "G-5RDMFQW6YN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Authentication
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;