import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './index.css'

// Animate the preloader progress bar while JS bundles load
const bar = document.getElementById('preloader-bar')
if (bar) {
  let w = 10
  const interval = setInterval(() => {
    w = Math.min(w + Math.random() * 15, 90)
    bar.style.width = w + '%'
  }, 200)
  window.__preloaderInterval = interval
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
)

// Dismiss preloader after React mounts
requestAnimationFrame(() => {
  const preloader = document.getElementById('preloader')
  const progressBar = document.getElementById('preloader-bar')
  if (window.__preloaderInterval) clearInterval(window.__preloaderInterval)
  if (progressBar) progressBar.style.width = '100%'

  setTimeout(() => {
    if (preloader) {
      preloader.style.opacity = '0'
      preloader.style.visibility = 'hidden'
      setTimeout(() => preloader.remove(), 600)
    }
  }, 1400)
})
