import "ol/ol.css";
import "./index.css";
import registerServiceWorker from "./registerServiceWorker";

import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App.js";
import buildConfig from "./buildConfig.json";

const networkErrorMessage =
  "Fel när applikationen skulle läsas in. Detta beror troligtvis på ett nätverksfel. Försök igen senare.";
const parseErrorMessage =
  "Fel när applikationen skulle läsas in. Detta beror troligtvis på ett konfigurationsfel. Försök igen senare.";

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
              ReactDOM.render(
                <div className="start-error">
                  <div>
                    <i className="material-icons">error</i>
                  </div>
                  <div>{parseErrorMessage}</div>
                </div>,
                document.getElementById("root")
              );
            });
        })
        .catch(err => {
          console.error("Network error: ", err);
          ReactDOM.render(
            <div className="start-error">
              <div>
                <i className="material-icons">error</i>
              </div>
              <div>{networkErrorMessage}</div>
            </div>,
            document.getElementById("root")
          );
        });
    });
  })
  .catch(err => {
    console.error("Network error: ", err);
    ReactDOM.render(
      <div className="start-error">
        <div>
          <i className="material-icons">error</i>
        </div>
        <div>{networkErrorMessage}</div>
      </div>,
      document.getElementById("root")
    );
  });
