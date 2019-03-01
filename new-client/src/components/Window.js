import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import PanelHeader from "./PanelHeader";
import { Rnd } from "react-rnd";
import { isMobile } from "../utils/IsMobile.js";
import FeatureInfo from "./FeatureInfo.js";

//
// Patch the RND component's onDragStart method with the ability to disable drag by its internal state.
// This is necessary so we can disable/enable drag at any time.
//
Rnd.prototype.onDragStart = function(e, data) {
  if (this.state.disableDrag) {
    return false;
  }
  if (this.props.onDragStart) {
    this.props.onDragStart(e, data);
  }
  if (!this.props.bounds) return;
  var parent = this.getParent();
  var boundary;
  if (this.props.bounds === "parent") {
    boundary = parent;
  } else if (this.props.bounds === "body") {
    boundary = document.body;
  } else if (this.props.bounds === "window") {
    if (!this.resizable) return;
    return this.setState({
      bounds: {
        top: 0,
        right: window.innerWidth - this.resizable.size.width,
        bottom: window.innerHeight - this.resizable.size.height,
        left: 0
      }
    });
  } else {
    boundary = document.querySelector(this.props.bounds);
  }
  if (!(boundary instanceof HTMLElement) || !(parent instanceof HTMLElement)) {
    return;
  }
  var boundaryRect = boundary.getBoundingClientRect();
  var boundaryLeft = boundaryRect.left;
  var boundaryTop = boundaryRect.top;
  var parentRect = parent.getBoundingClientRect();
  var parentLeft = parentRect.left;
  var parentTop = parentRect.top;
  var left = boundaryLeft - parentLeft;
  var top = boundaryTop - parentTop;
  if (!this.resizable) return;
  var offset = this.getOffsetFromParent();
  this.setState({
    bounds: {
      top: top - offset.top,
      right:
        left + (boundary.offsetWidth - this.resizable.size.width) - offset.left,
      bottom:
        top + (boundary.offsetHeight - this.resizable.size.height) - offset.top,
      left: left - offset.left
    }
  });
};

const styles = theme => {
  return {
    window: {
      zIndex: 1199,
      position: "absolute",
      background: "white",
      boxShadow:
        "0px 1px 3px 0px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12)",
      borderRadius: "5px",
      overflow: "hidden",
      [theme.breakpoints.down("md")]: {
        borderRadius: "0 !important"
      }
    },
    panelContent: {
      position: "absolute",
      top: 0,
      right: 0,
      left: 0,
      bottom: 0
    },
    content: {
      position: "absolute",
      top: "46px",
      left: 0,
      right: 0,
      bottom: 0,
      overflowY: "auto",
      padding: "10px",
      cursor: "default !important"
    }
  };
};

class Window extends Component {
  constructor(props) {
    super(props);

    this.state = {
      left: 0,
      top: 0,
      width: 300,
      height: 400
    };

    window.addEventListener("resize", () => {
      if (this.mode === "maximized") {
        this.fit(this.rnd.getSelfElement().parentElement);
      } else {
        this.update(this.rnd.getSelfElement().parentElement);
      }
    });

    if (props.globalObserver) {
      props.globalObserver.subscribe("toolbarExpanded", open => {
        if (this.mode === "maximized") {
          this.fit(this.rnd.getSelfElement().parentElement);
        } else {
          this.update(this.rnd.getSelfElement().parentElement);
        }
      });
    }
  }

  componentDidMount() {
    var { width, height, left, mode, position, top } = this.props;

    this.mainHeight = window.innerHeight - 64;
    if (mode === "panel") {
      this.left = this.rnd
        .getSelfElement()
        .parentElement.getBoundingClientRect().x;
      this.top = 0;
      this.width = width;
      this.height = this.mainHeight;
    }
    if (mode === "window") {
      this.top = top;
      this.left = left;
      this.width = width;
      this.height = height === "auto" ? this.mainHeight - top - 60 : height;
    }
    if (position === "right") {
      this.left = window.innerWidth - width - 10;
    }
    if (isMobile) {
      this.left = 0;
      this.top = 0;
      this.height = window.innerHeight;
      this.width = document.body.clientWidth;
    }

    this.mode = "window";

    this.setState(
      {
        left: this.left !== undefined ? this.left : 8,
        top: this.top,
        width: this.width,
        height: this.height,
        mode: "window"
      },
      () => {
        this.rnd.updatePosition({
          y: this.top,
          x: this.left
        });
      }
    );
  }

  close = e => {
    const { onClose } = this.props;
    this.latestWidth = this.rnd.getSelfElement().clientWidth;
    if (onClose) onClose();
  };

  update = target => {
    var currentOffset = target.getBoundingClientRect().x;
    if (!this.offset || currentOffset > this.offset) {
      this.offset = target.getBoundingClientRect().x;
    }

    var width = this.rnd.getSelfElement().clientWidth;

    if (this.left < currentOffset || this.offset === this.left) {
      let n = target.getBoundingClientRect().x;
      this.rnd.updatePosition({
        x: n
      });
      this.left = n;
    }
    if (width === 0) {
      width = this.latestWidth;
    }
    if (width > target.clientWidth) {
      this.setState({
        width: this.rnd.getParentSize().width
      });
    }
    if (this.left + width > window.innerWidth) {
      let w = window.innerWidth - width;
      this.rnd.updatePosition({
        x: w
      });
      this.left = w;
    }
  };

