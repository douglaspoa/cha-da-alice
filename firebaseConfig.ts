// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, Timestamp } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// TODO: Replace with your actual Firebase project configuration
// IMPORTANT: DO NOT hardcode these values in your repository.
// Use environment variables or other secure configuration methods.
const firebaseConfig = {
  apiKey: "AIzaSyAaOFe8u9gX-NrOBOEBKRTDmeu6RtLfhTo",
  authDomain: "cha-da-alice-da979.firebaseapp.com",
  projectId: "cha-da-alice-da979",
  storageBucket: "cha-da-alice-da979.firebasestorage.app",
  messagingSenderId: "188078446050",
  appId: "1:188078446050:web:d5de8310671f72fb4dd5bb",
  measurementId: "G-Q0VFVJ8QHP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Analytics and export it
// Check if Analytics is supported in the current environment
let analytics;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

export { db, Timestamp, analytics };
