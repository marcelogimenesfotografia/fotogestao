// firebase-config.js
// ATENÇÃO: Substitua com suas próprias credenciais do Firebase
// Você encontra isso no Console do Firebase > Configurações do Projeto > (Geral) > Seus apps

const firebaseConfig = {
  apiKey: "AIzaSyBpfkslaDvzPdOpNlfk1Psem1dai6ta0Zc",
  authDomain: "fotogestao-ea6d7.firebaseapp.com",
  projectId: "fotogestao-ea6d7",
  storageBucket: "fotogestao-ea6d7.appspot.com", // Corrigi o .appspot.com que é o padrão
  messagingSenderId: "921005388227",
  appId: "1:921005388227:web:b0607f0602374b5acd0d76"
};

// Inicializa o Firebase
// Não altere daqui para baixo
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();