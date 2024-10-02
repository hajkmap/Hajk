import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import ThemeRegistry from "./style/theme-registry.tsx";

import "./style/index.css";
import "./i18n/i18n.ts";
import App from "./app.tsx";

createRoot(document.getElementById("root")!).render(
  <ThemeRegistry>
    <StrictMode>
      <App />
    </StrictMode>
  </ThemeRegistry>
);
