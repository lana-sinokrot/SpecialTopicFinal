import { Auth0Provider } from '@auth0/auth0-react';

<Auth0Provider
  domain="YOUR_DOMAIN"
  clientId="YOUR_CLIENT_ID"
  authorizationParams={{
    redirect_uri: window.location.origin,
    audience: "https://incident-api" // must match your API identifier in Auth0
  }}
>
  <App />
</Auth0Provider>
