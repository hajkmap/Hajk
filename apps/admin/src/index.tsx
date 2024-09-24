import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import ThemeRegistry from "./style/theme-registry.tsx";

import "./style/index.css";
import "./i18n/i18n.ts";

import RootLayout from "./layouts/root/index.tsx";

import IndexPage from "./pages/index.tsx";
import ErrorPage from "./pages/error/index.tsx";
import LayersPage from "./pages/layers/index.tsx";
import MapsPage from "./pages/maps/index.tsx";
import ToolsPage from "./pages/tools/index.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <IndexPage />,
      },
      {
        path: "layers",
        element: <LayersPage />,
      },
      {
        path: "maps",
        element: <MapsPage />,
      },
      {
        path: "tools",
        element: <ToolsPage />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <ThemeRegistry>
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  </ThemeRegistry>
);
