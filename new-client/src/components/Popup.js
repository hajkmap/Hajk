import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Overlay from "ol/Overlay.js";
import "./Popup.css";
import CloseIcon from "@material-ui/icons/Close";
import FeatureInfo from "./FeatureInfo.js";

const styles = theme => ({
  closeButton: {
    position: "absolute",
    top: "5px",
    right: "5px",
    cursor: "pointer",
    padding: "5px"
  }
});

class Popup extends React.Component {
  state = {
    visible: false
  };

  constructor(props) {
    super(props);
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
  }

  createOverlay(evt, features) {
    if (!this.overlay) {
      let container = document.getElementById("popup");
      let closer = document.getElementById("popup-closer");
      closer.onclick = e => {
        if (this.overlay) {
          this.overlay.setPosition(undefined);
          if (this.props.onClose) {
            this.props.onClose();
          }
        }
        return false;
      };

      this.overlay = new Overlay({
        position: undefined,
        element: container,
        positioning: "bottom-left",
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
        <div className={this.classes.closeButton}>
          <CloseIcon aria-label="Close" id="popup-closer" />
        </div>
        <div className="popup-content-container">
          <FeatureInfo features={features} />
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(Popup);
