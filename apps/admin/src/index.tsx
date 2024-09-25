import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import ThemeRegistry from "./style/theme-registry.tsx";
import { queryConfig } from "./lib/react-query.ts";

import "./style/index.css";
import "./i18n/i18n.ts";

import RootLayout from "./layouts/root/index.tsx";

import IndexPage from "./pages/index.tsx";
import ErrorPage from "./pages/error/index.tsx";
import LayersPage from "./pages/layers/index.tsx";
import MapsPage from "./pages/maps/index.tsx";
import ToolsPage from "./pages/tools/index.tsx";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

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
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools />
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>
  </ThemeRegistry>
);
