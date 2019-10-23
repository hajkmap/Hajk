import React from "react";
import propTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import ArrowLeftIcon from "@material-ui/icons/ArrowLeft";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import Typography from "@material-ui/core/Typography";
import marked from "marked";
import {
  mergeFeaturePropsWithMarkdown,
  extractPropertiesFromJson
} from "../utils/FeaturePropsParsing";
import Diagram from "./Diagram";
import Table from "./Table";

const styles = theme => ({
  windowSection: {
    display: "flex",
    flexFlow: "column",
    height: "100%"
  },
  featureList: {
    flex: 1,
    overflow: "auto"
  },
  textContent: {},
  toggler: {
    display: "flex"
  },
  togglerText: {
    flex: 1,
    textAlign: "center",
    lineHeight: "3rem"
  },
  closeButton: {
    position: "absolute",
    top: "5px",
    right: "5px",
    cursor: "pointer",
    padding: "5px"
  },
  caption: {
    marginBottom: "5px",
    fontWeight: 500
  }
});

class FeatureInfo extends React.PureComponent {
  state = {
    selectedIndex: 1,
    visible: false
  };

  static propTypes = {
    classes: propTypes.object.isRequired,
    features: propTypes.array.isRequired,
    onDisplay: propTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    marked.setOptions({
      sanitize: false,
      xhtml: true
    });
  }

  componentDidMount() {
    var left = document.getElementById("step-left");
    var right = document.getElementById("step-right");
    if (left && right) {
      left.onclick = e => {
        this.changeSelectedIndex(-1);
      };
      right.onclick = e => {
        this.changeSelectedIndex(1);
      };
    }
  }

  table(data) {
    return Object.keys(data).map((key, i) => {
      if (typeof data[key] !== "object") {
        return (
          <div key={i}>
            <strong>{key}</strong>: <span>{data[key]}</span>
          </div>
        );
      } else {
        return null;
      }
    });
  }

  changeSelectedIndex(amount) {
    var eot = false;
    if (amount > 0 && this.props.features.length === this.state.selectedIndex) {
      eot = true;
    } else if (amount < 0 && this.state.selectedIndex === 1) {
      eot = true;
    }
    if (!eot) {
      this.setState(
        {
          selectedIndex: this.state.selectedIndex + amount
        },
        () => {
          this.props.onDisplay(
            this.props.features[this.state.selectedIndex - 1]
          );
        }
      );
    }
  }

  shortcode(str) {
    var codes = [];
    var shortcodes = str.match(/\[(.*?)\]/g);
    shortcodes = shortcodes === null ? [] : shortcodes;

    if (shortcodes) {
      shortcodes.forEach(code => {
        str = str.replace(code, "");
        var params = code
          .replace("[", "")
          .replace("]", "")
          .split(" ");
        var c = {};

        params.forEach((param, i) => {
          if (i === 0) {
            c.shortcode = param;
          } else {
            let parts = param.split("=");
            c[parts[0]] = param.replace(parts[0] + "=", "").replace(/"/g, "");
          }
        });
        codes.push(c);
      });
      return {
        str: str,
        codes: codes
      };
    } else {
      return;
    }
  }

  html(features) {
    const { classes } = this.props;

    if (!features) return "";

    var visibleStyle = currentIndex => {
      var displayValue =
        this.state.selectedIndex === currentIndex + 1 ? "flex" : "none";
      return {
        display: displayValue,
        flexFlow: "column",
        height: "100%"
      };
    };
    var toggler = null;
    if (features.length > 1) {
      toggler = (
        <header className={classes.toggler}>
          <IconButton aria-label="Previous" color="primary" id="step-left">
            <ArrowLeftIcon />
          </IconButton>
          <Typography variant="button" className={classes.togglerText}>
            {this.state.selectedIndex} av {features.length}
          </Typography>
          <IconButton aria-label="Next" color="primary" id="step-right">
            <ArrowRightIcon />
          </IconButton>
        </header>
      );
    }

    var featureList = features.map((feature, i) => {
      if (i === 0) this.props.onDisplay(feature);
      var markdown =
        feature.layer.get("layerInfo") &&
        feature.layer.get("layerInfo").information;

      var caption =
        feature.layer.get("layerInfo") &&
        feature.layer.get("layerInfo").caption;
      var layer,
        shortcodes = [];

      //Problem with geojson returned from AGS - Missing id on feature - how to handle?
      if (feature.layer.layersInfo && feature.getId()) {
        layer = Object.keys(feature.layer.layersInfo).find(id => {
          var fid = feature.getId().split(".")[0];
          var layerId = id.split(":").length === 2 ? id.split(":")[1] : id;
          return fid === layerId;
        });
      }

      if (
        layer &&
        feature.layer.layersInfo &&
        feature.layer.layersInfo[layer] &&
        feature.layer.layersInfo[layer].infobox
      ) {
        markdown = feature.layer.layersInfo[layer].infobox;
      }
      //Features coming from searchresult has infobox set on Feature instead of layer due to different features sharing same vectorlayer
      if (feature.infobox) {
        markdown = feature.infobox;
      }
      var properties = feature.getProperties();
      properties = extractPropertiesFromJson(properties);

      feature.setProperties(properties);

      if (markdown) {
        let transformed = this.shortcode(markdown);
        if (transformed) {
          shortcodes = transformed.codes;
          markdown = transformed.str;
        }
      }
      var value = markdown
        ? mergeFeaturePropsWithMarkdown(markdown, properties)
        : this.table(properties);

      if (markdown) {
        return (
          <div key={i} style={visibleStyle(i)}>
            <div className={classes.caption}>{caption}</div>
            <div
              className={classes.textContent}
              dangerouslySetInnerHTML={value}
            />
            {this.renderShortcodes(shortcodes, feature)}
          </div>
        );
      } else {
        return (
          <div key={i} style={visibleStyle(i)}>
            <div className={classes.caption}>{caption}</div>
            <div className={classes.textContent}>{value}</div>
          </div>
        );
      }
    });

    return (
      <section className={classes.windowSection}>
        {toggler}
        <section className={classes.featureList}>{featureList}</section>
      </section>
    );
  }

  renderShortcodes(shortcodes, feature) {
    return shortcodes.map((shortcode, i) => {
      switch (shortcode.shortcode) {
        case "diagram":
          return (
            <Diagram key={i} source={shortcode.source} feature={feature} />
          );
        case "table":
          return <Table key={i} source={shortcode.source} feature={feature} />;
        default:
          return null;
      }
    });
  }

  render() {
    const { features } = this.props;
    return this.html(features);
  }
}

export default withStyles(styles)(FeatureInfo);
