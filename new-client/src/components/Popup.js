import React, { Component } from "react";
import Overlay from "ol/Overlay.js";
import marked from "marked";
import "./Popup.css";

class Popup extends Component {
  constructor() {
    super();
    this.state = {
      selectedIndex: 1
    };
  }

  componentDidMount() {}

  componentWillReceiveProps() {
    this.setState({
      selectedIndex: 1
    });
  }

  componentDidUpdate() {
    this.createOverlay();
    var left = document.getElementById("step-left");
    var right = document.getElementById("step-right");

    if (left && right) {
      left.onclick = () => {
        this.changeSelectedIndex(-1);
      };
      right.onclick = () => {
        this.changeSelectedIndex(1);
      };
    }
  }

  table(data) {
    return Object.keys(data).map((key, i) => {
      if (typeof data[key] !== "object") {
        return (
          <div key={i}>
            <span>{key}</span>: <span>{data[key]}</span>
          </div>
        );
      } else {
        return null;
      }
    });
  }

  parse(markdown, properties) {
    markdown = markdown.replace(/export:/g, "");
    if (markdown && typeof markdown === "string") {
      (markdown.match(/{(.*?)}/g) || []).forEach(property => {
        function lookup(o, s) {
          s = s
            .replace("{", "")
            .replace("}", "")
            .split(".");
          switch (s.length) {
            case 1:
              return o[s[0]] || "";
            case 2:
              return o[s[0]][s[1]] || "";
            case 3:
              return o[s[0]][s[1]][s[2]] || "";
            default:
              return "";
          }
        }
        markdown = markdown.replace(property, lookup(properties, property));
      });
    }

    return {
      __html: marked(markdown)
    };
  }

  changeSelectedIndex(amount) {
    var eot = false;
    if (
      amount > 0 &&
      this.props.mapClickDataResult.features.length === this.state.selectedIndex
    ) {
      eot = true;
    } else if (amount < 0 && this.state.selectedIndex === 1) {
      eot = true;
    }
    if (!eot) {
      this.setState({
        selectedIndex: this.state.selectedIndex + amount
      });
    }
  }

  html(features) {
    if (!features) return "";

    var visibleStyle = currentIndex => {
      var displayValue =
        this.state.selectedIndex === currentIndex + 1 ? "block" : "none";
      return {
        display: displayValue
      };
    };

    var toggler = (
      <div className="toggle">
        <i className="material-icons pull-left clickable" id="step-left">
          arrow_left
        </i>
        <span className="toggle-text">
          {this.state.selectedIndex} av {features.length}
        </span>
        <i className="material-icons pull-right clickable" id="step-right">
          arrow_right
        </i>
      </div>
    );

    var featureList = features.map((feature, i) => {
      var markdown = feature.layer.get("layerInfo").information,
        value = markdown
          ? this.parse(markdown, feature.getProperties())
          : this.table(feature.getProperties());

      if (markdown) {
        return (
          <div
            key={i}
            className="markdown-content"
            dangerouslySetInnerHTML={value}
            style={visibleStyle(i)}
          />
        );
      } else {
        return (
          <div key={i} style={visibleStyle(i)}>
            {value}
          </div>
        );
      }
    });

    return (
      <div>
        {toggler}
        <div id="popup-content">{featureList}</div>
      </div>
    );
  }

  createOverlay(evt, features) {
    if (!this.overlay) {
      let container = document.getElementById("popup");
      let closer = document.getElementById("popup-closer");

      closer.onclick = () => {
        if (this.overlay) {
          this.overlay.setPosition(undefined);
          closer.blur();
        }
        return false;
      };

      this.overlay = new Overlay({
        element: container,
        autoPan: true,
        autoPanAnimation: {
          duration: 250
        }
      });
      if (this.props.map) {
        this.props.map.addOverlay(this.overlay);
      }
    }

    if (
      this.props.mapClickDataResult.evt &&
      this.props.mapClickDataResult.features.length > 0
    ) {
      this.overlay.setPosition(this.props.mapClickDataResult.evt.coordinate);
    } else {
      this.overlay.setPosition(undefined);
    }
  }

  render() {
    var features;
    if (this.props.mapClickDataResult) {
      features = this.props.mapClickDataResult.features;
    }

    return (
      <div id="popup" className="ol-popup">
        <i
          id="popup-closer"
          className="ol-popup-closer clickable material-icons"
        >
          close
        </i>
        <div>{this.html(features)}</div>
      </div>
    );
  }
}

export default Popup;
