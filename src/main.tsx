import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/ThemeProvider'
import { ScopeProvider } from './contexts/ScopeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="pelico-ui-theme">
      <ScopeProvider>
        <App />
      </ScopeProvider>
    </ThemeProvider>
  </StrictMode>,
)
