import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Auth0Provider } from '@auth0/auth0-react'
import { PrimeReactProvider } from 'primereact/api'
import { SocketProvider } from "./context/SocketProvider.jsx"
// import {BrowserRouter} from "react-router-dom"

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    {/* <React.StrictMode> */}
    <SocketProvider>
      <Auth0Provider
        domain="dev-irqg4wwzy1lzii6x.uk.auth0.com"
        clientId="ZJZe3cz11Re4DM8OtuEtxSbCh9wekZia"
        authorizationParams={{
          redirect_uri: window.location.origin
        }}
      >
        <PrimeReactProvider>
          {/* <BrowserRouter> */}
          <App />
          {/* </BrowserRouter> */}
        </PrimeReactProvider>
      </Auth0Provider>
    </SocketProvider>
    {/* </React.StrictMode>, */}
  </>
)
