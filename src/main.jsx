import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/public/public-site.css'
import { assertNoFrontendSecrets } from '@/lib/frontend-env'

assertNoFrontendSecrets()

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root was not found')
}

if (rootElement.hasChildNodes()) {
  ReactDOM.hydrateRoot(rootElement, <App />)
} else {
  ReactDOM.createRoot(rootElement).render(<App />)
}
