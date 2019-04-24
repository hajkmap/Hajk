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

import "./index.css";
//import $ from 'jquery';
//import find from 'array.prototype.find';

// Copyright (C) 2016 Göteborgs Stad
//
// Denna programvara är fri mjukvara: den är tillåten att distribuera och modifiera
// under villkoren för licensen CC-BY-NC-SA 4.0.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the CC-BY-NC-SA 4.0 licence.
//
// http://creativecommons.org/licenses/by-nc-sa/4.0/
//
// Det är fritt att dela och anpassa programvaran för valfritt syfte
// med förbehåll att följande villkor följs:
// * Copyright till upphovsmannen inte modifieras.
// * Programvaran används i icke-kommersiellt syfte.
// * Licenstypen inte modifieras.
//
// Den här programvaran är öppen i syfte att den skall vara till nytta för andra
// men UTAN NÅGRA GARANTIER; även utan underförstådd garanti för
// SÄLJBARHET eller LÄMPLIGHET FÖR ETT VISST SYFTE.
//
// https://github.com/hajkmap/Hajk

//find.shim();

const fetchConfig = {
  credentials: "same-origin"
};

(function() {
  function create_routes(routes, application_model) {
    var route_settings = {
      routes: {}
    };
    routes.forEach(route => {
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
    var application_model = new ApplicationModel();

    var application_element = React.createElement(ApplicationView, {
      model: application_model,
      tabs: config.router,
      config: config
    });

    var router = Router.extend(create_routes(config.router, application_model));

    new router();
    Backbone.history.start();
    ReactDOM.render(application_element, document.getElementById("root"));
  }

  fetch("config.json", fetchConfig).then(response => {
    response.json().then(config => {
      try {
        load(config);
      } catch (error) {
        console.log("error", error);
      }
    });
  });
})();
