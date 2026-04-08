import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { assertNoFrontendSecrets } from '@/lib/frontend-env'

assertNoFrontendSecrets()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
