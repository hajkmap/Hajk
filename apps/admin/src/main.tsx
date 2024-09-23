import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import "./style/index.css";
import ThemeRegistry from "./style/themeRegistry.tsx";

createRoot(document.getElementById("root")!).render(
  <ThemeRegistry>
    <StrictMode>
      <App />
    </StrictMode>
  </ThemeRegistry>
);
