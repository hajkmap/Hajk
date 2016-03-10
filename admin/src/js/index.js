(function() {

  "use strict";

  var route_config = [
    { name: "manager", title: "Lagerhanterare", default: true },
    { name: "menu",    title: "Lagermeny" },
    { name: "map",     title: "Karta" },
    { name: "release", title: "Driftsätt" }
  ];

  function create_routes(routes) {
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

  var application_view = require('views/application')
  ,   application_model = require('models/application')
  ,   application_element = React.createElement(application_view, {
        model: application_model,
        tabs: route_config
      })
  ,   router = Backbone.Router.extend(create_routes(route_config));

  new router();
  Backbone.history.start();
  ReactDOM.render(application_element, document.getElementById('app'));

}());
