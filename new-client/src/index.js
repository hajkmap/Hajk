import "ol/ol.css";
import "./index.css";
import registerServiceWorker from "./registerServiceWorker";

import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App.js";
import buildConfig from "./buildConfig.json";

fetch("appConfig.json")
  .then(appConfigResponse => {
    appConfigResponse.json().then(appConfig => {
      let defaultMap = appConfig.defaultMap;
      window.location.search
        .replace("?", "")
        .split("&")
        .forEach(pair => {
          if (pair !== "") {
            let keyValue = pair.split("=");
            if (keyValue[0] === "m") {
              defaultMap = keyValue[1];
            }
          }
        });
      Promise.all([
        fetch(`${appConfig.mapserviceBase}/config/layers`),
        fetch(`${appConfig.mapserviceBase}/config/${defaultMap}`)
      ])
        .then(([layersConfigResponse, mapConfigResponse]) => {
          Promise.all([layersConfigResponse.json(), mapConfigResponse.json()])
            .then(([layersConfig, mapConfig]) => {
              var config = {
                appConfig: appConfig,
                layersConfig: layersConfig,
                mapConfig: mapConfig
              };
              ReactDOM.render(
                <App activeTools={buildConfig.activeTools} config={config} />,
                document.getElementById("root")
              );
              registerServiceWorker();
            })
            .catch(err => {
              console.error("Parse error: ", err);
              ReactDOM.render(<div>Fel</div>, document.getElementById("root"));
            });
        })
        .catch(err => {
          console.error("Network error: ", err);
        });
    });
  })
  .catch(err => {
    console.error("Network error: ", err);
  });
