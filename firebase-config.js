const firebaseConfig = {
  apiKey: "AIzaSyBpfkslaDvzPdOpNlfk1Psem1dai6ta0Zc",
  authDomain: "fotogestao-ea6d7.firebaseapp.com",
  projectId: "fotogestao-ea6d7",
  storageBucket: "fotogestao-ea6d7.firebasestorage.app",
  messagingSenderId: "921005388227",
  appId: "1:921005388227:web:b0607f0602374b5acd0d76",
  measurementId: "G-Z7RZVV57GY"
};

// Inicializa o Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();