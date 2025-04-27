import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Create root for React 18
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Fix input fields that might be non-interactive
document.addEventListener('DOMContentLoaded', () => {
  // Add a small delay to ensure React has fully rendered
  setTimeout(() => {
    const fixInputs = () => {
      const inputs = document.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        if (!input.hasAttribute('disabled')) {
          // Force pointer-events to auto for all non-disabled inputs
          (input as HTMLElement).style.pointerEvents = 'auto';
        }
      });
    };
    
    // Run the fix initially
    fixInputs();
    
    // Also run it after any potential React rerenders
    const observer = new MutationObserver(fixInputs);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
  }, 500);
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
