// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBkBOjmxKhDb9kQQvtiF4yjjH0F6UmEJk8",
  authDomain: "ecommerce-c8f05.firebaseapp.com",
  projectId: "ecommerce-c8f05",
  storageBucket: "ecommerce-c8f05.firebasestorage.app",
  messagingSenderId: "703154723404",
  appId: "1:703154723404:web:52b9288f0d2d3f3d5e32e9",
  measurementId: "G-YXKZLBEWVE",
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, app, db };
