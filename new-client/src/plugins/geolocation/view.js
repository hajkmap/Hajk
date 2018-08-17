import React, { Component } from "react";
import Observer from "react-event-observer";
import GeolocationModel from "./model.js";
import { createPortal } from "react-dom";
import { transform } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";
import "./style.css";

class Geolocation extends Component {
  constructor() {
    super();
    this.state = {
      toggled: false
      // currentCoords: null
    };
  }

  /* TODO:
   * Make the "here you are" dot look nicer.
   * Add listener this.on('change:location', () => { this.setLocation(); }) and update dot's location
   * Don't render that nasty <span> to #toolbar!
   * */

  componentDidMount() {
    this.observer = Observer();
    this.observer.subscribe("myEvent", message => {
      console.log(message);
    });
    this.GeolocationModel = new GeolocationModel({
      map: this.props.tool.map,
      app: this.props.tool.app,
      observer: this.observer
    });
    this.props.tool.instance = this;
    this.map = this.props.tool.map;

    // Init geolocation layer where the point will be drawn to
    this.source = new VectorSource({ wrapX: false });
    this.layer = new VectorLayer({
      source: this.source,
      name: "geolocation-layer"
    });
    this.map.addLayer(this.layer);
  }

  drawPoint = coords => {
    this.layer.getSource().clear();
    let point = new Point(coords);
    this.layer.getSource().addFeature(
      new Feature({
        geometry: point
      })
    );
  };

  handleClick = () => {
    this.btn.setAttribute("disabled", "disabled");
    navigator.geolocation.getCurrentPosition(pos => {
      const transformed = transform(
        [pos.coords.longitude, pos.coords.latitude],
        "EPSG:4326",
        this.map.getView().getProjection()
      );
      // this.setState({ currentCoords: transformed });
      this.drawPoint(transformed);
      this.map.getView().animate({ center: transformed, zoom: 10 });
    });
    this.btn.removeAttribute("disabled");
  };

  render() {
    return (
      <span>
        {createPortal(
          <div className="ol-control ol-geolocation">
            <button
              type="button"
              title="Zooma till min nuvarande position"
              ref={btn => {
                this.btn = btn; // expose a ref btn can be reached from handleClick and disabled/enabled
              }}
              onClick={this.handleClick}
            >
              <i className="material-icons">navigation</i>
            </button>
          </div>,
          document.getElementById("map")
        )}
      </span>
    );
  }
}

export default Geolocation;
