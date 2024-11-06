import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { queryConfig } from "./lib/react-query.ts";

import RootLayout from "./layouts/root/index.tsx";

import IndexPage from "./pages/index.tsx";
import ErrorPage from "./pages/error/index.tsx";
import LayersPage from "./pages/layers/index.tsx";
import MapsPage from "./pages/maps/index.tsx";
import ToolsPage from "./pages/tools/index.tsx";

import useAppStateStore from "./store/use-app-state-store.ts";
import SettingsPage from "./pages/settings/index.tsx";
import ServicesPage from "./pages/services/index.tsx";
import GroupsPage from "./pages/groups/index.tsx";
import FormFactoryPage from "./pages/form-factory/index.tsx";
import LoginPage from "./pages/login/index.tsx";

const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

const router = createBrowserRouter(
  [
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
        {
          path: "services",
          element: <ServicesPage />,
        },
        {
          path: "groups",
          element: <GroupsPage />,
        },
        {
          path: "settings",
          element: <SettingsPage />,
        },
        {
          path: "form-factory",
          element: <FormFactoryPage />,
        },
      ],
    },
    {
      path: "login",
      element: <LoginPage />,
    },
  ],
  { basename: import.meta.env.BASE_URL }
);

export default function App() {
  const { loadConfig, loading } = useAppStateStore();

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  return !loading ? (
    <QueryClientProvider client={queryClient}>
      {import.meta.env.DEV && <ReactQueryDevtools />}
      <RouterProvider router={router} />
    </QueryClientProvider>
  ) : (
    <div>Loading...</div>
  );
}
