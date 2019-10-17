import { Style, Icon, Fill, Stroke, Circle } from "ol/style";
import { Vector } from "ol/source";
import { Vector as layerVector } from "ol/layer";
import { Point } from "ol/geom";
import { Feature } from "ol";
import { transform } from "ol/proj";
import { Polyline } from "ol/format";

const loadGoogleMapsApi = require("load-google-maps-api");

class RouteModel {
  constructor(settings) {
    this.olMap = settings.map;
    this.localObserver = settings.localObserver;
    this.apiKey = settings.options.apiKey;
    this.travelMode = "WALKING";
    this.travelModeLabels = {
      WALKING: "Gå",
      DRIVING: "Kör",
      TRANSIT: "Kollektivtrafik",
      BICYCLING: "Cykla"
    };

    this.position = {
      latitude: undefined,
      longitude: undefined,
      latitudeEnd: undefined,
      longitudeEnd: undefined
    };
    this.projection = settings.app.config.mapConfig.map.projection;

    loadGoogleMapsApi({
      key: this.apiKey
    }).then(googleMapApi => {
      this.googleMapsApi = googleMapApi;
    });

    this.initiateRoutingLayerInOpenLayersMap();
  }

  setTravelMode = travelModeKey => {
    this.travelMode = this.googleMapsApi.DirectionsTravelMode.hasOwnProperty(
      travelModeKey
    )
      ? this.googleMapsApi.DirectionsTravelMode[travelModeKey]
      : "WALKING";
    this.travelModeLabel = this.travelModeLabels[this.travelMode];
    this.localObserver.publish("doneWithStep", 3);
  };

