import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Auth0Provider } from '@auth0/auth0-react'
import { PrimeReactProvider } from 'primereact/api'
import { AUTH0_DOMAIN, AUTH0_CLIENT_ID } from "./utils/constants.js"

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    {/* <React.StrictMode> */}
    <SocketProvider>
      <Auth0Provider
        domain={AUTH0_DOMAIN}
        clientId={AUTH0_CLIENT_ID}
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
