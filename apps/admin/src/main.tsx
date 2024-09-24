import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./app.tsx";
import "./style/index.css";
import ThemeRegistry from "./style/theme-registry.tsx";

createRoot(document.getElementById("root")!).render(
  <ThemeRegistry>
    <StrictMode>
      <App />
    </StrictMode>
  </ThemeRegistry>
);
