import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Same local font files as the client. 600 is included because the admin scale uses it.
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/600.css";
import "@fontsource/roboto/700.css";
import "@fontsource/material-icons";

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
