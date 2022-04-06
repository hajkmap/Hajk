/**
 * IE11 would require either core-js or react-app-polyfills.
 * However, neither seem to work for the moment with our code.
 * If - and only if - IE11 support in admin is required, someone
 * may take a closer look at this.
 *
 * If you uncomment the polyfills below, don't forget to 'npm install'
 * proper packages (they're not in package.json by default). */

// import "core-js";
// import "react-app-polyfill/ie11";
// import "react-app-polyfill/stable";
// IE 11 ends here.

import React from "react";
import ReactDOM from "react-dom";
import Backbone from "backbone";
import { Router } from "backbone";
import ApplicationView from "./views/application.jsx";
import ApplicationModel from "./models/application.js";
import {
  initHFetch,
  hfetch,
  initFetchWrapper,
  wrapJqueryAjax,
} from "./utils/FetchWrapper";
import "./index.css";
import $ from "jquery";
//import find from 'array.prototype.find';

initHFetch();
// Wrap and forget until jquery is gone.
wrapJqueryAjax($);

(function () {
  function create_routes(routes, application_model) {
    const route_settings = {
      routes: {},
    };
    routes.forEach((route) => {
      if (route.default) {
        route_settings.routes[""] = route.name;
      }
      route_settings.routes["!/" + route.name] = route.name;
      route_settings[route.name] = () => {
        application_model.set("content", route.name);
      };
    });
    return route_settings;
  }

  function load(config) {
    const application_model = new ApplicationModel();
    var application_element = React.createElement(ApplicationView, {
      model: application_model,
      tabs: config.router,
      config: config,
    });

    var router = Router.extend(create_routes(config.router, application_model));

    new router();
    Backbone.history.start();
    ReactDOM.render(application_element, document.getElementById("root"));
  }

  hfetch("config.json").then((response) => {
    response.json().then((config) => {
      try {
        // Update hfetch with loaded config.
        initFetchWrapper(config);
        load(config);
      } catch (error) {
        console.log("error", error);
      }
    });
  });
})();
