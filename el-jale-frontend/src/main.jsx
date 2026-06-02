import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: { fontFamily: 'inherit', fontSize: '14px' },
        success: { iconTheme: { primary: '#f97316', secondary: '#fff' } },
      }}
    />
  </StrictMode>,
)
