window.global ||= window;
import App from "./App.tsx";
import { IntlProvider } from "react-intl";
import { ToastContainer, Zoom } from "react-toastify";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import "leaflet/dist/leaflet.css";

import "react-toastify/dist/ReactToastify.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <IntlProvider locale="en">
      <App />
      <ToastContainer
        limit={3}
        pauseOnFocusLoss={false}
        pauseOnHover={false}
        theme="light"
        draggable={false}
        transition={Zoom}
      />
    </IntlProvider>
  </StrictMode>
);
