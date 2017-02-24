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
// https://github.com/Johkar/Hajk2
import React from 'react';
import ReactDOM from 'react-dom';
import Backbone from 'backbone';
import { Router } from 'backbone';
import ApplicationView from './views/application.jsx';
import ApplicationModel from './models/application.js';
import $ from 'jquery';

(function() {

  "use strict";

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
        application_model.set('content', route.name)
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
    ReactDOM.render(application_element, document.getElementById('app'));
  }

  $.get('config.json', function (config) {
    load(config);
  });

}());