  getCurrentPositionSuccess = pos => {
    this.position = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude
    };
    this.setPosition();
  };

  getCurrentPositionError = err => {
    console.error(err);
  };

  setPosition = () => {
    this.layer_start.getSource().clear();
    if (this.position.longitude && this.position.latitude) {
      var point = new Point([this.position.longitude, this.position.latitude]);
      var transformed = transform(
        point.getCoordinates(),
        "EPSG:4326",
        this.olMap.getView().getProjection()
      );
      point.setCoordinates(transformed);
      var ft = new Feature({ geometry: point });
      ft.setStyle(this.style_start);
      this.layer_start.getSource().addFeature(ft);
      this.olMap.getView().setCenter(point.getCoordinates());

      this.localObserver.publish("doneWithStep", 1);
      this.localObserver.publish("startModeSelected", "gps");
    }
  };

  getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this.getCurrentPositionSuccess,
        this.getCurrentPositionError
      );
    } else {
      window.alert(
        "Kan inte få position. Skriv startposition i rutan eller tryck position på kartan."
      );
    }
  };

  generatePinIcon(color = "#000000", size = "24") {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"  width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <path fill="${color}" d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" />
    </svg>`;

    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  initiateRoutingLayerInOpenLayersMap() {
    this.style_start = new Style({
      image: new Icon({
        src: this.generatePinIcon("#00a83b", "36")
      })
    });

    this.style_end = new Style({
      image: new Icon({
        src: this.generatePinIcon("#ff4747")
      })
    });

    this.style_route = new Style({
      image: new Icon({
        src: this.generatePinIcon("#6e6e6e")
      })
    });

    this.style_route_normal = this.style_route;

    this.style_route_highlight = new Style({
      image: new Icon({
        src: this.generatePinIcon("#47ff87")
      })
    });

    this.layer_drawing_style = new Style({
      fill: new Fill({
        color: "rgba(255, 255, 255, 0.5)"
      }),
      stroke: new Stroke({
        color: "rgba(0, 0, 255, 0.5)",
        width: 4
      }),
      image: new Circle({
        radius: 6,
        fill: new Fill({
          color: "rgba(0, 0, 0, 0.5)"
        }),
        stroke: new Stroke({
          color: "rgba(255, 255, 255, 0.5)",
          width: 2
        })
      })
    });

    var source_start = new Vector({});
    var source_end = new Vector({});
    var source_route = new Vector({});
    var source_drawing = new Vector({});

    if (this.layer_start === undefined) {
      this.layer_start = new layerVector({
        source: source_start,
        name: "routing",
        content: "Punkt",
        queryable: false,
        style: this.style_start
      });

      this.layer_end = new layerVector({
        source: source_end,
        name: "routing",
        content: "Punkt",
        queryable: false,
        style: this.style_end
      });

      this.layer_route = new layerVector({
        source: source_route,
        name: "routing",
        content: "Punkt",
        queryable: true,
        style: this.style_route
      });

      this.layer_drawing = new layerVector({
        source: source_drawing,
        name: "routing",
        content: "linje",
        queryable: false,
        style: this.layer_drawing_style
      });

      this.olMap.addLayer(this.layer_start);
      this.olMap.addLayer(this.layer_end);
      this.olMap.addLayer(this.layer_route);
      this.olMap.addLayer(this.layer_drawing);
    }
  }

  activateStartMode = () => {
    this.olMap.once("singleclick", this.startPointSelection);
  };

  startPointSelection = e => {
    var startPoint = new Feature(); /* startPoint and point(below) must be the same l.134 */
    startPoint.setGeometry(new Point(e.coordinate));
    /* Convert Geometry to Coordinate */

    var lonlat = transform(
      startPoint.getGeometry().getCoordinates(),
      this.projection,
      "EPSG:4326"
    );
    var lon = lonlat[0];
    var lat = lonlat[1];

    this.layer_start.getSource().clear();
    this.layer_start.getSource().addFeature(startPoint);
    startPoint.setStyle(this.style_start);

    var pos = this.position;
    pos.latitude = lat;
    pos.longitude = lon;
    this.position = pos;

    this.localObserver.publish("doneWithStep", 1);
    this.localObserver.publish("startModeSelected", "manual");
  };

  activateEndMode = () => {
    this.onEndKey = this.olMap.once("singleclick", this.endPointSelection);
  };

  endPointSelection = e => {
    var endPoint = new Feature();
    endPoint.setGeometry(new Point(e.coordinate));

    var lonlat = transform(
      endPoint.getGeometry().getCoordinates(),
      this.projection,
      "EPSG:4326"
    );
    var lon = lonlat[0];
    var lat = lonlat[1];

    this.layer_end.getSource().clear();
    this.layer_end.getSource().addFeature(endPoint);
    endPoint.setStyle(this.style_end);

    var pos = this.position;
    pos.latitudeEnd = lat;
    pos.longitudeEnd = lon;
    this.position = pos;

    this.localObserver.publish("doneWithStep", 2);
  };

  activateRoutingMode() {
    this.searchTrip();
  }

  searchTrip() {
    var pos = this.position;
    if (
      pos.latitude === undefined ||
      pos.longitude === undefined ||
      pos.latitudeEnd === undefined ||
      pos.longitudeEnd === undefined
    ) {
      this.localObserver.publish("startStopPointsMissing");
    } else {
      const googleDirectionsService = new this.googleMapsApi.DirectionsService();

      const rp = {
        origin: { lat: pos.latitude, lng: pos.longitude },
        destination: { lat: pos.latitudeEnd, lng: pos.longitudeEnd },
        travelMode: this.travelMode
      };
      googleDirectionsService.route(rp, res => {
        switch (res.status) {
          case "REQUEST_DENIED":
            this.localObserver.publish("requestDenied");
            break;
          case "ZERO_RESULTS":
            this.localObserver.publish("zeroResults");
            break;
          case "OK":
            this.plotRoute(res, this.map, this.layer_route, this.layer_drawing);
            break;
          default:
            this.localObserver.publish("otherError", res.status);
            break;
        }
      });
    }
  }

  plotRoute(res, map, layer_route, layer_drawing) {
    layer_route.getSource().clear();
    var steps = res.routes[0].legs[0].steps;
    // console.log("steps: ", steps);
    const routeDiv = document.createElement("div");
    const p = document.createElement("p");
    const ul = document.createElement("ol");
    p.innerHTML = `
                    <table class="table table-condensed">
                      <tbody>
                        <tr><td><b>Färdsätt</b></td><td>${this.travelModeLabel}</td></tr>
                        <tr><td><b>Avstånd</b></td><td>${res.routes[0].legs[0].distance.text} (${res.routes[0].legs[0].distance.value} m)</td></tr>
                        <tr><td><b>Tid</b></td><td>${res.routes[0].legs[0].duration.text}</td></tr>
                        <tr><td><b>Startadress</b></td><td>${res.routes[0].legs[0].start_address}</td></tr>
                        <tr><td><b>Slutadress</b></td><td>${res.routes[0].legs[0].end_address}</td></tr>
                      </tbody>
                    </table>
                    `;
    routeDiv.appendChild(p);
    for (var i = 0; i < steps.length; i++) {
      var lat = steps[i].start_location.lat();
      var lng = steps[i].start_location.lng();

      var point = new Point([lng, lat]);

      var transformed = transform(
        point.getCoordinates(),
        "EPSG:4326",
        this.projection
      );
      point.setCoordinates(transformed);

      var n = i + 1;
      var tmpFeature = new Feature({
        geometry: point,
        info: steps[i].instructions
      });
      tmpFeature.number = "" + n;
      tmpFeature.setStyle(this.style_route);

      layer_route.getSource().addFeature(tmpFeature);
      // route features
      var tmpLi = document.createElement("li");
      tmpLi.onclick = this.highlightFeature.bind(this);
      tmpLi.id = "step_number" + n;
      tmpLi.innerHTML = steps[i].instructions;
      ul.appendChild(tmpLi);
    }
    routeDiv.appendChild(ul);

    var resList = document.getElementById("resultList");
    while (resList.firstChild) {
      resList.removeChild(resList.firstChild);
    }

    // put result into the table
    document.getElementById("resultList").appendChild(routeDiv);

    const routePath = new Polyline({}).readGeometry(
      res.routes[0].overview_polyline,
      {
        dataProjection: "EPSG:4326",
        featureProjection: this.projection
      }
    );

    layer_drawing.getSource().clear();
    var ft = new Feature({
      type: "routing",
      geometry: routePath
    });
    ft.setStyle(this.layer_drawing_style);

    layer_drawing.getSource().addFeature(ft);
    var centerLat = (this.position.latitude + this.position.latitudeEnd) / 2;
    var centerLon = (this.position.longitude + this.position.longitudeEnd) / 2;
    this.olMap
      .getView()
      .setCenter(
        transform([centerLon, centerLat], "EPSG:4326", this.projection)
      );
    this.olMap
      .getView()
      .fit(layer_drawing.getSource().getExtent(), this.olMap.getSize());
  }

  highlightFeature(event) {
    var feature_number = -1;
    if (event.target.nodeName === "B") {
      feature_number = event.target.parentNode.id.substring(
        "step_number".length
      );
    } else {
      feature_number = event.target.id.substring("step_number".length);
    }

    var layer = this.layer_route;

    var features = layer.getSource().getFeatures();

    for (var i = 0; i < features.length; i++) {
      if (features[i].number === feature_number) {
        features[i].setStyle(this.style_route_highlight);
      } else {
        features[i].setStyle(this.style_route_normal);
      }
    }
  }

  drawRoute(steps) {
    var routePath = new Polyline({}).readGeometry(steps);

    var ft = new Feature({ type: "routing", geometry: routePath });
    ft.setStyle(this.style_route);
    this.get("layer_drawing")
      .getSource()
      .addFeature(ft);
  }

  clearMap() {
    this.layer_start.getSource().clear();
    this.layer_end.getSource().clear();
    this.layer_route.getSource().clear();
    this.layer_drawing.getSource().clear();

    // Remove the step instructions
    document.getElementById("resultList").innerHTML = "";

    this.position = {
      latitude: undefined,
      longitude: undefined,
      latitudeEnd: undefined,
      longitudeEnd: undefined
    };
  }
}

export default RouteModel;
