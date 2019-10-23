import React from "react";
import propTypes from "prop-types";
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
      flexDirection: "column",
      userSelect: "none"
    },
    content: {
      flex: "1",
      overflowY: "auto",
      padding: "10px",
      cursor: "default !important",
      [theme.breakpoints.down("xs")]: {
        marginBottom: "64px"
      }
    }
  };
};

class Window extends React.PureComponent {
  static propTypes = {
    children: propTypes.object,
    classes: propTypes.object.isRequired,
    features: propTypes.array,
    globalObserver: propTypes.object.isRequired,
    height: propTypes.oneOfType([propTypes.number, propTypes.string])
      .isRequired,
    layerswitcherConfig: propTypes.object,
    map: propTypes.object,
    mode: propTypes.string.isRequired,
    onClose: propTypes.func.isRequired,
    onDisplay: propTypes.func,
    onResize: propTypes.func,
    open: propTypes.bool.isRequired,
    position: propTypes.string.isRequired,
    title: propTypes.string.isRequired,
    width: propTypes.number.isRequired
  };

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
        this.fit(document.getElementById("windows-container"));
      } else {
        this.updatePosition();
      }
    });
  }

  componentDidMount() {
    const { globalObserver } = this.props;
    if (globalObserver) {
      globalObserver.subscribe("appLoaded", () => {
        this.updatePosition();
      });
      globalObserver.subscribe("drawerToggled", () => {
        this.updatePosition();
      });
    }
  }

  /**
   * In LayerSwitcher plugin's settings, there's an option that allows
   * user to show or hide the so called "breadcrumbs": small boxes, one
   * for each active layer, that show up at the bottom of the screen.
   *
   * If breadcrumbs are activated, we should ensure that our Windows
   * don't hide breadcrumbs, by reducing Windows' default height slightly.
   *
   * This helper is used to determine whether breadcrumbs are activated
   * or not.
   *
   * @returns boolean
   * @memberof Window
   */
  areBreadcrumbsActivated() {
    return this.props.layerswitcherConfig &&
      this.props.layerswitcherConfig.hasOwnProperty("options")
      ? this.props.layerswitcherConfig.options.showBreadcrumbs
      : false;
  }

  updatePosition() {
    const { width, height, position } = this.props;
    const parent = this.rnd.getSelfElement().parentElement;

    //FIXME: JW - Not the best solution for parent resize to set top/left to 0/0, but it ensures we don't get a window outside of the parent
    this.left = 16; // Make sure we respect padding
    this.top = 16 + 62; // Respect padding + nasty hack to ensure that Window is placed below Search bar
    this.width = width || 400;
    this.height = height || 300;

    // If "auto" height is set, it means we want the Window to take up maximum space available
    if (this.height === "auto") {
      // If Breadcrumbs are activated (in LayerSwitcher's config), we must make
      // sure that our Windows leave some space at the bottom for the Breadcrumbs.
      const spaceForBreadcrumbs = this.areBreadcrumbsActivated() ? 42 : 0;
      this.height =
        parent.clientHeight - // Maximum height of parent element
        16 - // Reduce height with top margin
        16 - // Reduce height with bottom margin
        62 - // Reduce with space for Search bar
        spaceForBreadcrumbs; // If Breadcrumbs are active, make space for them as well
    }

    // If Window renders on the right, there are some things that we need to compensate for
    if (position === "right") {
      this.left = parent.getBoundingClientRect().width - width - 16 - 56; // -16 to take care of usual right padding, -56 to not cover the Control buttons that are on the right
      this.top = this.top - 62; // We won't overlap Search bar if Window is placed to the right, so don't take Search bar's height into account
      this.height = this.height + 62; // Same as above
    }

    // Mobile screens are another special case: here our Window should take up max space available
    if (getIsMobile()) {
      this.left = 0;
      this.top = 0;
      this.height = window.innerHeight;
      this.width = document.body.clientWidth;
    }

    this.left = this.left !== undefined ? this.left : 16;
    this.mode = "window";

    this.setState(
      {
        left: this.left,
        top: this.top,
        width: this.width,
        height: this.height,
        mode: this.mode
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

  fit = target => {
    this.rnd.updatePosition({
      x: Math.round(target.getBoundingClientRect().left),
      y: Math.round(target.getBoundingClientRect().top)
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
    let o = t + h;

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
      y: Math.round(window.innerHeight - 106)
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
          this.fit(document.getElementById("windows-container"));
          break;
        case "maximized":
          this.reset(document.getElementById("windows-container"));
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
    if (getIsMobile()) {
      this.moveToBottom();
    }
    if (this.mode === "minimized") {
      return;
    }
    if (this.mode === "maximized") {
      this.reset(document.getElementById("windows-container"));
    }
    if (getIsMobile()) {
      this.moveToBottom();
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
    const { children, classes, features, open, title } = this.props;
    const { left, top, width, height } = this.state;

    let resizeBottom = true,
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
        onMouseOver={e => e.stopPropagation()} // If this bubbles, we'll have Tooltip show up even when we're only on Window. FIXME: Not needed when we change the rendering order.
        ref={c => {
          this.rnd = c;
        }}
        style={{
          display: open ? "block" : "none"
        }}
        onDragStop={(e, d) => {
          const rect = this.rnd.getSelfElement().getClientRects()[0];
          if (rect) {
            this.left = rect.left;
            this.top = rect.top;
            this.right =
              window.innerWidth - (this.left + parseFloat(this.width));
          }
        }}
        onResizeStop={(e, direction, ref, delta, position) => {
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
        bounds={"#windows-container"}
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
        minWidth={200}
        minHeight={this.mode === "minimized" ? 42 : 200}
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

export default withStyles(styles)(Window);
