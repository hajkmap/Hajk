import "react-perfect-scrollbar/dist/css/styles.css";
import React, { useEffect, useState } from "react";
import { useRoutes } from "react-router-dom";
import { ThemeProvider } from "@material-ui/core";
import GlobalStyles from "src/components/GlobalStyles";
import "src/mixins/chartjs";
import theme from "src/theme";
import routes from "src/routes";

import ConfigContext from "./utils/ConfigContext";

const App = () => {
  const routing = useRoutes(routes);
  const [layers, setLayers] = useState(null);
  const [mapConfig, setMapConfig] = useState(null);

  useEffect(() => {
    async function fetchConfig() {
      const appConfigResponse = await fetch(
        "http://localhost:3001/appConfig.json"
      );
      const appConfig = await appConfigResponse.json();
      console.log("appConfig: ", appConfig);

      const { api } = appConfig;

      const layersResponse = await fetch(`${api}/config/layers`);
      const l = await layersResponse.json();
      setLayers(l);

      const mapResponse = await fetch(`${api}/config/ext`);
      const m = await mapResponse.json();
      setMapConfig(m);
    }
    fetchConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{ layers, mapConfig }}>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        {routing}
      </ThemeProvider>
    </ConfigContext.Provider>
  );
};

export default App;
