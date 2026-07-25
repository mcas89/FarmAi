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

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Instâncias ativas para exportar
export const db = getFirestore(app);
export const auth = getAuth(app);
