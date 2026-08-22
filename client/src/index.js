import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import reportWebVitals from './reportWebVitals';

// GitHub Pages serves 404.html for unknown SPA routes. The fallback stores
// the requested URL in sessionStorage and redirects to /MangaQu/.
// Restore that original URL before React Router initializes.
const redirect = sessionStorage.getItem('redirect');
if (redirect) {
  sessionStorage.removeItem('redirect');
  window.history.replaceState(null, '', redirect);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send it to an analytics endpoint. Learn more at https://bit.ly/CRA-vitals
reportWebVitals();
