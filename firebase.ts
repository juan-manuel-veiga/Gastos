import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBmVt_Xv8YZ4BauhXQloR_P4Eu_WBkg8R",
  authDomain: "gastos-personales-8e995.firebaseapp.com",
  projectId: "gastos-personales-8e995",
  storageBucket: "gastos-personales-8e995.firebasestorage.app",
  messagingSenderId: "944174398538",
  appId: "1:944174398538:web:b2d1d08a5b4a335ba93ab3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);