import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import UploadFiles from "./uploadFiles.jsx";
import "leaflet/dist/leaflet.css";
import ConnStatus from "./devtools/Devtools.jsx";
import { AuthProvider } from "./Auth.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
    <ConnStatus />
  </StrictMode>,
);
