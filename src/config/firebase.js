import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Chaves do Firebase injetadas diretamente (seguro para web app, a segurança real vem do Firestore Rules)
const firebaseConfig = {
  apiKey: "AIzaSyCaWUnzglJZvWzXbaQvRp4ntVCBC9gzOZY",
  authDomain: "farmaai-f4f38.firebaseapp.com",
  projectId: "farmaai-f4f38",
  storageBucket: "farmaai-f4f38.firebasestorage.app",
  messagingSenderId: "843504104131",
  appId: "1:843504104131:web:48ea69020a075d82eae876"
};

let app;
let db;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (e) {
  console.error("🔥 Erro ao inicializar Firebase (possível chave inválida ou erro de rede):", e);
}

export { db, auth };
