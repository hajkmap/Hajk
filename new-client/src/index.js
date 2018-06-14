import React from 'react';
import ReactDOM from 'react-dom';
import './../node_modules/ol/ol.css';
import './index.css'
import Map from './views/map.js';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<Map />, document.getElementById('root'));
registerServiceWorker();