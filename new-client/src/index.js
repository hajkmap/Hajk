import React from 'react';
import ReactDOM from 'react-dom';
import './../node_modules/ol/ol.css';
import './index.css'
import App from './views/app.js';
import registerServiceWorker from './registerServiceWorker';
import buildConfig from './buildConfig.json';

Promise.all([
  fetch('http://giscloud.se/mapservice/config/layers'),
  fetch('http://giscloud.se/mapservice/config/map_1'),
  fetch('config.json')
]).then(([layersResponse, mapConfigResponse, appConfigResponse]) => {
  Promise.all([
    layersResponse.json(),
    mapConfigResponse.json(),
    appConfigResponse.json()])
  .then(([layers, mapConfig, appConfig]) => {

    console.log(layers, mapConfig, appConfig);
    ReactDOM.render(<App activeTools={buildConfig.activeTools} config={appConfig} />, document.getElementById('root'));
    registerServiceWorker();

  }).catch(err => {

    console.error("Parse error: ", err);
    ReactDOM.render(<div>Fel</div>, document.getElementById('root'));
    registerServiceWorker();

  });

}).catch(err => {
  console.error("Network error: ", err);
});