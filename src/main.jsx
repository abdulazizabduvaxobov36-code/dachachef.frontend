import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { Provider } from "./components/ui/provider.jsx";
import { BrowserRouter } from "react-router-dom";
import "./i18n.js";
import "./responsive.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Provider>
        <App />
      </Provider>
    </BrowserRouter>
  </StrictMode>
);