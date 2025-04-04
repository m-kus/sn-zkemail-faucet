import React from 'react';
import './App.css';
import ProofGenerator from './components/ProofGenerator';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Lu.ma Event Registration Verifier</h1>
        <p>Create a pre-funded account by proving you have an approval email from Lu.ma</p>
      </header>
      <main>
        <div className="container">
          <div className="info-section">
            <h2>How it works</h2>
            <ol>
              <li>Drag and drop your Lu.ma event approval email (.eml file)</li>
              <li>Our app will generate a zero-knowledge proof of your registration</li>
              <li>Your pre-funded account will be created automatically</li>
            </ol>
            <p className="note">Note: We never see the content of your email - only the proof of registration is processed.</p>
          </div>
          <ProofGenerator />
        </div>
      </main>
      <footer>
        <p>Powered by ZK Email verification technology</p>
      </footer>
    </div>
  );
}

export default App; 