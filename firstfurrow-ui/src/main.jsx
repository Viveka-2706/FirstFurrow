import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './i18n/LanguageContext'
import { ReferenceProvider } from './data/ReferenceProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ReferenceProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ReferenceProvider>
  </StrictMode>,
)
