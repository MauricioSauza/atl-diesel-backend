import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProvider } from '@shopify/polaris'
import en from '@shopify/polaris/locales/en.json'
import '@shopify/polaris/build/esm/styles.css'
import App from './App.tsx'

const root = document.getElementById('root')
if (root === null) {
  throw new Error('Missing #root element in index.html')
}

createRoot(root).render(
  <StrictMode>
    <AppProvider i18n={en}>
      <App />
    </AppProvider>
  </StrictMode>,
)
