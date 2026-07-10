import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

const globalStyles = document.createElement('style');
globalStyles.innerHTML = `
  * { box-sizing: border-box; }
  body { margin: 0; background: #0A0C16; }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-thumb { background: #232848; border-radius: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
`;
document.head.appendChild(globalStyles);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
