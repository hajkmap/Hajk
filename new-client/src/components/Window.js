import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import PanelHeader from "./PanelHeader";
import { Rnd } from "react-rnd";
import { isMobile, getIsMobile } from "../utils/IsMobile.js";
import FeatureInfo from "./FeatureInfo.js";

const zIndexStart = 1e3;
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
      zIndex: zIndexStart + document.windows.length,
      position: "absolute",
      background: "white",
      boxShadow:
        "2px 2px 2px rgba(0, 0, 0, 0.4), 0px 0px 4px rgba(0, 0, 0, 0.4)",
      borderRadius: "5px",
      overflow: "hidden",
      pointerEvents: "all",
      [theme.breakpoints.down("xs")]: {
        borderRadius: "0 !important",
        width: "100% !important",
        zIndex: 2,
        position: "fixed !important",
        top: "64px !important"
      }
    },
    panelContent: {
      display: "flex",
      position: "absolute",
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      flexDirection: "column"
    },
    content: {
      flex: "1",
      overflowY: "auto",
      padding: "10px",
      cursor: "default !important",
      [theme.breakpoints.down("xs")]: {
        bottom: "64px"
      }
    }
  };
};

class Window extends React.PureComponent {
  constructor(props) {
    super(props);
    document.windows.push(this);
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
        this.updatePos();
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
    const { globalObserver } = this.props;
    if (globalObserver) {
      globalObserver.on("appLoaded", () => {
        this.updatePosition();
      });
    }
  }

  updatePosition() {
    var { width, height, mode, position } = this.props;
    const parent = this.rnd.getSelfElement().parentElement;
    const header = document.getElementsByTagName("header")[0];
    this.headerHeight = header.clientHeight;
    this.left = parent.getBoundingClientRect().left;
    this.top = parent.getBoundingClientRect().top - this.headerHeight;
    this.width = width;

    if (mode === "panel") {
      this.height = parent.clientHeight;
    }
    if (mode === "window") {
      this.height = height === "auto" ? parent.clientHeight : height;
    }
    if (position === "right") {
      this.left = parent.getBoundingClientRect().right - width;
    }
    if (isMobile) {
      this.left = 0;
      this.top = 0;
      this.height = window.innerHeight;
      this.width = document.body.clientWidth;
    }
    this.left = this.left !== undefined ? this.left : 8;

    this.mode = "window";
    this.right = window.innerWidth - (this.left + parseFloat(this.width));

    this.setState(
      {
        left: this.left,
        top: this.top,
        width: this.width,
        height: this.height,
        mode: "window"
      },
      () => {
        this.rnd.updatePosition({
          y: Math.round(this.top),
          x: Math.round(this.left)
        });
      }
    );
  }

  close = e => {
    const { onClose } = this.props;
    this.latestWidth = this.rnd.getSelfElement().clientWidth;
    if (onClose) onClose();
  };

  updatePos = target => {
    if (this.right < 62)
      this.left =
        window.innerWidth - (parseFloat(this.right) + parseFloat(this.width));

    this.right = window.innerWidth - (this.left + parseFloat(this.width));

    this.rnd.updatePosition({
      x: Math.round(this.left),
      y: Math.round(this.top)
    });
  };

  update = target => {
    var currentOffset = target.getBoundingClientRect().left;
    if (!this.offset || currentOffset > this.offset) {
      this.offset = target.getBoundingClientRect().left;
    }

    var width = this.rnd.getSelfElement().clientWidth;

    if (this.left < currentOffset || this.offset === this.left) {
      let n = target.getBoundingClientRect().left;
      this.rnd.updatePosition({
        x: Math.round(n)
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
        x: Math.round(w)
      });
      this.left = w;
    }
  };

  fit = target => {
    this.rnd.updatePosition({
      x: Math.round(target.getBoundingClientRect().left),
      y: Math.round(target.getBoundingClientRect().top - this.headerHeight)
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
      y: Math.round(this.top),
      x: Math.round(this.left)
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
    let t = parseFloat(this.top);
    let h = parseFloat(this.height);
    let c = this.rnd.getSelfElement().parentElement.getBoundingClientRect();
    let o = t + h + this.headerHeight;

    if (o > c.bottom) {
      this.top = this.top - o + c.bottom;
    }

    this.rnd.updatePosition({
      y: Math.round(this.top)
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
      y: Math.round(window.innerHeight - 110)
    });
    this.mode = "minimized";
  };

  maximize = e => {
    const { onMaximize } = this.props;
    if (getIsMobile()) {
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
    if (this.props.onResize) this.props.onResize();
  };

  minimize = e => {
    const { onMinimize } = this.props;
    if (this.mode === "maximized") {
      this.reset(this.rnd.getSelfElement().parentElement);
    }
    if (getIsMobile()) {
      this.moveToBottom(this.rnd.getSelfElement().parentElement);
    } else {
      this.mode = "minimized";
      this.height = this.state.height;
      this.setState({
        height: 0
      });
    }
    if (onMinimize) onMinimize();
    if (this.props.onResize) this.props.onResize();
  };

  bringToFront() {
    document.windows
      .sort((a, b) => (a === this ? 1 : b === this ? -1 : 0))
      .forEach((w, i) => {
        if (w.rnd) {
          w.rnd.getSelfElement().style.zIndex = zIndexStart + i;
        }
      });
  }

  render() {
    const {
      classes,
      title,
      children,
      features,
      open,
      localObserver
    } = this.props;
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
      if (this.mode === "minimized") {
        resizeBottom = resizeBottomLeft = resizeBottomRight = resizeTop = resizeTopLeft = resizeTopRight = resizeLeft = false;
      }
    }

    this.bringToFront();

    return (
      <Rnd
        onMouseDown={e => {
          this.bringToFront();
        }}
        ref={c => {
          this.rnd = c;
        }}
        style={{
          display: open ? "block" : "none"
        }}
        onDragStop={(e, d) => {
          this.left = this.rnd.getSelfElement().getClientRects()[0].left;
          this.top =
            this.rnd.getSelfElement().getClientRects()[0].top -
            this.headerHeight;
          this.right = window.innerWidth - (this.left + parseFloat(this.width));
        }}
        onResize={(e, direction, ref, delta, position) => {
          this.width = ref.style.width;
          if (this.mode !== "minimized") {
            this.height = ref.style.height;
          }
          this.setState({
            width: ref.style.width,
            height: ref.style.height
          });
          if (this.props.onResize) this.props.onResize();
        }}
        cancel="section,nav"
        bounds={"article"}
        disableDragging={false || getIsMobile()}
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
        minHeight={this.mode === "minimized" ? 42 : 300}
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
            localObserver={localObserver}
            onClose={this.close}
            title={title}
            top={top}
            onMaximize={this.maximize}
            onMinimize={this.minimize}
            mode={this.mode}
          />
          <section className={classes.content}>
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
