import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Overlay from "ol/Overlay.js";
import marked from "marked";
import "./Popup.css";
import IconButton from "@material-ui/core/IconButton";
import ArrowLeftIcon from "@material-ui/icons/ArrowLeft";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import CloseIcon from "@material-ui/icons/Close";

const styles = theme => ({
  floatLeft: {
    float: "left"
  },
  floatRight: {
    float: "right"
  }
});

class Popup extends React.Component {
  state = {
    selectedIndex: 1,
    visible: false
  };

  constructor(props) {
    super(props);
    marked.setOptions({
      sanitize: false,
      xhtml: true
    });
    this.classes = this.props.classes;
  }

  // FIXME: Replace. Refer to https://github.com/hajkmap/Hajk/issues/175
  UNSAFE_componentWillReceiveProps(e) {
    this.setState({
      selectedIndex: 1
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      this.props.mapClickDataResult !== nextProps.mapClickDataResult ||
      nextState.selectedIndex !== this.state.selectedIndex
    );
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
    var toggler = null;
    if (features.length > 1) {
      toggler = (
        <div className="toggle">
          <IconButton
            className={this.classes.floatLeft}
            aria-label="Previous"
            color="primary"
            id="step-left"
          >
            <ArrowLeftIcon />
          </IconButton>
          <span className="toggle-text">
            {this.state.selectedIndex} av {features.length}
          </span>
          <IconButton
            className={this.classes.floatRight}
            aria-label="Next"
            color="primary"
            id="step-right"
          >
            <ArrowRightIcon />
          </IconButton>
        </div>
      );
    }

    var featureList = features.map((feature, i) => {
      var markdown =
          feature.layer.get("layerInfo") &&
          feature.layer.get("layerInfo").information,
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
          if (this.props.onClose) {
            this.props.onClose();
          }
          closer.blur();
        }
        return false;
      };

      this.overlay = new Overlay({
        position: undefined,
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
      this.props.mapClickDataResult &&
      this.props.mapClickDataResult.evt &&
      this.props.mapClickDataResult.features.length > 0
    ) {
      document.getElementById("popup").style.display = "inherit";
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
        <IconButton
          className={this.classes.floatRight}
          aria-label="Close"
          color="default"
          id="popup-closer"
        >
          <CloseIcon />
        </IconButton>
        <div>{this.html(features)}</div>
      </div>
    );
  }
}

export default withStyles(styles)(Popup);
