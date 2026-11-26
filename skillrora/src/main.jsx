import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/base.css'
import './styles/home.css'
import './styles/explore.css'
import './styles/detail.css'
import './styles/login.css'
import './styles/gig.css'
import './styles/seller.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
