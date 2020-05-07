import React from 'react';
import logo from './logo.svg';
import './App.css';
import firebase, { analytics, auth, firestore, storage } from './firebase';
import ArticlesList from './components/articles-list';

function App() {

  const dbRef = firestore.collection('articles');
  


  return (
    <div className="App">
      <h1>Vesti</h1>
      <ArticlesList/>
    </div>
  );
}

export default App;
