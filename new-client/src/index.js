import React from "react";
import ReactDOM from "react-dom";
import "./../node_modules/ol/ol.css";
import "./index.css";
import App from "./views/app.js";
import registerServiceWorker from "./registerServiceWorker";
import buildConfig from "./buildConfig.json";

fetch("appConfig.json")
  .then(appConfigResponse => {
    appConfigResponse.json().then(appConfig => {
      console.log(appConfig);
      Promise.all([
        fetch(`${appConfig.mapserviceBase}/config/layers`),
        fetch(`${appConfig.mapserviceBase}/config/op`)
      ])
        .then(([layersResponse, mapConfigResponse]) => {
          Promise.all([layersResponse.json(), mapConfigResponse.json()])
            .then(([layers, mapConfig]) => {
              console.log(layers, mapConfig);
              ReactDOM.render(
                <App
                  activeTools={buildConfig.activeTools}
                  config={appConfig}
                />,
                document.getElementById("root")
              );
              registerServiceWorker();
            })
            .catch(err => {
              console.error("Parse error: ", err);
              ReactDOM.render(<div>Fel</div>, document.getElementById("root"));
              registerServiceWorker();
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
