import * as firebase from 'firebase';


import 'firebase/analytics';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';
import 'firebase/performance';

const firebaseConfig = {
  apiKey: "AIzaSyDgL_6B5_EVkeJljC8qC05anG55rb9b27U",
  authDomain: "scrapervesti.firebaseapp.com",
  databaseURL: "https://scrapervesti.firebaseio.com",
  projectId: "scrapervesti",
  storageBucket: "scrapervesti.appspot.com",
  messagingSenderId: "1083280998081",
  appId: "1:1083280998081:web:e7bbdd432162542111de40",
  measurementId: "G-NC9H21R8G1"
};

firebase.initializeApp(firebaseConfig);

export default firebase;

export const analytics = firebase.analytics();
export const auth = firebase.auth();
export const firestore = firebase.firestore();
export const storage = firebase.storage();
export const performance = firebase.performance();