  fit = target => {
    this.rnd.updatePosition({
      x: target.getBoundingClientRect().x,
      y: 0
    });
    this.rnd.setState({
      disableDrag: true
    });
    this.setState({
      width: target.clientWidth,
      height: target.clientHeight
    });
    this.mode = "maximized";
  };

  reset = target => {
    this.rnd.updatePosition({
      y: this.top,
      x: this.left
    });
    this.rnd.setState({
      disableDrag: false
    });
    this.setState({
      width: this.width,
      height: this.height
    });
    this.mode = "window";
  };

  enlarge = () => {
    let w = document.getElementsByTagName("main")[0].clientHeight;
    let t = parseInt(this.top);
    let h = parseInt(this.height);
    if (t + h > w) {
      this.top = w - h;
    }
    this.rnd.updatePosition({
      y: this.top
    });
    this.rnd.setState({
      disableDrag: false
    });
    this.setState({
      height: this.height
    });
    this.mode = "window";
  };

  moveToTop = () => {
    this.rnd.updatePosition({
      y: 0
    });
  };

  moveToBottom = target => {
    this.rnd.updatePosition({
      y: window.innerHeight - 45
    });
    this.mode = "minimized";
  };

  maximize = e => {
    const { onMaximize } = this.props;
    if (isMobile) {
      this.moveToTop();
    } else {
      switch (this.mode) {
        case "minimized":
          this.enlarge();
          break;
        case "window":
          this.fit(this.rnd.getSelfElement().parentElement);
          break;
        case "maximized":
          this.reset(this.rnd.getSelfElement().parentElement);
          break;
        default:
          break;
      }
    }
    if (onMaximize) onMaximize();
  };

  minimize = e => {
    const { onMinimize } = this.props;
    if (this.mode === "maximized") {
      this.reset(this.rnd.getSelfElement().parentElement);
    }
    if (isMobile) {
      this.moveToBottom(this.rnd.getSelfElement().parentElement);
    } else {
      this.mode = "minimized";
      this.height = this.state.height;
      this.setState({
        height: 0
      });
    }
    if (onMinimize) onMinimize();
  };

  render() {
    const { classes, title, children, features } = this.props;
    var { left, top, width, height } = this.state;
    var resizeBottom = true,
      resizeBottomLeft = true,
      resizeBottomRight = true,
      resizeLeft = true,
      resizeRight = true,
      resizeTop = true,
      resizeTopLeft = true,
      resizeTopRight = true;
    if (isMobile) {
      resizeBottom = resizeBottomLeft = resizeBottomRight = resizeRight = resizeTopLeft = resizeTopRight = resizeLeft = false;
    } else {
      if (this.mode === "maximized") {
        resizeBottom = resizeBottomLeft = resizeBottomRight = resizeRight = resizeTop = resizeTopLeft = resizeTopRight = resizeLeft = false;
      }
    }

    return (
      <Rnd
        ref={c => {
          this.rnd = c;
        }}
        style={{
          display: this.props.open ? "block" : "none"
        }}
        onDragStop={(e, d) => {
          this.left = this.rnd.getSelfElement().getClientRects()[0].x;
          this.top = d.y;
        }}
        onDrag={(e, d) => {
          this.setState({
            top: d.y
          });
        }}
        onResizeStop={() => {}}
        onResize={(e, direction, ref, delta, position) => {
          this.width = ref.style.width;
          this.height = ref.style.height;
          this.setState({
            width: ref.style.width,
            height: ref.style.height
          });
        }}
        cancel="section,nav"
        disableDragging={false}
        enableResizing={{
          bottom: resizeBottom,
          bottomLeft: resizeBottomLeft,
          bottomRight: resizeBottomRight,
          left: resizeLeft,
          right: resizeRight,
          top: resizeTop,
          topLeft: resizeTopLeft,
          topRight: resizeTopRight
        }}
        className={classes.window}
        minWidth={300}
        minHeight={this.mode === "minimized" ? 46 : 400}
        bounds={isMobile ? "footer" : "article"}
        size={{
          width: width,
          height: height
        }}
        default={{
          x: left,
          y: top,
          width: width,
          height: height
        }}
      >
        <div className={classes.panelContent}>
          <PanelHeader
            onClose={this.close}
            title={title}
            top={top}
            onMaximize={this.maximize}
            onMinimize={this.minimize}
            mode={this.mode}
          />
          <section className={classes.content}>
            <div className={classes.drawerPaperContent}>
              {features ? (
                <FeatureInfo
                  features={this.props.features}
                  onDisplay={this.props.onDisplay}
                  key={
                    Array.isArray(this.props.features) &&
                    this.props.features.length > 0
                      ? this.props.features[0].getId()
                      : 0
                  }
                />
              ) : (
                children
              )}
            </div>
          </section>
        </div>
      </Rnd>
    );
  }
}

Window.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Window);
