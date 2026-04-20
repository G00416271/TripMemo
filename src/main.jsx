import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import UploadFiles from "./uploadFiles.jsx";
import "leaflet/dist/leaflet.css";
import ConnStatus from "./devtools/Devtools.jsx";
import { AuthProvider } from "./Auth.jsx";
import { Auth0Provider } from "@auth0/auth0-react";


createRoot(document.getElementById("root")).render(
  <StrictMode>
      <Auth0Provider
      domain="tripmemo.eu.auth0.com"
      clientId="TwhscpkSfRDMQjXPvCACYZXeVtKKWHnp"
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
    >
    <AuthProvider>
      <App />
    </AuthProvider>
    </Auth0Provider>
    {/* <ConnStatus /> */}
  </StrictMode>,
);
