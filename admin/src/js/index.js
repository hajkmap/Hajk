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
    var application_view = require('views/application')
    ,   application_model = require('models/application')
    ,   application_element = React.createElement(application_view, {
          model: application_model,
          tabs: config.router,
          config: config
        })
    ,   router = Backbone.Router.extend(create_routes(config.router, application_model));

    new router();
    Backbone.history.start();
    ReactDOM.render(application_element, document.getElementById('app'));
  }

  $.get('config.json', function (config) {
    load(config);
  });

}());
