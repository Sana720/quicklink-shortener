import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDIdD8Jg2J0c93Fs0xfrLkLjwq1Nd77n1c",
  authDomain: "quicklink-shortener.firebaseapp.com",
  projectId: "quicklink-shortener",
  storageBucket: "quicklink-shortener.firebasestorage.app",
  messagingSenderId: "959592304030",
  appId: "1:959592304030:web:2551863dfd5699c6145a8f",
  measurementId: "G-NLELHE49TT"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export { app };
